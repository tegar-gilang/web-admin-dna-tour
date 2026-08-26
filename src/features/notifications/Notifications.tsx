import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/core/store';
import { 
  Bell, Radio, ShieldAlert, CheckCircle2, Megaphone, Inbox,
  Search, X, ChevronLeft, ChevronRight, Calendar, Clock,
  ArrowRight, AlertTriangle, ExternalLink, RefreshCw,
  MessageSquare, User, Target as TargetIcon, MapPin, CheckCircle,
  CheckCheck, Check, Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogClose
} from '@/components/ui/Dialog';

export default function Notifications() {
  const navigate = useNavigate();
  const { broadcasts, emergencies, readNotificationIds, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  
  const [filter, setFilter] = useState<'all' | 'broadcast' | 'emergency' | 'unresolved'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const itemsPerPage = 10;

  // Format Indo Date
  const formatIndoDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const notifications = useMemo(() => {
    const items: any[] = [];
    
    // Add broadcasts
    broadcasts.forEach(b => {
      const notifId = `bc-${b.id}`;
      const isUnread = !readNotificationIds.includes(notifId);
      items.push({
        id: notifId,
        rawId: b.id,
        type: 'broadcast',
        title: b.title,
        message: b.message,
        target: b.target,
        time: b.time,
        date: b.date || new Date().toISOString().split('T')[0],
        timestamp: typeof b.id === 'number' ? b.id : new Date(`${b.date || ''} ${b.time || ''}`).getTime() || Date.now(),
        icon: Megaphone,
        color: 'text-blue-600',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        unread: isUnread,
        isEdited: b.isEdited,
        originalTime: b.originalTime || b.time,
        originalDate: b.originalDate || b.date,
        updatedTime: b.updatedTime,
        updatedDate: b.updatedDate,
        statusText: b.isEdited ? 'Terkirim (Diedit)' : 'Terkirim',
        destinationRoute: '/broadcast',
      });
    });

    // Add emergencies
    emergencies.forEach(e => {
      const notifId = `em-${e.id}`;
      const isResolved = e.status === 'Resolved';
      const isUnread = !readNotificationIds.includes(notifId);
      items.push({
        id: notifId,
        rawId: e.id,
        type: 'emergency',
        title: `Darurat: ${e.type}`,
        message: `Jamaah ${e.pilgrim} (${e.group}) memerlukan bantuan di ${e.location}.`,
        target: e.group,
        pilgrim: e.pilgrim,
        location: e.location,
        emergencyType: e.type,
        time: e.time,
        date: e.date || new Date().toISOString().split('T')[0],
        timestamp: new Date(`${e.date} ${e.time}`).getTime() || Date.now(),
        icon: isResolved ? CheckCircle2 : AlertTriangle,
        color: isResolved ? 'text-emerald-600' : 'text-rose-600',
        badgeBg: isResolved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
        unread: isUnread,
        statusText: isResolved ? 'Selesai' : 'Perlu Tindakan',
        isResolved,
        destinationRoute: '/emergency',
      });
    });

    // Sort descending by timestamp
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [broadcasts, emergencies, readNotificationIds]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'broadcast' && n.type !== 'broadcast') return false;
      if (filter === 'emergency' && n.type !== 'emergency') return false;
      if (filter === 'unresolved' && (n.type !== 'emergency' || n.isResolved)) return false;
      
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          (n.target && n.target.toLowerCase().includes(query)) ||
          (n.pilgrim && n.pilgrim.toLowerCase().includes(query)) ||
          (n.location && n.location.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [notifications, filter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage));
  const paginatedData = filteredNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalBroadcasts = notifications.filter(n => n.type === 'broadcast').length;
  const totalEmergencies = notifications.filter(n => n.type === 'emergency').length;
  const unhandledEmergencies = notifications.filter(n => n.type === 'emergency' && !n.isResolved).length;
  const totalUnread = notifications.filter(n => n.unread).length;

  const handleOpenDetail = (notif: any) => {
    markNotificationAsRead(notif.id);
    setSelectedNotification(notif);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Header Banner - Modern & Clean */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200/80 cursor-pointer shrink-0"
              title="Kembali"
              aria-label="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                  Pusat Notifikasi
                </h1>
                {totalUnread > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-50 text-[#740A03] border border-red-200/80 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#740A03] animate-pulse"></span>
                    {totalUnread} Belum Dibaca
                  </span>
                )}
                {unhandledEmergencies > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    {unhandledEmergencies} Darurat Aktif
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
                Pantau seluruh notifikasi siaran informasi dan laporan darurat operasional secara terpadu
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {totalUnread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllNotificationsAsRead()}
                className="h-9 px-3 text-xs font-bold rounded-xl border-red-200 text-[#740A03] bg-rose-50/50 hover:bg-rose-100/70 cursor-pointer transition-all shadow-2xs"
                title="Tandai semua notifikasi sebagai sudah dibaca"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-[#740A03]" />
                Tandai Semua Dibaca
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid - Interactive & High Clarity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Semua Notifikasi */}
        <Card 
          onClick={() => { setFilter('all'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            filter === 'all' 
              ? 'border-[#740A03] ring-2 ring-[#740A03]/20 bg-[#fdf8f8]' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SEMUA NOTIFIKASI</p>
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {notifications.length} <span className="text-sm font-medium text-gray-500">Pesan</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#740A03] flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#740A03]"></span>
                <span>Total rekaman sistem</span>
              </div>
              {totalUnread > 0 && (
                <span className="text-[11px] font-bold text-[#740A03]">
                  {totalUnread} baru
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pesan Siaran */}
        <Card 
          onClick={() => { setFilter('broadcast'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            filter === 'broadcast' 
              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/40' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PESAN SIARAN</p>
                <p className="text-2xl font-bold tracking-tight text-blue-950">
                  {totalBroadcasts} <span className="text-sm font-medium text-blue-700">Siaran</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
              <Radio className="w-3.5 h-3.5 shrink-0" />
              <span>Pengumuman ke Jamaah & TL</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Darurat SOS */}
        <Card 
          onClick={() => { setFilter('emergency'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            filter === 'emergency' 
              ? 'border-rose-600 ring-2 ring-rose-600/20 bg-rose-50/40' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL DARURAT</p>
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {totalEmergencies} <span className="text-sm font-medium text-gray-500">Laporan</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Kondisi & medis jamaah</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Membutuhkan Penanganan */}
        <Card 
          onClick={() => { setFilter('unresolved'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            filter === 'unresolved' 
              ? 'border-red-600 ring-2 ring-red-600/20 bg-red-50/50' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">PERLU TINDAKAN</p>
                <p className="text-2xl font-bold tracking-tight text-red-700">
                  {unhandledEmergencies} <span className="text-sm font-medium text-red-600">Kasus</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{unhandledEmergencies > 0 ? 'Belum diselesaikan' : 'Semua telah tertangani'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Filter & Notification Cards Container */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-2xs bg-white rounded-2xl">
        {/* Navigation Tabs Header */}
        <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-3 pb-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-0">
              <button 
                onClick={() => { setFilter('all'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'all' 
                    ? 'font-bold text-[#740A03]' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Semua</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'all' 
                    ? 'bg-rose-100 text-[#740A03]' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {notifications.length}
                </span>
                {filter === 'all' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#740A03] rounded-full" />
                )}
              </button>
              
              <button 
                onClick={() => { setFilter('broadcast'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'broadcast' 
                    ? 'font-bold text-blue-800' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Pesan Siaran</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'broadcast' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {totalBroadcasts}
                </span>
                {filter === 'broadcast' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
                )}
              </button>

              <button 
                onClick={() => { setFilter('emergency'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'emergency' 
                    ? 'font-bold text-rose-800' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Darurat SOS</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'emergency' 
                    ? 'bg-rose-100 text-rose-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {totalEmergencies}
                </span>
                {filter === 'emergency' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-rose-600 rounded-full" />
                )}
              </button>

              <button 
                onClick={() => { setFilter('unresolved'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'unresolved' 
                    ? 'font-bold text-red-800' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Perlu Penanganan</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'unresolved' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {unhandledEmergencies}
                </span>
                {filter === 'unresolved' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-red-600 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Cari judul, isi pesan, jamaah, lokasi..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9.5 pr-8 h-9.5 rounded-xl border-gray-200 bg-white text-xs sm:text-sm focus:border-[#740A03] focus:ring-1 focus:ring-[#740A03]/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span>
              Ditemukan <strong className="text-gray-900">{filteredNotifications.length}</strong> notifikasi
            </span>
            {totalUnread > 0 && (
              <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-md border border-red-200/60">
                {totalUnread} belum dibaca
              </span>
            )}
          </div>
        </div>

        {/* Notification Cards List with subtle difference between read and unread */}
        <div className="p-4 sm:p-6 space-y-3 min-h-[380px] bg-gray-50/30">
          {paginatedData.length > 0 ? (
            paginatedData.map((notif) => {
              const IconComp = notif.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenDetail(notif)}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group relative",
                    notif.unread 
                      ? "bg-white border-l-[3.5px] border-l-[#740A03] border-t-gray-200/90 border-r-gray-200/90 border-b-gray-200/90 shadow-2xs hover:shadow-xs hover:border-gray-300" 
                      : "bg-[#fafafa]/90 border-l-[3.5px] border-l-gray-300 border-t-gray-200/60 border-r-gray-200/60 border-b-gray-200/60 opacity-90 hover:opacity-100 hover:bg-white hover:border-gray-300"
                  )}
                >
                  {/* Left Column: Icon & Content */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs",
                      notif.type === 'emergency' 
                        ? notif.isResolved 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                    )}>
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top Badges: Category + Status Baca + Container Hari, Tanggal, dan Waktu */}
                      <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        {/* Kategori Badge */}
                        <span className={cn("text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-wider shadow-2xs", notif.badgeBg)}>
                          {notif.type === 'emergency' ? 'DARURAT SOS' : 'PESAN SIARAN'}
                        </span>

                        {/* Diedit Tag if edited */}
                        {notif.isEdited && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <Pencil className="w-2.5 h-2.5 text-amber-600" />
                            Diedit
                          </span>
                        )}

                        {/* Status Baca Subtle Indicator */}
                        {notif.unread ? (
                          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-[#740A03] border border-rose-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#740A03] animate-pulse"></span>
                            Belum Dibaca
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200/60">
                            <Check className="w-3 h-3 text-gray-400" />
                            Dibaca
                          </span>
                        )}

                        {/* Kontainer Khusus Hari, Tanggal & Waktu */}
                        <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-md text-xs font-medium text-gray-700 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-mono font-bold text-gray-900">{notif.time ? `${notif.time} WIB` : '--:--'}</span>
                          <span className="text-gray-300 font-semibold">•</span>
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-600">{formatIndoDate(notif.date)}</span>
                        </div>
                      </div>

                      {/* Judul Notifikasi */}
                      <h4 className={cn(
                        "text-sm sm:text-base truncate transition-colors mb-0.5",
                        notif.unread 
                          ? "font-extrabold text-gray-950" 
                          : "font-bold text-gray-700"
                      )}>
                        {notif.title}
                      </h4>

                      {/* Isi Ringkasan Pesan */}
                      <p className={cn(
                        "text-xs sm:text-sm line-clamp-2 leading-snug",
                        notif.unread 
                          ? "text-gray-700 font-medium" 
                          : "text-gray-500 font-normal"
                      )}>
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Status & Action Button */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span className={cn(
                      "inline-flex items-center text-xs font-bold px-3 py-1 rounded-lg border shadow-2xs",
                      notif.type === 'emergency' && !notif.isResolved
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : notif.type === 'emergency'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                    )}>
                      {notif.statusText}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(notif);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-950 transition-colors py-1.5 px-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <span>Buka Detail</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
              <Inbox className="w-10 h-10 mb-2 text-gray-300" />
              <p className="font-bold text-gray-600">Tidak ada notifikasi</p>
              <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter kategori.</p>
            </div>
          )}
        </div>

        {/* Pagination Panel */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm font-medium text-gray-500">
              Menampilkan <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + (filteredNotifications.length > 0 ? 1 : 0)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredNotifications.length)}</span> dari <span className="font-bold text-gray-900">{filteredNotifications.length}</span> notifikasi
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8.5 px-3 rounded-xl border-gray-200 text-gray-600 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                        currentPage === pageNum 
                          ? 'bg-[#740A03] text-white shadow-xs' 
                          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8.5 px-3 rounded-xl border-gray-200 text-gray-600 cursor-pointer"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal Dialog - Redesigned to match Registration Form/Detail Aesthetics */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent hideClose className="w-[95vw] max-w-xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {selectedNotification && (
            <div className="space-y-6">
              {/* Header with Title and Close Button */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs",
                    selectedNotification.type === 'emergency' 
                      ? 'bg-rose-50 text-rose-600 border-rose-200' 
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  )}>
                    {React.createElement(selectedNotification.icon, { className: "w-6 h-6" })}
                  </div>
                  <div>
                    <span className={cn(
                      "text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-block mb-1 shadow-2xs",
                      selectedNotification.badgeBg
                    )}>
                      {selectedNotification.type === 'emergency' ? 'LAPORAN DARURAT SOS' : 'PESAN SIARAN INFORMASI'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">
                      {selectedNotification.title}
                    </h3>
                  </div>
                </div>

                <DialogClose asChild>
                  <button
                    className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </DialogClose>
              </div>

              {/* Card Container 1: Waktu & Tanggal (Sesuai gaya form pendaftaran) */}
              <div className="bg-gray-50/70 border border-[#cbd5e1] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm shadow-2xs">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Clock className="w-4 h-4 text-[#782820] shrink-0" />
                  <span className="text-gray-500 font-medium">Waktu:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedNotification.time} WIB</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                  <span className="text-gray-500 font-medium">Tanggal:</span>
                  <span className="font-bold text-gray-900">{formatIndoDate(selectedNotification.date)}</span>
                </div>
              </div>

              {/* Section 2: PESAN (Pengganti Isi Notifikasi / Pesan) */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-[13px] font-black text-gray-600 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-[#782820] shrink-0" />
                  <span>PESAN</span>
                </div>
                <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200 text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">
                  {selectedNotification.message}
                </div>
              </div>

              {/* Section 3: Informasi Terkait (Form Details Style) */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                {selectedNotification.pilgrim && (
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                      <User className="w-4 h-4 text-[#782820] shrink-0" />
                      <span className="uppercase font-bold text-gray-600 tracking-wide text-xs">Nama Jamaah</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm sm:text-base text-right">
                      {selectedNotification.pilgrim}
                    </span>
                  </div>
                )}

                {selectedNotification.target && (
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                      <TargetIcon className="w-4 h-4 text-[#782820] shrink-0" />
                      <span className="uppercase font-bold text-gray-600 tracking-wide text-xs">TARGET</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm sm:text-base text-right">
                      {selectedNotification.target}
                    </span>
                  </div>
                )}

                {selectedNotification.location && (
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                      <MapPin className="w-4 h-4 text-[#782820] shrink-0" />
                      <span className="uppercase font-bold text-gray-600 tracking-wide text-xs">Lokasi Kejadian</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm sm:text-base text-right">
                      {selectedNotification.location}
                    </span>
                  </div>
                )}

                {/* Status Penanganan */}
                <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                  <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                    <CheckCircle className="w-4 h-4 text-[#782820] shrink-0" />
                    <span className="uppercase font-bold text-gray-600 tracking-wide text-xs">Status Penanganan</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full border shadow-2xs",
                    selectedNotification.type === 'emergency' && !selectedNotification.isResolved
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : selectedNotification.type === 'emergency'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedNotification.isEdited
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                  )}>
                    {selectedNotification.statusText}
                  </span>
                </div>

                {selectedNotification.isEdited && (
                  <>
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6 bg-amber-50/20">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="uppercase font-bold text-gray-600 tracking-wide text-xs">Waktu Asli Terbit</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs sm:text-sm text-right font-mono">
                        {formatIndoDate(selectedNotification.originalDate || selectedNotification.date)}, {selectedNotification.originalTime || selectedNotification.time} WIB
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6 bg-amber-50/40">
                      <div className="flex items-center gap-3 text-amber-900 text-xs sm:text-sm font-medium">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="uppercase font-bold text-amber-800 tracking-wide text-xs">Waktu Pembaruan</span>
                      </div>
                      <span className="font-bold text-amber-950 text-xs sm:text-sm text-right font-mono">
                        {formatIndoDate(selectedNotification.updatedDate || selectedNotification.date)}, pukul {selectedNotification.updatedTime || selectedNotification.time} WIB
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <DialogClose asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-2xl border-gray-300 text-gray-700 font-bold text-xs sm:text-sm cursor-pointer hover:bg-gray-50 shadow-2xs"
                  >
                    Tutup
                  </Button>
                </DialogClose>

                {selectedNotification.type === 'emergency' && (
                  <Button
                    type="button"
                    onClick={() => {
                      navigate(selectedNotification.destinationRoute);
                    }}
                    className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-2xl bg-[#740A03] hover:bg-[#610802] text-white font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    Buka di Halaman Darurat
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
