import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { RecentTransactions } from './RecentTransactions';

import { PlansList } from './PlansList';
import { VirtualAccountPage } from './VirtualAccountPage';
import { BottomNavigation } from './BottomNavigation';
import { ReferralPage } from './ReferralPage';
import { SettingsPage } from './SettingsPage';
import { NotificationBanner } from './NotificationBanner';
import { TransferModal } from './TransferModal';
import { FundWalletModal } from './FundWalletModal';
import { CreditCard, ArrowUpRight, Send, Moon, Sun, Eye, EyeOff, Wallet } from 'lucide-react';

type ActivePage = 'home' | 'plan' | 'rewards' | 'settings' | 'menu' | 'virtual-account';

import { useTheme } from '../../contexts/ThemeContext'; // Import useTheme

export const UserDashboard: React.FC = () => {
  const { user, retryProfileFetch } = useAuth(); // profileLoading unused
  const { toggleTheme, isDark } = useTheme(); // theme unused
  const [activePage, setActivePage] = useState<ActivePage>('home'); // Revert to activePage

  const { refreshData } = useData();

  // const { isOnline, isSlow } = useNetworkStatus(); // Can use later for banner
  const [showBalance, setShowBalance] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showQuickBuyModal, setShowQuickBuyModal] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);

  // ... (rest of the component)

  const renderContent = () => {
    switch (activePage) {
      // ... (existing cases)
      case 'home':
        return (
          <div className="space-y-6">
            <NotificationBanner />

            {/* Redesigned Balance Card (Split Layout) */}
            <div className="mx-4 mt-4"> {/* Added mt-4 to prevent overlap if sticky doesn't catch */}
              <div className={`rounded-3xl p-5 shadow-lg relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}`}>
                {/* Header Strip */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100/10">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{user?.virtualAccountNumber || 'N/A'}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>|</span>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>IzyConnect</span>
                  </div>
                </div>

                {/* Split Balance Area */}
                <div className="flex relative">
                  {/* Left Half: Main Wallet */}
                  <div className="flex-1 pr-4 border-r border-gray-100/10">
                    <div className="flex items-center gap-1.5 mb-2 cursor-pointer" onClick={() => setShowBalance(!showBalance)}>
                      <CreditCard size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wallet Balance</span>
                      {showBalance ? <Eye size={12} className={isDark ? 'text-gray-500' : 'text-gray-400'} /> : <EyeOff size={12} className={isDark ? 'text-gray-500' : 'text-gray-400'} />}
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#EF4444] mb-1">
                      {showBalance ? `₦${(user?.walletBalance || 0).toLocaleString()}` : '₦****'}
                    </h3>
                    <p className={`text-xs font-medium mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Bonus: ₦0
                    </p>
                    <button
                      onClick={() => setShowFundWalletModal(true)}
                      className={`w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-xs font-bold transition-all ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                      <Wallet size={14} className="text-[#FF5F00]" /> Fund Wallet
                    </button>
                  </div>

                  {/* Right Half: Data/Virtual Account */}
                  <div className="flex-1 pl-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ArrowUpRight size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Virtual Account</span>
                    </div>
                    <h3 className={`text-xl font-bold mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user?.virtualAccountNumber ? 'Active' : 'Not Set'}
                    </h3>
                    <p className={`text-xs font-medium mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Bank: {user?.virtualAccountBankName || 'N/A'}
                    </p>
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className={`w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-xs font-bold transition-all ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                      <Send size={14} className="text-[#FF5F00]" /> Transfer
                    </button>
                  </div>
                </div>

                {/* Background Texture */}
                <div className={`absolute inset-0 -z-10 opacity-5 pointer-events-none ${isDark ? 'bg-white' : 'bg-black'}`} style={{ backgroundImage: 'radial-gradient(circle at center, gray 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mx-4">
              <div className={`rounded-3xl p-5 shadow-sm border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
                  <button onClick={() => setActivePage('settings')} className="text-xs font-medium text-[#FF5F00]">See all</button>
                </div>
                <RecentTransactions onNavigateToHistory={() => setActivePage('settings')} />
              </div>
            </div>

            {/* Plans List */}
            <div className="mx-4 pb-20">
              <PlansList onSeeAllClick={() => setActivePage('plan')} darkMode={isDark} />
            </div>
          </div >
        );
      case 'plan':
        return <PlansList showAll={true} darkMode={isDark} />;
      case 'rewards':
        return <ReferralPage darkMode={isDark} />
      case 'settings':
        return <SettingsPage darkMode={isDark} />;
      case 'virtual-account':
        return <VirtualAccountPage onBack={() => setActivePage('home')} darkMode={isDark} />;
      default:
        return null;
    }
  };

  // Don't show header and bottom nav for virtual account page
  if (activePage === 'virtual-account') {
    return renderContent();
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} transition-colors duration-300 font-sans`}>
      <div className={`max-w-md mx-auto ${isDark ? 'bg-black' : 'bg-gray-50'} min-h-screen relative pb-24`}>

        {/* Header Section - Reference Style */}
        <div className={`px-4 pt-6 pb-2 ${isDark ? 'bg-black' : 'bg-white'} sticky top-0 z-20`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Y'ello, {user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleTheme()}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>

        <main className="pb-40 min-h-[calc(100vh-200px)] max-[380px]:pb-36 max-[360px]:pb-32 max-[350px]:pb-28">
          <div className="px-0 pt-0 relative"> {/* Removed -mt-4 and px-4 (now handled in inner content) */}
            <div className="min-h-[calc(100vh-300px)] max-[380px]:min-h-[calc(100vh-280px)] max-[360px]:min-h-[calc(100vh-260px)] max-[350px]:min-h-[calc(100vh-240px)]">
              {renderContent()}
            </div>
            {/* Bottom Navigation */}
            <BottomNavigation
              activePage={activePage}
              onPageChange={setActivePage}
              onQuickBuy={() => setShowQuickBuyModal(true)}
              darkMode={isDark}
            />
          </div>
        </main>

        {/* Transfer Modal */}
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          darkMode={isDark}
          onSuccess={async () => {
            await Promise.all([
              refreshData(),
              retryProfileFetch()
            ]);
          }}
        />

        {/* Fund Wallet Modal */}
        <FundWalletModal
          isOpen={showFundWalletModal}
          onClose={() => setShowFundWalletModal(false)}
          darkMode={isDark}
          onSuccess={async () => {
            await Promise.all([
              refreshData(),
              retryProfileFetch()
            ]);
          }}
        />

        {/* Quick Buy Plans Modal */}
        {showQuickBuyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowQuickBuyModal(false)}></div>

            <div className={`relative w-full max-w-sm rounded-[2rem] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
              {/* Modal Header */}
              <div className={`p-6 pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Buy Plan</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select a plan to purchase</p>
                  </div>
                  <button
                    onClick={() => setShowQuickBuyModal(false)}
                    className={`p-2 rounded-full transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <PlansList showAll={true} darkMode={isDark} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};