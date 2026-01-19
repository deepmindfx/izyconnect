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
import { Bell, ChevronDown, Smartphone, CreditCard, ArrowUpRight, Clock, Send, TrendingUp, Moon, Sun, Zap, Globe, Share2, MoreHorizontal, HelpCircle, User, Eye, EyeOff } from 'lucide-react';

type ActivePage = 'home' | 'plan' | 'rewards' | 'settings' | 'menu' | 'virtual-account';

export const UserDashboard: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout, refreshSession } = useAuth();
  const { refreshData } = useData();

  // const { isOnline, isSlow } = useNetworkStatus(); // Can use later for banner
  const [showBalance, setShowBalance] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return (
          <div className="space-y-6">
            <NotificationBanner />

            {/* Redesigned Balance Card (Split Layout) */}
            <div className="mx-4">
              <div className={`rounded-3xl p-5 shadow-lg relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}`}>
                {/* Header Strip */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100/10">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{user?.virtualAccountNumber || '09063412927'}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>|</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>IzyConnect</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#FFCC00] text-sm font-medium cursor-pointer" onClick={() => setActivePage('plan')}>
                    Pulse <ChevronDown size={14} className="-rotate-90" />
                  </div>
                </div>

                {/* Split Balance Area */}
                <div className="flex relative">
                  {/* Left Half: Main Wallet */}
                  <div className="flex-1 pr-4 border-r border-gray-100/10">
                    <div className="flex items-center gap-1.5 mb-2 cursor-pointer" onClick={() => setShowBalance(!showBalance)}>
                      <CreditCard size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Wallet Balance</span>
                      {showBalance ? <Eye size={12} className={darkMode ? 'text-gray-500' : 'text-gray-400'} /> : <EyeOff size={12} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />}
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#EF4444] mb-1">
                      {showBalance ? `₦${(user?.walletBalance || 0).toLocaleString()}` : '₦****'}
                    </h3>
                    <p className={`text-xs font-medium mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Bonus: ₦0
                    </p>
                    <button
                      onClick={() => setActivePage('virtual-account')}
                      className={`w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-xs font-bold transition-all ${darkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                      <TrendingUp size={14} className="text-[#FFCC00]" /> Add Funds
                    </button>
                  </div>

                  {/* Right Half: Data/Virtual Account */}
                  <div className="flex-1 pl-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ArrowUpRight size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Virtual Account</span>
                    </div>
                    <h3 className={`text-xl font-bold mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.virtualAccountNumber ? 'Active' : 'Not Set'}
                    </h3>
                    <p className={`text-xs font-medium mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Bank: {user?.virtualAccountBankName || 'N/A'}
                    </p>
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className={`w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-xs font-bold transition-all ${darkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                      <Send size={14} className="text-[#FFCC00]" /> Transfer
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100/10 text-center">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} cursor-pointer transition-colors`}>View details</span>
                </div>

                {/* Background Texture */}
                <div className={`absolute inset-0 -z-10 opacity-5 pointer-events-none ${darkMode ? 'bg-white' : 'bg-black'}`} style={{ backgroundImage: 'radial-gradient(circle at center, gray 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="mx-4">
              <div className="flex items-center justify-center gap-1.5 mb-4">
                <div className={`w-1.5 h-1.5 rounded-full bg-[#FFCC00]`}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Airtime', icon: Smartphone, color: 'text-[#FFCC00]' },
                  { label: 'Data', icon: Globe, color: 'text-[#FFCC00]' },
                  { label: 'Betting', icon: Zap, color: 'text-[#FFCC00]' },
                  { label: 'Cable', icon: Share2, color: 'text-[#FFCC00]' },
                ].map((item, idx) => (
                  <button key={idx} onClick={() => setActivePage('plan')} className="flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm group-active:scale-95 ${darkMode ? 'bg-zinc-900 border border-zinc-800 shadow-none' : 'bg-black shadow-lg shadow-black/20'}`}>
                      <item.icon size={20} className={item.color} />
                    </div>
                    <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
                  </button>
                ))}
                {[
                  { label: 'History', icon: Clock, color: 'text-white' },
                  { label: 'Referral', icon: User, color: 'text-white' },
                  { label: 'Support', icon: HelpCircle, color: 'text-white' },
                  { label: 'More', icon: MoreHorizontal, color: 'text-white' },
                ].map((item, idx) => (
                  <button
                    key={idx + 4}
                    onClick={() => {
                      if (item.label === 'History') setActivePage('settings');
                      else if (item.label === 'Referral') setActivePage('rewards');
                      else setActivePage('settings');
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm group-active:scale-95 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}`}>
                      <item.icon size={20} className={darkMode ? 'text-gray-300' : 'text-gray-700'} />
                    </div>
                    <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mx-4">
              <div className={`rounded-3xl p-5 shadow-sm border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
                  <button onClick={() => setActivePage('settings')} className="text-xs font-medium text-[#FFCC00]">See all</button>
                </div>
                <RecentTransactions onNavigateToHistory={() => setActivePage('settings')} />
              </div>
            </div>

            {/* Marketplace Header */}
            <div className="flex items-center justify-between px-4 mt-2">
              <div className={`h-[1px] flex-1 ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
              <span className={`px-4 text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wider`}>Marketplace</span>
              <div className={`h-[1px] flex-1 ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
            </div>

            {/* Popular Plans - keeping logic but restyling container if needed */}
            <div className="mx-4 pb-20">
              <PlansList onSeeAllClick={() => setActivePage('plan')} />
            </div>
          </div >
        );
      case 'plan': // Changed from 'plans' to 'plan'
        return <PlansList showAll={true} />;
      case 'rewards': // Changed from 'referrals' to 'rewards'
        return <ReferralPage />;
      case 'settings':
        return <SettingsPage />;
      case 'virtual-account':
        return <VirtualAccountPage onBack={() => setActivePage('home')} />;
      default:
        return null;
    }
  };

  // Don't show header and bottom nav for virtual account page
  if (activePage === 'virtual-account') {
    return renderContent();
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black' : 'bg-gray-50'} transition-colors duration-300 font-sans`}>
      <div className={`max-w-md mx-auto ${darkMode ? 'bg-black' : 'bg-gray-50'} min-h-screen relative pb-24`}>

        {/* Header Section - Reference Style */}
        <div className={`px-4 pt-6 pb-2 ${darkMode ? 'bg-black' : 'bg-white'} sticky top-0 z-20`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Y'ello, {user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                  {user?.virtualAccountNumber || '09063412927'}
                </div>
                <div className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium w-fit ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  <span className="mr-1">👑</span> Prestige Silver
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="relative">
                <Bell size={22} className={darkMode ? 'text-white' : 'text-gray-600'} />
                <span className="absolute -top-1 -right-0.5 bg-[#FFCC00] text-black text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center">
                  4
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Banner */}
        <div className="px-4 mt-4">
          <div className="bg-[#FFF9C4] rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">

            <div className="relative z-10 flex-1">
              <p className="text-sm font-medium text-gray-900 leading-relaxed">
                Get <span className="font-bold">3.2GB</span> for <span className="font-bold">₦1,000</span>. Valid for 2 days.
              </p>
            </div>
            <button className="bg-[#FFCC00] text-black font-bold text-xs px-4 py-2 rounded-full shadow-sm whitespace-nowrap ml-2">
              Claim
            </button>
            {/* Hot Deal Icon */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center opacity-10 scale-150"></div>
          </div>
        </div>

        <main className="pb-40 min-h-[calc(100vh-200px)] max-[380px]:pb-36 max-[360px]:pb-32 max-[350px]:pb-28">
          <div className="px-4 -mt-4 relative">
            <div className="min-h-[calc(100vh-300px)] max-[380px]:min-h-[calc(100vh-280px)] max-[360px]:min-h-[calc(100vh-260px)] max-[350px]:min-h-[calc(100vh-240px)]">
              {renderContent()}
            </div>
            {/* Bottom Navigation */}
            <BottomNavigation activePage={activePage} onPageChange={setActivePage} darkMode={darkMode} />
          </div>
        </main>

        {/* Transfer Modal */}
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={async () => {
            // Refresh all data including transactions and user profile
            await Promise.all([
              refreshData(),
              refreshSession()
            ]);
          }}
        />
      </div>
    </div>
  );
};