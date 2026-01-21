import { supabase } from './supabase';

export interface PaystackConfig {
    publicKey: string;
    secretKey: string;
    environment: 'test' | 'live';
}

export interface PaystackCheckoutOptions {
    email: string;
    amount: number; // in kobo (smallest currency unit)
    reference?: string;
    currency?: string;
    metadata?: Record<string, any>;
    onSuccess: (reference: string) => void;
    onClose: () => void;
}

// Fetch Paystack public key from admin settings
export const getPaystackPublicKey = async (): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'paystack_public_key')
            .single();

        if (error || !data?.value) {
            console.error('Error fetching Paystack public key:', error);
            return null;
        }

        return data.value;
    } catch (error) {
        console.error('Error fetching Paystack public key:', error);
        return null;
    }
};

// Fetch active payment gateway
export const getActivePaymentGateway = async (): Promise<'flutterwave' | 'paystack' | 'both'> => {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'active_payment_gateway')
            .single();

        if (error || !data?.value) {
            return 'flutterwave'; // Default
        }

        return data.value as 'flutterwave' | 'paystack' | 'both';
    } catch (error) {
        console.error('Error fetching active gateway:', error);
        return 'flutterwave';
    }
};

// Initialize Paystack checkout using their inline popup
export const initializePaystackCheckout = async (options: PaystackCheckoutOptions): Promise<void> => {
    const publicKey = await getPaystackPublicKey();

    if (!publicKey) {
        throw new Error('Paystack is not configured. Please contact support.');
    }

    // Generate unique reference if not provided
    const reference = options.reference || `PS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Load Paystack inline script if not already loaded
    if (!(window as any).PaystackPop) {
        await loadPaystackScript();
    }

    const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email: options.email,
        amount: options.amount, // Amount in kobo
        currency: options.currency || 'NGN',
        ref: reference,
        metadata: {
            custom_fields: [
                {
                    display_name: 'Transaction Type',
                    variable_name: 'transaction_type',
                    value: 'wallet_funding'
                },
                ...(options.metadata?.custom_fields || [])
            ],
            ...options.metadata
        },
        callback: (response: any) => {
            console.log('Paystack payment successful:', response);
            options.onSuccess(response.reference);
        },
        onClose: () => {
            console.log('Paystack popup closed');
            options.onClose();
        }
    });

    handler.openIframe();
};

// Helper to load paystack inline script
const loadPaystackScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if ((window as any).PaystackPop) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Paystack script'));
        document.head.appendChild(script);
    });
};

// Verify payment on server side (should be called after successful payment)
export const verifyPaystackPayment = async (reference: string, userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        // Call edge function to verify and credit wallet
        const { error } = await supabase.functions.invoke('paystack-webhook', {
            body: {
                event: 'charge.success',
                data: {
                    reference,
                    userId,
                    manual_verification: true
                }
            }
        });

        if (error) {
            console.error('Error verifying payment:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return { success: false, error: error.message };
    }
};
