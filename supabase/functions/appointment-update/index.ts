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
  if (hour < 8 || hour > 18)
    return "Les rendez-vous sont possibles tous les jours, de 8h a 19h.";
  if (minute !== 0 || second !== 0)
    return "Les rendez-vous doivent commencer sur une tranche horaire pleine.";
  return null;
}

function validateHourDuration(d: number): string | null {
  if (d < 60 || d % 60 !== 0) return "La duree doit etre definie par tranche de 1h.";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorise." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorise." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { id, title, customer_name, customer_email, customer_phone, scheduled_at, duration_minutes, notes } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "ID manquant." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get current appointment
    const { data: current, error: fetchError } = await serviceClient
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return new Response(JSON.stringify({ error: "Rendez-vous introuvable." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newScheduledAt = scheduled_at || current.scheduled_at;
    const newDuration = duration_minutes || current.duration_minutes;

    // Validate time grid if scheduled_at changed
    if (scheduled_at && scheduled_at !== current.scheduled_at) {
      const gridError = validateHourGrid(newScheduledAt);
      if (gridError) {
        return new Response(JSON.stringify({ error: gridError }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check no overlapping appointments
      const endAt = getEndAt(newScheduledAt, newDuration);
      const { data: existing } = await serviceClient
        .from("appointments")
        .select("id, scheduled_at, duration_minutes")
        .in("status", ["pending", "confirmed"])
        .neq("id", id);

      for (const apt of existing ?? []) {
        const aptEndAt = getEndAt(apt.scheduled_at, apt.duration_minutes);
        if (
          new Date(newScheduledAt) < aptEndAt &&
          endAt > new Date(apt.scheduled_at)
        ) {
          return new Response(
            JSON.stringify({ error: "Ce creneau est deja demande ou reserve." }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      // Restore old slot
      await serviceClient
        .from("appointment_slots")
        .upsert(
          { starts_at: current.scheduled_at, duration_minutes: 60 },
          { onConflict: "starts_at" },
        );
    }

    // Update appointment
    const { data: updated, error: updateError } = await serviceClient
      .from("appointments")
      .update({
        title: title ?? current.title,
        customer_name: customer_name ?? current.customer_name,
        customer_email: customer_email ?? current.customer_email,
        customer_phone: customer_phone ?? current.customer_phone,
        scheduled_at: newScheduledAt,
        duration_minutes: newDuration,
        notes: notes ?? current.notes,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Consume slots for new scheduled_at
    const endAt = getEndAt(newScheduledAt, newDuration);
    await serviceClient
      .from("appointment_slots")
      .delete()
      .gte("starts_at", newScheduledAt)
      .lt("starts_at", endAt.toISOString());

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    return new Response(
      JSON.stringify({ error: "Impossible de modifier ce rendez-vous." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
