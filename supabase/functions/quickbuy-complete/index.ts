import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface QuickBuyRequest {
    reference: string;
    plan_id: string;
    location_id: string;
    email: string;
    amount: number;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body: QuickBuyRequest = await req.json();
        const { reference, plan_id, location_id, email, amount } = body;

        console.log("Quick buy request:", JSON.stringify(body));

        if (!reference || !plan_id || !location_id || !email) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 1. Idempotency check — if already processed, return the existing result
        const { data: existingPurchase } = await supabase
            .from("quick_purchases")
            .select("*")
            .eq("paystack_reference", reference)
            .single();

        if (existingPurchase && existingPurchase.status === "completed") {
            console.log("Already processed reference:", reference);
            return new Response(
                JSON.stringify({
                    success: true,
                    credential: {
                        username: existingPurchase.mikrotik_username,
                        password: existingPurchase.mikrotik_password,
                    },
                    already_processed: true,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Verify the payment with Paystack API
        const { data: secretKeyData } = await supabase
            .from("admin_settings")
            .select("value")
            .eq("key", "paystack_secret_key")
            .single();

        if (!secretKeyData?.value) {
            return new Response(
                JSON.stringify({ error: "Paystack not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const paystackVerifyRes = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${secretKeyData.value}`,
                },
            }
        );

        const paystackData = await paystackVerifyRes.json();
        console.log("Paystack verification:", JSON.stringify(paystackData));

        if (
            !paystackData.status ||
            paystackData.data?.status !== "success"
        ) {
            // Create failed record
            await supabase.from("quick_purchases").upsert({
                paystack_reference: reference,
                email,
                plan_id,
                location_id,
                amount: amount / 100, // kobo to naira
                status: "failed",
            }, { onConflict: "paystack_reference" });

            return new Response(
                JSON.stringify({ error: "Payment verification failed", details: paystackData.message }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Get plan details for expiry calculation
        const { data: plan } = await supabase
            .from("plans")
            .select("*")
            .eq("id", plan_id)
            .single();

        if (!plan) {
            return new Response(
                JSON.stringify({ error: "Plan not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Find an available credential
        const { data: credential, error: credError } = await supabase
            .from("credential_pools")
            .select("*")
            .eq("location_id", location_id)
            .eq("plan_id", plan_id)
            .eq("status", "available")
            .limit(1)
            .single();

        if (credError || !credential) {
            console.error("No available credentials:", credError);
            return new Response(
                JSON.stringify({ error: "No credentials available for this plan/location. Please try again later." }),
                { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 5. Mark credential as used
        const { error: updateCredError } = await supabase
            .from("credential_pools")
            .update({
                status: "used",
                assigned_at: new Date().toISOString(),
            })
            .eq("id", credential.id)
            .eq("status", "available"); // Optimistic lock

        if (updateCredError) {
            console.error("Failed to assign credential:", updateCredError);
            return new Response(
                JSON.stringify({ error: "Failed to assign credential. Please try again." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 6. Calculate expiry
        const expiresAt = new Date(
            Date.now() + plan.duration_hours * 60 * 60 * 1000
        ).toISOString();

        // 7. Create/update the quick purchase record
        const { data: purchase, error: purchaseError } = await supabase
            .from("quick_purchases")
            .upsert(
                {
                    paystack_reference: reference,
                    email,
                    plan_id,
                    location_id,
                    credential_id: credential.id,
                    amount: (paystackData.data?.amount || amount) / 100, // kobo to naira
                    mikrotik_username: credential.username,
                    mikrotik_password: credential.password,
                    status: "completed",
                    expires_at: expiresAt,
                },
                { onConflict: "paystack_reference" }
            )
            .select()
            .single();

        if (purchaseError) {
            console.error("Failed to create purchase record:", purchaseError);
            // Still return credentials since payment was verified and credential was assigned
        }

        console.log("Quick buy completed successfully:", reference);

        return new Response(
            JSON.stringify({
                success: true,
                credential: {
                    username: credential.username,
                    password: credential.password,
                },
                plan_name: plan.name,
                expires_at: expiresAt,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Quick buy error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
