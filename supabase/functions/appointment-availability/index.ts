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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: slots, error: slotsError } = await supabase
      .from("appointment_slots")
      .select("*")
      .order("starts_at");

    if (slotsError) throw slotsError;

    const { data: appointments, error: aptError } = await supabase
      .from("appointments")
      .select("id, title, scheduled_at, duration_minutes, status")
      .in("status", ["pending", "confirmed"])
      .order("scheduled_at");

    if (aptError) throw aptError;

    return new Response(
      JSON.stringify({ slots: slots ?? [], appointments: appointments ?? [] }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Availability error:", error);
    return new Response(
      JSON.stringify({ error: "Impossible de recuperer les rendez-vous." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
