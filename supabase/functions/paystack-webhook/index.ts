import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaystackWebhookPayload {
    event: string;
    data: {
        reference: string;
        amount: number; // in kobo
        currency: string;
        status: string;
        customer?: {
            email: string;
        };
        metadata?: {
            user_id?: string;
            deposit_amount?: number;
        };
        manual_verification?: boolean;
        userId?: string;
    };
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload: PaystackWebhookPayload = await req.json();
        console.log("Paystack webhook received:", JSON.stringify(payload, null, 2));

        // Only process successful charge events
        if (payload.event !== "charge.success") {
            return new Response(
                JSON.stringify({ message: "Event not handled" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { reference, amount, metadata } = payload.data;
        const amountInNaira = amount / 100; // Convert kobo to naira

        // Get user ID from metadata or manual verification
        let userId = metadata?.user_id || payload.data.userId;

        if (!userId && payload.data.customer?.email) {
            // Try to find user by email
            const { data: userProfile } = await supabaseClient
                .from("profiles")
                .select("id")
                .eq("email", payload.data.customer.email)
                .single();

            if (userProfile) {
                userId = userProfile.id;
            }
        }

        if (!userId) {
            console.error("No user ID found for payment:", reference);
            return new Response(
                JSON.stringify({ error: "User not found for payment" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check if transaction already processed (idempotency)
        const { data: existingTx } = await supabaseClient
            .from("transactions")
            .select("id")
            .eq("paystack_reference", reference)
            .single();

        if (existingTx) {
            console.log("Transaction already processed:", reference);
            return new Response(
                JSON.stringify({ message: "Transaction already processed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get current wallet balance
        const { data: profile } = await supabaseClient
            .from("profiles")
            .select("wallet_balance")
            .eq("id", userId)
            .single();

        if (!profile) {
            console.error("Profile not found:", userId);
            return new Response(
                JSON.stringify({ error: "Profile not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const newBalance = (profile.wallet_balance || 0) + amountInNaira;

        // Update wallet balance
        const { error: updateError } = await supabaseClient
            .from("profiles")
            .update({ wallet_balance: newBalance })
            .eq("id", userId);

        if (updateError) {
            console.error("Error updating wallet:", updateError);
            throw updateError;
        }

        // Record transaction
        const { error: txError } = await supabaseClient
            .from("transactions")
            .insert({
                user_id: userId,
                type: "credit",
                amount: amountInNaira,
                description: "Wallet funding via Paystack",
                status: "completed",
                paystack_reference: reference,
                created_at: new Date().toISOString()
            });

        if (txError) {
            console.error("Error recording transaction:", txError);
            // Don't throw - wallet was already credited
        }

        console.log(`Wallet credited: ${userId} +₦${amountInNaira}, new balance: ₦${newBalance}`);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Wallet credited successfully",
                new_balance: newBalance
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Webhook error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
