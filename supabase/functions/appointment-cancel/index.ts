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
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "ID manquant." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get appointment
    const { data: appointment, error: fetchError } = await serviceClient
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !appointment) {
      return new Response(JSON.stringify({ error: "Rendez-vous introuvable." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Restore start slot
    await serviceClient
      .from("appointment_slots")
      .upsert(
        { starts_at: appointment.scheduled_at, duration_minutes: 60 },
        { onConflict: "starts_at" },
      );

    // Delete appointment
    const { error: deleteError } = await serviceClient
      .from("appointments")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return new Response(
      JSON.stringify({ error: "Impossible de refuser ce rendez-vous." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
