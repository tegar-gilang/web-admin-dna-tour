import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStore } from '@/core/store';
import { appService } from '@/core/services/appService';
import { 
  Users, UsersRound, Contact, 
  UserCheck, Activity, CalendarDays, MapPin, Radio, AlertTriangle, 
  FileText, Settings, Moon, Smartphone, LogOut, X, ClipboardList, BedDouble, Boxes, Wallet, Trash2, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout } = useStore();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navGroups = useMemo(() => [
    {
      title: 'Operasional',
      items: [
        { name: 'Pendaftaran', path: '/registration', icon: ClipboardList },
        { name: 'Keuangan', path: '/finance', icon: Wallet },
        { name: 'Jamaah', path: '/pilgrims', icon: Users },
        { name: 'Kloter', path: '/groups', icon: UsersRound },
        { name: 'Room Meet', path: '/room-allocation', icon: BedDouble },
        { name: 'Perjalanan', path: '/journey', icon: MapPin },
      ]
    },
    {
      title: 'Staf',
      items: [
        { name: 'Tour Leader', path: '/tour-leaders', icon: Contact },
        { name: 'Muthawwif', path: '/mutawifs', icon: UserCheck },
        { name: 'Monitoring Stok', path: '/staff-stock', icon: Boxes },
      ]
    },
    {
      title: 'Pemantauan',
      items: [
        { name: 'Pantau Langsung', path: '/live-monitoring', icon: Radio },
        { name: 'Siaran', path: '/broadcast', icon: Radio },
        { name: 'Darurat', path: '/emergency', icon: AlertTriangle },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { name: 'Laporan', path: '/reports', icon: FileText },
        { name: 'Riwayat Hapus', path: '/trash', icon: Trash2 },
        { name: 'Keluar Sistem', action: 'logout', icon: LogOut, isDanger: true },
      ]
    }
  ], []);

  const activeJourney = useMemo(() => {
    const journey = appService.getJourney();
    const active = journey.find(j => j.status === 'In Progress') || journey[0];
    const match = active?.details.match(/(\d+)%/);
    const progress = match ? parseInt(match[1], 10) : 0;
    return {
      phase: active?.phase || 'Tidak ada',
      progress
    };
  }, []);

  return (
    <aside className="w-64 bg-[#0B1011] text-white flex flex-col h-full border-r border-gray-800/60 shadow-2xl shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 pt-[max(1.25rem,env(safe-area-inset-top))] flex items-center justify-between border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#740A03] to-[#a8140a] rounded-xl flex items-center justify-center font-extrabold text-white shadow-md shadow-red-950/40 border border-red-500/30 text-sm">
            D
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-white leading-tight">DNA Tour</span>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
              Operasional
            </span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 overflow-y-auto py-4 space-y-5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-3 py-1 flex items-center justify-between">
              <span>{group.title}</span>
              <span className="w-8 h-[1px] bg-gray-800/80"></span>
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                if (item.action === 'logout') {
                  return (
                    <button
                      key="logout"
                      onClick={() => setIsLogoutModalOpen(true)}
                      className="w-full group flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    </button>
                  );
                }
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                return (
                  <NavLink
                    key={item.path}
                    to={item.path!}
                    onClick={onClose}
                    className={({ isActive: active }) =>
                      cn(
                        "relative group flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]",
                        active
                          ? "text-red-200 font-bold"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )
                    }
                  >
                    {({ isActive: active }) => (
                      <>
                        {active && (
                          <motion.div
                            layoutId="activeSidebarPill"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            className="absolute inset-0 bg-red-500/15 border border-red-500/30 rounded-xl shadow-xs shadow-red-950/30 ring-1 ring-red-500/20 pointer-events-none"
                          />
                        )}
                        <div className="relative z-10 flex items-center gap-3">
                          <item.icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                          <span className="truncate">{item.name}</span>
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-800/80 bg-[#080C0D] flex flex-col gap-3">
        {/* Phase Card */}
        <div className="bg-[#121A1B] p-3.5 rounded-2xl border border-gray-800/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fase Ibadah</span>
            <span className="text-xs font-black text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
              {activeJourney.progress}%
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate">{activeJourney.phase}</div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden p-0.5 border border-gray-700/50">
            <div 
              className="bg-gradient-to-r from-green-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${activeJourney.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-gray-100 p-6 rounded-2xl shadow-xl">
          <DialogHeader className="mb-2 border-b border-gray-100 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              Konfirmasi Keluar
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin keluar dari sistem? Anda harus login kembali untuk dapat mengakses data operasional.
            </p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-end mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="text-gray-700 border-gray-300 hover:bg-gray-50 flex-1 sm:flex-none"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                logout();
                onClose?.();
                setIsLogoutModalOpen(false);
              }}
              className="bg-red-600 text-white hover:bg-red-700 shadow-sm flex-1 sm:flex-none border-none"
            >
              Ya, Keluar Sistem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
