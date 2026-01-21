import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Wallet, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { initializePaystackCheckout, getActivePaymentGateway, verifyPaystackPayment } from '../../utils/paystack';
import { supabase } from '../../utils/supabase';

interface FundWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    darkMode?: boolean;
}

interface FundingSettings {
    funding_charge_enabled: boolean;
    funding_charge_type: 'percentage' | 'fixed';
    funding_charge_value: number;
    funding_charge_min_deposit: number;
    funding_charge_max_deposit: number;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({ isOpen, onClose, onSuccess, darkMode = false }) => {
    const { user, refreshSession } = useAuth();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeGateway, setActiveGateway] = useState<'flutterwave' | 'paystack' | 'both'>('flutterwave');
    const [selectedGateway, setSelectedGateway] = useState<'flutterwave' | 'paystack'>('flutterwave');
    const [fundingSettings, setFundingSettings] = useState<FundingSettings | null>(null);
    const [step, setStep] = useState<'amount' | 'processing' | 'success'>('amount');

    useEffect(() => {
        if (isOpen) {
            loadSettings();
            setStep('amount');
            setAmount('');
            setError('');
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            // Load funding settings
            const { data: settingsData } = await supabase
                .from('admin_settings')
                .select('key, value')
                .in('key', ['funding_charge_enabled', 'funding_charge_type', 'funding_charge_value', 'funding_charge_min_deposit', 'funding_charge_max_deposit']);

            if (settingsData) {
                const settingsMap = settingsData.reduce((acc: any, s: any) => {
                    acc[s.key] = s.value;
                    return acc;
                }, {});

                setFundingSettings({
                    funding_charge_enabled: settingsMap.funding_charge_enabled === 'true',
                    funding_charge_type: settingsMap.funding_charge_type || 'percentage',
                    funding_charge_value: parseFloat(settingsMap.funding_charge_value || '0'),
                    funding_charge_min_deposit: parseFloat(settingsMap.funding_charge_min_deposit || '100'),
                    funding_charge_max_deposit: parseFloat(settingsMap.funding_charge_max_deposit || '0'),
                });
            }

            // Load active gateway
            const gateway = await getActivePaymentGateway();
            setActiveGateway(gateway);
            setSelectedGateway(gateway === 'both' ? 'paystack' : gateway);
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

    const calculateCharge = (depositAmount: number): number => {
        if (!fundingSettings?.funding_charge_enabled) return 0;

        if (fundingSettings.funding_charge_type === 'percentage') {
            return (depositAmount * fundingSettings.funding_charge_value) / 100;
        }
        return fundingSettings.funding_charge_value;
    };

    const handlePaystackPayment = async () => {
        if (!user) return;

        const depositAmount = parseFloat(amount);
        if (!depositAmount || depositAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (fundingSettings && depositAmount < fundingSettings.funding_charge_min_deposit) {
            setError(`Minimum deposit is ₦${fundingSettings.funding_charge_min_deposit}`);
            return;
        }

        if (fundingSettings && fundingSettings.funding_charge_max_deposit > 0 && depositAmount > fundingSettings.funding_charge_max_deposit) {
            setError(`Maximum deposit is ₦${fundingSettings.funding_charge_max_deposit}`);
            return;
        }

        setLoading(true);
        setError('');
        setStep('processing');

        try {
            const amountInKobo = Math.round(depositAmount * 100); // Convert to kobo

            await initializePaystackCheckout({
                email: user.email,
                amount: amountInKobo,
                metadata: {
                    user_id: user.id,
                    deposit_amount: depositAmount,
                },
                onSuccess: async (reference) => {
                    console.log('Payment successful, reference:', reference);

                    // Verify payment and credit wallet
                    const result = await verifyPaystackPayment(reference, user.id);

                    if (result.success) {
                        setStep('success');
                        await refreshSession();
                        setTimeout(() => {
                            onSuccess();
                            onClose();
                        }, 2000);
                    } else {
                        setError(result.error || 'Payment verification failed');
                        setStep('amount');
                    }
                    setLoading(false);
                },
                onClose: () => {
                    setLoading(false);
                    setStep('amount');
                }
            });
        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Failed to initialize payment');
            setLoading(false);
            setStep('amount');
        }
    };

    const handleSubmit = () => {
        if (selectedGateway === 'paystack') {
            handlePaystackPayment();
        } else {
            // Flutterwave flow - redirect to virtual account or inline checkout
            // For now, show a message to use virtual account
            setError('Please use your virtual account for Flutterwave funding.');
        }
    };

    if (!isOpen) return null;

    const depositAmount = parseFloat(amount) || 0;
    const charge = calculateCharge(depositAmount);
    const totalAmount = depositAmount + charge;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className={`w-full max-w-md p-6 ${darkMode ? 'bg-zinc-900 border-zinc-800' : ''}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
                            <Wallet className="text-[#FF5F00]" size={20} />
                        </div>
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fund Wallet</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                    >
                        <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                    </button>
                </div>

                {step === 'success' ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-[#FF5F00] mx-auto mb-4" />
                        <h4 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Payment Successful!</h4>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your wallet has been credited.</p>
                    </div>
                ) : step === 'processing' ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-[#FF5F00] mx-auto mb-4 animate-spin" />
                        <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Processing Payment...</h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Please complete the payment in the popup window.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Gateway Selection (if both available) */}
                        {activeGateway === 'both' && (
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setSelectedGateway('paystack')}
                                        className={`p-3 rounded-lg border-2 transition-all ${selectedGateway === 'paystack'
                                            ? 'border-[#FF5F00] bg-orange-50'
                                            : darkMode ? 'border-zinc-700 bg-zinc-800' : 'border-gray-200'
                                            }`}
                                    >
                                        <CreditCard className={`mx-auto mb-1 ${selectedGateway === 'paystack' ? 'text-[#FF5F00]' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                                        <span className={`text-sm font-medium ${selectedGateway === 'paystack' ? 'text-[#FF5F00]' : darkMode ? 'text-white' : 'text-gray-700'}`}>Paystack</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedGateway('flutterwave')}
                                        className={`p-3 rounded-lg border-2 transition-all ${selectedGateway === 'flutterwave'
                                            ? 'border-orange-500 bg-orange-50'
                                            : darkMode ? 'border-zinc-700 bg-zinc-800' : 'border-gray-200'
                                            }`}
                                    >
                                        <CreditCard className={`mx-auto mb-1 ${selectedGateway === 'flutterwave' ? 'text-orange-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                                        <span className={`text-sm font-medium ${selectedGateway === 'flutterwave' ? 'text-orange-500' : darkMode ? 'text-white' : 'text-gray-700'}`}>Flutterwave</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Amount (₦)
                            </label>
                            <Input
                                value={amount}
                                onChange={setAmount}
                                placeholder="Enter amount"
                                type="number"
                                className={darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
                            />
                        </div>

                        {/* Quick Amounts */}
                        <div className="flex gap-2 flex-wrap">
                            {[500, 1000, 2000, 5000].map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setAmount(amt.toString())}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${darkMode
                                        ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    ₦{amt.toLocaleString()}
                                </button>
                            ))}
                        </div>

                        {/* Summary */}
                        {depositAmount > 0 && (
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Amount:</span>
                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>₦{depositAmount.toLocaleString()}</span>
                                    </div>
                                    {fundingSettings?.funding_charge_enabled && charge > 0 && (
                                        <div className="flex justify-between">
                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Charge:</span>
                                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>₦{charge.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className={`flex justify-between font-semibold pt-2 border-t ${darkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>Total:</span>
                                        <span className="text-[#FF5F00]">₦{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'}`}>
                                <AlertCircle size={16} className="text-red-500" />
                                <span className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</span>
                            </div>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                            className={`w-full bg-[#FF5F00] hover:bg-[#E65600]`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={16} />
                                    Processing...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} />
                                    Pay with {selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'}
                                </div>
                            )}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
