import React, { useState, useEffect } from 'react';
import { Wifi, MapPin, ChevronRight, ChevronLeft, Copy, Check, Zap, Clock, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { initializePaystackCheckout } from '../utils/paystack';
import { getCorrectDurationDisplay } from '../utils/planDurationHelper';

interface Plan {
    id: string;
    name: string;
    duration: string;
    duration_hours: number;
    price: number;
    data_amount: string;
    type: string;
    popular: boolean;
    is_unlimited: boolean;
    is_active: boolean;
    order: number;
}

interface Location {
    id: string;
    name: string;
    wifi_name: string;
    is_active: boolean;
}

type Step = 'location' | 'plan' | 'checkout' | 'success';

export const QuickBuyPage: React.FC = () => {
    const [step, setStep] = useState<Step>('location');
    const [locations, setLocations] = useState<Location[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [credential, setCredential] = useState<{ username: string; password: string } | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Fetch locations and plans on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [locRes, planRes] = await Promise.all([
                    supabase.from('locations').select('*').eq('is_active', true),
                    supabase.from('plans').select('*').eq('is_active', true).order('order', { ascending: true }),
                ]);

                if (locRes.data) setLocations(locRes.data);
                if (planRes.data) setPlans(planRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load plans. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handlePayment = async () => {
        if (!selectedPlan || !selectedLocation || !email) return;

        setPaying(true);
        setError(null);

        try {
            await initializePaystackCheckout({
                email,
                amount: selectedPlan.price * 100, // Convert to kobo
                metadata: {
                    plan_id: selectedPlan.id,
                    location_id: selectedLocation.id,
                    transaction_type: 'quickbuy',
                    custom_fields: [
                        { display_name: 'Transaction Type', variable_name: 'transaction_type', value: 'quickbuy' },
                        { display_name: 'Plan', variable_name: 'plan_name', value: selectedPlan.name },
                        { display_name: 'Location', variable_name: 'location_name', value: selectedLocation.name },
                    ],
                },
                onSuccess: async (reference: string) => {
                    setPaying(false);
                    setProcessing(true);

                    try {
                        // Call edge function to verify & assign credential
                        // Using direct fetch to avoid potential client-side issues with supabase-js invoke
                        const {
                            VITE_SUPABASE_URL,
                            VITE_SUPABASE_ANON_KEY
                        } = import.meta.env;

                        const functionUrl = `${VITE_SUPABASE_URL}/functions/v1/quickbuy-complete`;

                        const response = await fetch(functionUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`,
                            },
                            body: JSON.stringify({
                                reference,
                                plan_id: selectedPlan.id,
                                location_id: selectedLocation.id,
                                email,
                                amount: selectedPlan.price * 100,
                            }),
                        });

                        const responseData = await response.json();

                        if (!response.ok) {
                            throw new Error(responseData.error || responseData.details || 'Failed to complete purchase');
                        }

                        if (responseData.success && responseData.credential) {
                            setCredential(responseData.credential);
                            setExpiresAt(responseData.expires_at || null);
                            setStep('success');
                        } else {
                            throw new Error(responseData.error || 'Failed to assign credentials');
                        }
                    } catch (err: any) {
                        console.error('Quick buy completion error:', err);
                        setError(err.message || 'Payment was successful but credential assignment failed. Please contact support with your reference: ' + reference);
                    } finally {
                        setProcessing(false);
                    }
                },
                onClose: () => {
                    setPaying(false);
                },
            });
        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Failed to initialize payment');
            setPaying(false);
        }
    };

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-lg">Loading plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        <img src="/starline-logo.png" alt="IzyConnect" className="h-8 w-auto" />
                    </a>

                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 pb-24">
                {/* Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-orange-300">Quick Buy — No Signup Required</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Get WiFi Instantly
                    </h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto">
                        Choose a plan, pay securely, and connect in seconds.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-1 mb-10">
                    {(['location', 'plan', 'checkout', 'success'] as Step[]).map((s, i) => {
                        const labels = ['Location', 'Plan', 'Pay', 'Done'];
                        const stepIndex = ['location', 'plan', 'checkout', 'success'].indexOf(step);
                        const isActive = i === stepIndex;
                        const isComplete = i < stepIndex;

                        return (
                            <React.Fragment key={s}>
                                {i > 0 && (
                                    <div className={`w-8 md:w-16 h-0.5 ${isComplete ? 'bg-orange-500' : 'bg-white/10'}`}></div>
                                )}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isActive ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-500/40' :
                                        isComplete ? 'bg-orange-500/80 text-white' :
                                            'bg-white/10 text-gray-500'
                                        }`}>
                                        {isComplete ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-xs font-medium ${isActive ? 'text-orange-400' : isComplete ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {labels[i]}
                                    </span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-300 text-xs mt-1 underline">Dismiss</button>
                    </div>
                )}

                {/* Processing Overlay */}
                {processing && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
                            <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
                            <h3 className="text-xl font-bold text-white mb-2">Assigning Your Credentials</h3>
                            <p className="text-gray-400 text-sm">Please wait while we verify your payment and activate your plan...</p>
                        </div>
                    </div>
                )}

                {/* ====== STEP 1: Select Location ====== */}
                {step === 'location' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-orange-400" />
                            Select Your Location
                        </h2>
                        <p className="text-gray-400 text-sm">Choose the WiFi hotspot near you.</p>

                        {locations.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>No locations available at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {locations.map((loc) => (
                                    <button
                                        key={loc.id}
                                        onClick={() => {
                                            setSelectedLocation(loc);
                                            setStep('plan');
                                        }}
                                        className="group w-full text-left p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-orange-500/30 transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-orange-600/20 transition-all">
                                                    <Wifi className="w-5 h-5 text-orange-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white text-lg">{loc.name}</p>
                                                    <p className="text-sm text-gray-400 font-mono">{loc.wifi_name}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-400 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ====== STEP 2: Select Plan ====== */}
                {step === 'plan' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setStep('location')}
                            className="flex items-center gap-1 text-sm text-gray-400 hover:text-orange-400 transition-colors mb-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> Change Location
                        </button>

                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-300 mb-2">
                            <MapPin className="w-3.5 h-3.5 text-orange-400" />
                            {selectedLocation?.name} — <span className="font-mono text-orange-300">{selectedLocation?.wifi_name}</span>
                        </div>

                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-orange-400" />
                            Choose a Plan
                        </h2>

                        {plans.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Wifi className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>No plans available at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        onClick={() => {
                                            setSelectedPlan(plan);
                                            setStep('checkout');
                                        }}
                                        className={`group relative w-full text-left p-5 rounded-2xl border transition-all duration-300 ${plan.popular
                                            ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:from-orange-500/15 hover:to-orange-600/10'
                                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-orange-500/30'
                                            }`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-lg shadow-orange-500/30">
                                                POPULAR
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-bold text-white text-lg">{plan.name}</p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-sm text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {getCorrectDurationDisplay(plan.duration_hours)}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        {plan.is_unlimited ? '∞ Unlimited' : plan.data_amount}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-orange-400">₦{plan.price.toLocaleString()}</p>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors ml-auto mt-1" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ====== STEP 3: Checkout ====== */}
                {step === 'checkout' && selectedPlan && (
                    <div className="space-y-6 max-w-md mx-auto">
                        <button
                            onClick={() => setStep('plan')}
                            className="flex items-center gap-1 text-sm text-gray-400 hover:text-orange-400 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Change Plan
                        </button>

                        {/* Order Summary */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Order Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Location</span>
                                    <span className="text-white font-medium">{selectedLocation?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">WiFi Network</span>
                                    <span className="text-orange-300 font-mono text-xs">{selectedLocation?.wifi_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Plan</span>
                                    <span className="text-white font-medium">{selectedPlan.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="text-white">{getCorrectDurationDisplay(selectedPlan.duration_hours)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Data</span>
                                    <span className="text-white">{selectedPlan.is_unlimited ? 'Unlimited' : selectedPlan.data_amount}</span>
                                </div>
                                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                                    <span className="text-gray-300 font-medium">Total</span>
                                    <span className="text-2xl font-black text-orange-400">₦{selectedPlan.price.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>



                        {/* Pay Button */}
                        <button
                            onClick={handlePayment}
                            disabled={!isValidEmail(email) || paying}
                            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {paying ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Opening Payment...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    Pay ₦{selectedPlan.price.toLocaleString()} Securely
                                </>
                            )}
                        </button>

                        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            Secured by Paystack. Your card details are never stored.
                        </p>
                    </div>
                )}

                {/* ====== STEP 4: Success ====== */}
                {step === 'success' && credential && (
                    <div className="max-w-md mx-auto space-y-6">
                        {/* Success Header */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/30">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">Payment Successful!</h2>
                            <p className="text-gray-400">Your WiFi credentials are ready</p>
                        </div>

                        {/* Credentials Card */}
                        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-medium text-orange-300 uppercase tracking-wider">Your WiFi Login</h3>

                            {/* Username */}
                            <div className="bg-black/30 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Username</p>
                                        <p className="text-xl font-mono font-bold text-white">{credential.username}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(credential.username, 'username')}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        {copiedField === 'username' ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="bg-black/30 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Password</p>
                                        <p className="text-xl font-mono font-bold text-white">{credential.password}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(credential.password, 'password')}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        {copiedField === 'password' ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {expiresAt && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>Expires: {new Date(expiresAt).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Connection Instructions */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-4">How to Connect</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                                    <p className="text-gray-300 text-sm">
                                        Connect to WiFi: <span className="font-mono font-bold text-orange-300">{selectedLocation?.wifi_name}</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                                    <p className="text-gray-300 text-sm">Open your browser — the login page will appear automatically</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                                    <p className="text-gray-300 text-sm">Enter the username and password above to start browsing</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <a
                                href="/"
                                className="flex-1 py-3.5 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all text-center text-sm border border-white/10"
                            >
                                Go Home
                            </a>
                            <button
                                onClick={() => {
                                    setStep('location');
                                    setSelectedLocation(null);
                                    setSelectedPlan(null);
                                    setEmail('');
                                    setCredential(null);
                                    setExpiresAt(null);
                                }}
                                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all text-center text-sm shadow-lg shadow-orange-500/20"
                            >
                                Buy Another Plan
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-6">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <p className="text-xs text-gray-600">
                        © {new Date().getFullYear()} IzyConnect. Payments secured by Paystack.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default QuickBuyPage;
