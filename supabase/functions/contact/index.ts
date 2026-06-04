import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, phone, email, service, message, privacyAccepted, website, captchaToken } =
      await req.json();

    // Honeypot
    if (website) {
      return new Response(JSON.stringify({ error: "Message refuse." }), {
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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const recipientEmail =
      Deno.env.get("CONTACT_RECIPIENT_EMAIL") || "Rcservices68320@gmail.com";
    const fromEmail =
      Deno.env.get("DEFAULT_FROM_EMAIL") || "noreply@rcservices.fr";

    const subject = `Demande de devis - ${service}`;
    const body = [
      `Nom : ${name}`,
      `Telephone : ${phone}`,
      `Email : ${email}`,
      `Service : ${service}`,
      "",
      "Message :",
      message,
    ].join("\n");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject,
        text: body,
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      console.error("Resend error:", errorBody);
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ detail: "Message envoye." }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact function error:", error);
    return new Response(
      JSON.stringify({
        error: "Impossible d'envoyer la demande pour le moment.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
