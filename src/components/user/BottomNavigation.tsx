import React from 'react';
import { Home, Zap, Gift, User, ShoppingCart } from 'lucide-react';

type ActivePage = 'home' | 'plan' | 'rewards' | 'settings' | 'menu';

interface BottomNavigationProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  onQuickBuy?: () => void;
  darkMode?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activePage,
  onPageChange,
  onQuickBuy,
  darkMode = false,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto relative">

        {/* Curved Background SVG */}
        <div className="absolute bottom-0 w-full drop-shadow-[0_-5px_10px_rgba(0,0,0,0.05)] text-transparent">
          <svg viewBox="0 0 375 85" className={`w-full h-[85px] fill-current ${darkMode ? 'text-zinc-900' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,20 C0,20 0,85 0,85 L375,85 L375,20 C375,8.954305 366.045695,0 355,0 L248.349,0 C234.792,0 231.139,5.228 221.411,14.653 C212.723,23.076 201.275,28 187.5,28 C173.725,28 162.277,23.076 153.589,14.653 C143.861,5.228 140.208,0 126.651,0 L20,0 C8.954305,0 0,8.954305 0,20 Z" />
          </svg>
        </div>

        {/* Central Floating Button - Quick Buy */}
        <div className="absolute bottom-[35px] left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => onQuickBuy?.()}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all ${darkMode ? 'bg-[#FF5F00] shadow-orange-500/20' : 'bg-[#FF5F00] shadow-orange-500/30'}`}
          >
            <ShoppingCart size={28} className="text-white" />
          </button>
        </div>

        <div className="relative h-[85px] flex items-end pb-3 px-6 justify-between">
          {/* Left Group */}
          <div className="flex gap-8 mb-2 ml-2">
            <button
              onClick={() => onPageChange('home')}
              className={`flex flex-col items-center gap-1 transition-colors ${activePage === 'home' ? 'text-[#FF5F00]' : (darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')}`}
            >
              <Home size={22} fill={activePage === 'home' ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button
              onClick={() => onPageChange('plan')}
              className={`flex flex-col items-center gap-1 transition-colors ${activePage === 'plan' ? 'text-[#FF5F00]' : (darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')}`}
            >
              <Zap size={22} fill={activePage === 'plan' ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium">Plans</span>
            </button>
          </div>

          {/* Spacer for center button */}
          <div className="w-12"></div>

          {/* Right Group */}
          <div className="flex gap-8 mb-2 mr-2">
            <button
              onClick={() => onPageChange('rewards')}
              className={`flex flex-col items-center gap-1 transition-colors ${activePage === 'rewards' ? 'text-[#FF5F00]' : (darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')}`}
            >
              <Gift size={22} />
              <span className="text-[10px] font-medium">Referrals</span>
            </button>
            <button
              onClick={() => onPageChange('settings')}
              className={`flex flex-col items-center gap-1 transition-colors ${activePage === 'settings' ? 'text-[#FF5F00]' : (darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')}`}
            >
              <User size={22} fill={activePage === 'settings' ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium">Settings</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};