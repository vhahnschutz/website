import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function toParisTime(utcDate: string) {
  return new Date(
    new Date(utcDate).toLocaleString("en-US", { timeZone: "Europe/Paris" }),
  );
}

function validateHourGrid(startsAt: string): string | null {
  const local = toParisTime(startsAt);
  const hour = local.getHours();
  const minute = local.getMinutes();
  const second = local.getSeconds();

  if (hour < 8 || hour > 18) {
    return "Les rendez-vous sont possibles tous les jours, de 8h a 19h.";
  }
  if (minute !== 0 || second !== 0) {
    return "Les rendez-vous doivent commencer sur une tranche horaire pleine.";
  }
  return null;
}

function validateHourDuration(durationMinutes: number): string | null {
  if (durationMinutes < 60 || durationMinutes % 60 !== 0) {
    return "La duree doit etre definie par tranche de 1h.";
  }
  return null;
}

function getEndAt(startsAt: string, durationMinutes: number): Date {
  return new Date(new Date(startsAt).getTime() + durationMinutes * 60000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      title,
      customer_name,
      customer_email,
      customer_phone,
      scheduled_at,
      notes,
      privacyAccepted,
      website,
      captchaToken,
    } = body;

    // Honeypot
    if (website) {
      return new Response(JSON.stringify({ error: "Demande refusee." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!privacyAccepted) {
      return new Response(
        JSON.stringify({
          error: "La politique de confidentialite doit etre acceptee.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // hCaptcha verification
    if (!captchaToken) {
      return new Response(
        JSON.stringify({ error: "La verification anti-spam est obligatoire." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const hCaptchaSecret = Deno.env.get("HCAPTCHA_SECRET_KEY");
    if (!hCaptchaSecret) {
      console.error("HCAPTCHA_SECRET_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Erreur de configuration du serveur." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const verifyRes = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `response=${encodeURIComponent(captchaToken)}&secret=${encodeURIComponent(hCaptchaSecret)}`,
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return new Response(
        JSON.stringify({ error: "La verification anti-spam a echoue. Veuillez reessayer." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate time grid
    const gridError = validateHourGrid(scheduled_at);
    if (gridError) {
      return new Response(JSON.stringify({ error: gridError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate duration
    const durationMinutes = 60;
    const durationError = validateHourDuration(durationMinutes);
    if (durationError) {
      return new Response(JSON.stringify({ error: durationError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check slot exists
    const { data: slot, error: slotError } = await supabase
      .from("appointment_slots")
      .select("id")
      .eq("starts_at", scheduled_at)
      .single();

    if (slotError || !slot) {
      return new Response(
        JSON.stringify({
          error: "Ce creneau n est pas ouvert a la prise de rendez-vous.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check no overlapping appointments
    const endAt = getEndAt(scheduled_at, durationMinutes);
    const { data: existing } = await supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .in("status", ["pending", "confirmed"]);

    for (const apt of existing ?? []) {
      const aptEndAt = getEndAt(apt.scheduled_at, apt.duration_minutes);
      if (
        new Date(scheduled_at) < aptEndAt &&
        endAt > new Date(apt.scheduled_at)
      ) {
        return new Response(
          JSON.stringify({
            error: "Ce creneau est deja demande ou reserve.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Insert appointment
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        title: title || "Demande de rendez-vous",
        customer_name: customer_name || "",
        customer_email: customer_email || "",
        customer_phone: customer_phone || "",
        scheduled_at,
        duration_minutes: durationMinutes,
        status: "pending",
        notes: notes || "",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Consume slots
    await supabase
      .from("appointment_slots")
      .delete()
      .gte("starts_at", scheduled_at)
      .lt("starts_at", endAt.toISOString());

    // Send email notification
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const recipientEmail =
      Deno.env.get("CONTACT_RECIPIENT_EMAIL") || "Rcservices68320@gmail.com";
    const fromEmail =
      Deno.env.get("DEFAULT_FROM_EMAIL") || "noreply@rcservices.fr";

    const emailBody = [
      "Une nouvelle demande de rendez-vous a ete deposee.",
      "",
      `Nom : ${customer_name}`,
      `Telephone : ${customer_phone}`,
      `Email : ${customer_email}`,
      `Creneau : ${new Date(scheduled_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" })} a ${new Date(scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}`,
      `Objet : ${title}`,
      "",
      "Message :",
      notes || "-",
    ].join("\n");

    if (resendApiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          subject: "Nouvelle demande de rendez-vous",
          text: emailBody,
        }),
      });
    }

    return new Response(JSON.stringify(appointment), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Appointment request error:", error);
    return new Response(
      JSON.stringify({
        error: "Impossible d'envoyer la demande de rendez-vous.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
