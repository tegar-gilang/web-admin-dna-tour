import { toast } from '@/lib/toast';
import React from 'react';
import { Bell, Search, Menu, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/core/store';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathnames = location.pathname.split('/').filter(x => x);
  const { broadcasts, emergencies, readNotificationIds } = useStore();
  const isNotificationsActive = location.pathname === '/notifications';
  
  const unreadCount = React.useMemo(() => {
    const allNotifIds = [
      ...broadcasts.map(b => `bc-${b.id}`),
      ...emergencies.map(e => `em-${e.id}`)
    ];
    return allNotifIds.filter(id => !(readNotificationIds || []).includes(id)).length;
  }, [broadcasts, emergencies, readNotificationIds]);

  return (
    <header className="h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white/90 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between px-3.5 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-xs shrink-0">
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0">
        <button 
          onClick={onMenuClick} 
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 shrink-0 rounded-xl hover:bg-gray-100/80 transition-all border border-gray-200/60"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Mobile Title */}
        <div className="lg:hidden text-base font-extrabold text-gray-900 capitalize truncate tracking-tight">
          {pathnames.length === 0 ? 'Dasbor Operasional' : pathnames[pathnames.length - 1].replace('-', ' ')}
        </div>
        
        {/* Breadcrumb Title */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight text-gray-900 capitalize">
            {pathnames.length === 0 ? 'Dasbor Operasional' : pathnames[pathnames.length - 1].replace('-', ' ')}
          </span>
        </div>

        {/* Search Input */}
        <div className="max-w-xs sm:max-w-sm md:max-w-md w-full hidden md:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
          <Input 
            placeholder="Cari jamaah, paspor, atau kloter..." 
            className="pl-9 pr-10 bg-gray-50/90 border-gray-200 rounded-xl text-xs font-medium h-9 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-red-900/20 focus-visible:border-[#740A03] transition-all shadow-2xs"
          />
          <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 text-[10px] font-mono font-bold text-gray-400 bg-white rounded border border-gray-200 shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>
      
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <button 
          className={`relative p-2.5 transition-all rounded-xl border cursor-pointer ${
            isNotificationsActive 
              ? 'bg-rose-50 text-[#740A03] border-rose-200 ring-2 ring-[#740A03]/20 shadow-2xs' 
              : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100/80 border-transparent hover:border-gray-200/80'
          }`} 
          onClick={() => navigate('/notifications')}
          title={`Pusat Notifikasi ${unreadCount > 0 ? `(${unreadCount} belum dibaca)` : ''}`}
          aria-label="Pusat Notifikasi"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
