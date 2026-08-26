import React, { useState, useMemo } from 'react';
import { useStore, BroadcastItem } from '@/core/store';
import { toast } from '@/lib/toast';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { 
  Megaphone, Send, Users, Filter, Trash2, Search, X, 
  CheckCircle2, Clock, BellRing, Eye, 
  PlusCircle, Radio, UserCheck, ShieldCheck, MessageSquareText, Calendar,
  Edit3, Pencil, AlertCircle, Check
} from 'lucide-react';

export default function Broadcast() {
  const { broadcasts, addBroadcast, updateBroadcast, deleteBroadcasts, groups, tourLeaders, mutawifs, pilgrims } = useStore();

  // Extract unique kloters from groups & pilgrims
  const uniqueKloters = useMemo(() => {
    return Array.from(new Set([
      ...groups.map(g => g.kloter).filter(Boolean),
      ...pilgrims.map(p => p.group).filter(Boolean)
    ]));
  }, [groups, pilgrims]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'global' | 'group' | 'tl' | 'mutawif' | 'edited'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTargetGroup, setFilterTargetGroup] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Modal Send / Create Broadcast state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastItem | null>(null);

  // Form State for Create
  const [target, setTarget] = useState('Semua Jamaah');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [broadcastDate, setBroadcastDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSending, setIsSending] = useState(false);

  // Form State for Edit Broadcast
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<BroadcastItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editTarget, setEditTarget] = useState('Semua Jamaah');
  const [editBroadcastDate, setEditBroadcastDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Time formatter: converts any time string to 24h format (00.00 - 23.59)
  const formatBroadcastTime = (timeStr?: string): string => {
    if (!timeStr) return '00.00';
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const cleaned = timeStr.replace(/\s*(AM|PM|am|pm)/gi, '').trim();
    const parts = cleaned.split(/[:.]/);
    if (parts.length >= 2) {
      let hour = parseInt(parts[0], 10);
      const min = parts[1].padStart(2, '0').slice(0, 2);
      if (!isNaN(hour)) {
        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
        const hh = hour.toString().padStart(2, '0');
        return `${hh}.${min}`;
      }
    }
    return cleaned.replace(':', '.');
  };

  // Date formatters for day boundaries
  const formatDateLabel = (dateStr?: string): string => {
    if (!dateStr) return 'Hari Ini';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Hari Ini';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateStr === yesterdayStr) return 'Kemarin';

    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', { weekday: 'long' });
      }
    } catch {
      // fallback
    }
    return 'Hari ' + dateStr;
  };

  const formatDateLong = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Statistics calculation
  const totalBroadcasts = broadcasts.length;
  const totalGlobal = broadcasts.filter(b => b.target === 'Semua Jamaah' || b.target === 'All' || b.target.toLowerCase().includes('global')).length;
  const totalRombongan = broadcasts.filter(b => b.target.includes('Kloter') || b.target.includes('Rombongan') || groups.some(g => b.target.includes(g.name))).length;
  const totalTL = broadcasts.filter(b => b.target.includes('Tour Leader')).length;
  const totalMutawif = broadcasts.filter(b => b.target.includes('Mutawif')).length;
  const totalEdited = broadcasts.filter(b => b.isEdited).length;

  const hasActiveFilters = Boolean(filterTargetGroup);

  const resetFilters = () => {
    setFilterTargetGroup('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter(b => {
      // Tab filter
      if (activeTab === 'global') {
        const isGlob = b.target === 'Semua Jamaah' || b.target === 'All' || b.target.toLowerCase().includes('global');
        if (!isGlob) return false;
      }
      if (activeTab === 'group') {
        const isGroup = b.target.includes('Kloter') || b.target.includes('Rombongan') || groups.some(g => b.target.includes(g.name));
        if (!isGroup) return false;
      }
      if (activeTab === 'tl') {
        const isTl = b.target.includes('Tour Leader');
        if (!isTl) return false;
      }
      if (activeTab === 'mutawif') {
        const isMut = b.target.includes('Mutawif');
        if (!isMut) return false;
      }
      if (activeTab === 'edited') {
        if (!b.isEdited) return false;
      }

      // Filter target dropdown
      if (filterTargetGroup && !b.target.toLowerCase().includes(filterTargetGroup.toLowerCase())) {
        return false;
      }

      // Search matching
      const matchesSearch = 
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.time && b.time.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [broadcasts, activeTab, filterTargetGroup, searchTerm, groups]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBroadcasts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBroadcasts.map(b => b.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedIds.size > 0) {
      deleteBroadcasts(Array.from(selectedIds));
      toast(`${selectedIds.size} riwayat siaran berhasil dihapus`, 'success');
      setSelectedIds(new Set());
    } else {
      deleteBroadcasts([]);
      toast('Semua riwayat siaran berhasil dihapus', 'success');
    }
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setMessage('');
    setTarget('Semua Jamaah');
    setBroadcastDate(new Date().toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast("Judul dan isi pesan siaran wajib diisi", "error");
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      const timeFormatted = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
      const newBroadcast: BroadcastItem = {
        id: Date.now(),
        title: title.trim(),
        message: message.trim(),
        target,
        time: timeFormatted,
        date: broadcastDate || new Date().toISOString().split('T')[0]
      };

      addBroadcast(newBroadcast);
      toast(`Pesan siaran berhasil dipancarkan ke target: ${target}`, "success");
      setIsSending(false);
      setIsCreateModalOpen(false);
    }, 500);
  };

  const handleOpenEditModal = (b: BroadcastItem) => {
    setEditingBroadcast(b);
    setEditTitle(b.title);
    setEditMessage(b.message);
    setEditTarget(b.target);
    setEditBroadcastDate(b.date || new Date().toISOString().split('T')[0]);
    setIsEditModalOpen(true);
    if (isDetailModalOpen) {
      setIsDetailModalOpen(false);
    }
  };

  const handleUpdateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBroadcast) return;
    if (!editTitle.trim() || !editMessage.trim()) {
      toast("Judul dan isi pesan siaran wajib diisi", "error");
      return;
    }

    setIsUpdating(true);
    setTimeout(() => {
      const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
      const currentDate = editBroadcastDate || new Date().toISOString().split('T')[0];

      updateBroadcast(editingBroadcast.id, {
        title: editTitle.trim(),
        message: editMessage.trim(),
        target: editTarget,
        time: currentTime,
        date: currentDate,
        isEdited: true,
        updatedAt: new Date().toISOString(),
        updatedTime: currentTime,
        updatedDate: currentDate
      });

      toast(`Siaran berhasil diedit & disinkronkan kembali pada pukul ${currentTime} WIB`, "success");
      setIsUpdating(false);
      setIsEditModalOpen(false);
      setEditingBroadcast(null);
    }, 450);
  };

  const handleOpenDetail = (b: BroadcastItem) => {
    setSelectedBroadcast(b);
    setIsDetailModalOpen(true);
  };

  // Maintain store ordering (newly added & recently edited broadcasts are placed at the top)
  const sortedBroadcasts = filteredBroadcasts;

  const totalPages = Math.max(1, Math.ceil(sortedBroadcasts.length / itemsPerPage));
  const paginatedData = sortedBroadcasts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getTargetBadge = (targetStr: string) => {
    if (targetStr.includes('Semua Jamaah') || targetStr.includes('All') || targetStr.toLowerCase().includes('global')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          Global Jamaah
        </span>
      );
    }
    if (targetStr.includes('Tour Leader')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-300 shadow-2xs whitespace-nowrap">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          Tour Leader
        </span>
      );
    }
    if (targetStr.includes('Mutawif')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-300 shadow-2xs whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          Mutawif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs whitespace-nowrap">
        <Users className="w-3.5 h-3.5 text-amber-600" />
        {targetStr}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner Container - Clean & Identical to Registration */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Siaran & Pengumuman
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Pusat kendali komunikasi massal ke seluruh jamaah
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button 
              onClick={handleOpenCreateModal}
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-2xs w-full sm:w-auto justify-center cursor-pointer"
            >
              <Send className="w-4 h-4 mr-1.5" /> 
              Kirim Siaran Baru
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row Container - Single row horizontally scrollable */}
      <div className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x">
        {/* Card 1: Total Siaran */}
        <Card 
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`min-w-[240px] sm:min-w-[260px] flex-1 shrink-0 snap-start rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all' 
              ? 'border-[#782820] ring-2 ring-[#782820]/20 bg-[#fefcfc]' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL SIARAN</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalBroadcasts} Pesan
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Semua Log Siaran Terkirim</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Siaran Global */}
        <Card 
          onClick={() => { setActiveTab('global'); setCurrentPage(1); }}
          className={`min-w-[240px] sm:min-w-[260px] flex-1 shrink-0 snap-start rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'global' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SIARAN GLOBAL</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-emerald-800">
                  {totalGlobal} Pesan
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Target Seluruh Jamaah</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Siaran Kloter */}
        <Card 
          onClick={() => { setActiveTab('group'); setCurrentPage(1); }}
          className={`min-w-[240px] sm:min-w-[260px] flex-1 shrink-0 snap-start rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'group' 
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">KLOTER</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-amber-800">
                  {totalRombongan} Pesan
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fdf6e7] text-[#c27803] flex items-center justify-center shrink-0 shadow-2xs">
                <Radio className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#b45309]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Pengumuman Khusus Kloter</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Tour Leader */}
        <Card 
          onClick={() => { setActiveTab('tl'); setCurrentPage(1); }}
          className={`min-w-[240px] sm:min-w-[260px] flex-1 shrink-0 snap-start rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'tl'
              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOUR LEADER</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-blue-900">
                  {totalTL} Pesan
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Instruksi Khusus Tour Leader</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Mutawif */}
        <Card 
          onClick={() => { setActiveTab('mutawif'); setCurrentPage(1); }}
          className={`min-w-[240px] sm:min-w-[260px] flex-1 shrink-0 snap-start rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'mutawif'
              ? 'border-purple-600 ring-2 ring-purple-600/20 bg-purple-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">MUTAWIF</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-purple-900">
                  {totalMutawif} Pesan
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#7e22ce]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Instruksi Mutawif Lapangan</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card Container with Integrated Tabs */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-2xs">
        {/* Navigation Tabs Header */}
        <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-2.5 pb-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-0">
            <button 
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'all' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Semua Siaran</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalBroadcasts}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            
            <button 
              onClick={() => { setActiveTab('global'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'global' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Global Jamaah</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'global' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalGlobal}
              </span>
              {activeTab === 'global' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('group'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'group' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Kloter</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'group' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalRombongan}
              </span>
              {activeTab === 'group' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('tl'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'tl' 
                  ? 'font-bold text-blue-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Tour Leader</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'tl' 
                  ? 'bg-blue-100 text-blue-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {broadcasts.filter(b => b.target.includes('Tour Leader')).length}
              </span>
              {activeTab === 'tl' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('mutawif'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'mutawif' 
                  ? 'font-bold text-purple-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Mutawif</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'mutawif' 
                  ? 'bg-purple-100 text-purple-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {broadcasts.filter(b => b.target.includes('Mutawif')).length}
              </span>
              {activeTab === 'mutawif' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-purple-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('edited'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'edited' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <div className="flex items-center gap-1">
                <Pencil className="w-3 h-3 text-amber-600" />
                <span>Pernah Diedit</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'edited' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalEdited}
              </span>
              {activeTab === 'edited' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Cari judul siaran, pesan, target penerima..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9.5 pr-8 h-9.5 rounded-xl border-gray-200 bg-white text-xs sm:text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
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

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {selectedIds.size > 0 && (
              <Button 
                onClick={handleDeleteSelected} 
                variant="outline" 
                className="text-xs h-9 font-semibold text-red-600 border-red-200 hover:bg-red-50 px-3.5 rounded-xl cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Hapus Terpilih ({selectedIds.size})
              </Button>
            )}

            <Button 
              variant={showFilters || hasActiveFilters ? "secondary" : "outline"} 
              className={`text-xs h-9 font-semibold px-3.5 rounded-xl cursor-pointer ${
                showFilters || hasActiveFilters 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filter Lanjutan
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 ml-1.5"></span>
              )}
            </Button>
          </div>
        </div>

        {/* Extended Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-end animate-fade-in">
            <div className="space-y-1.5 w-full sm:w-56">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Target Penerima</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterTargetGroup}
                onChange={(e) => { setFilterTargetGroup(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Target</option>
                <option value="Semua Jamaah">Global (Semua Jamaah)</option>
                <option value="Tour Leader">Tour Leader</option>
                <option value="Mutawif">Mutawif</option>
                {uniqueKloters.map(k => (
                  <option key={k} value={k}>Kloter {k}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto w-full scrollbar-thin pb-2">
          <Table className="min-w-[960px] w-full">
            <TableHeader className="bg-gray-50/75 border-b border-gray-100">
              <TableRow>
                <TableHead className="w-12 text-center py-4">
                  <Checkbox 
                    checked={filteredBroadcasts.length > 0 && selectedIds.size === filteredBroadcasts.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih Semua"
                  />
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-4 min-w-[120px] w-[130px]">WAKTU</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-4 min-w-[160px]">TARGET PENERIMA</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-4 min-w-[220px]">JUDUL PENGUMUMAN</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-4 min-w-[300px]">ISI PESAN</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-4 text-center min-w-[110px]">STATUS</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-4 text-right pr-6 min-w-[100px]">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((b, index) => {
                  const isSelected = selectedIds.has(b.id);
                  const bDate = b.date || '2026-07-28';
                  const prevBroadcast = index > 0 ? paginatedData[index - 1] : null;
                  const prevDate = prevBroadcast ? (prevBroadcast.date || '2026-07-28') : null;
                  const isNewDay = !prevBroadcast || prevDate !== bDate;
                  const dayCount = sortedBroadcasts.filter(item => (item.date || '2026-07-28') === bDate).length;

                  return (
                    <React.Fragment key={b.id}>
                      {/* Boundary / Jeda Beda Hari Row */}
                      {isNewDay && (
                        <>
                          {/* Jeda jarak vertikal ekstra jika bukan elemen paling pertama */}
                          {index > 0 && (
                            <TableRow className="h-6 border-0 hover:bg-transparent bg-slate-50/50">
                              <TableCell colSpan={7} className="p-0 h-6 border-0" />
                            </TableRow>
                          )}
                          <TableRow className="bg-slate-100/95 border-t-2 border-slate-300 border-b border-slate-200 select-none hover:bg-slate-100/95 transition-colors">
                            <TableCell colSpan={7} className="py-3 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                {/* Day Pill Badge */}
                                <span className="px-3 py-1.5 text-xs font-extrabold bg-[#782820] text-white rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 tracking-wider uppercase">
                                  <Calendar className="w-3.5 h-3.5 text-white/95" />
                                  {formatDateLabel(bDate)}
                                </span>

                                {/* Formatted Date */}
                                <span className="text-xs font-bold text-slate-800 shrink-0">
                                  {formatDateLong(bDate)}
                                </span>

                                {/* Contrast Divider Line */}
                                <div className="h-[1.5px] bg-slate-300 flex-1 min-w-[20px]" />

                                {/* Total Messages on that day */}
                                <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-2xs whitespace-nowrap flex items-center gap-1.5">
                                  <MessageSquareText className="w-3.5 h-3.5 text-[#782820]" />
                                  <span>{dayCount} Pesan Siaran</span>
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                          {/* Jeda jarak pemisah bawah antara baris batas hari dan baris siaran pertama */}
                          <TableRow className="h-3 border-0 hover:bg-transparent bg-slate-50/30">
                            <TableCell colSpan={7} className="p-0 h-3 border-0" />
                          </TableRow>
                        </>
                      )}

                      <TableRow 
                        className={`hover:bg-gray-50/80 transition-colors border-b border-gray-100/80 ${
                          isSelected ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <TableCell className="text-center py-5">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(b.id)}
                            aria-label={`Pilih ${b.title}`}
                          />
                        </TableCell>
                        
                        {/* Waktu */}
                        <TableCell className="py-5 whitespace-nowrap align-middle">
                          <div className="flex flex-col gap-1.5 justify-center">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100/80 px-2.5 py-1 rounded-lg w-fit border border-gray-200/60 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              <span className="font-mono">{formatBroadcastTime(b.time)}</span>
                            </div>
                            {b.isEdited && (
                              <div className="text-[11px] font-medium text-amber-800 flex items-center gap-1.5 pl-0.5 leading-normal">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                                <span className="whitespace-nowrap font-medium">Update pukul {formatBroadcastTime(b.updatedTime || b.time)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Target Penerima */}
                        <TableCell className="py-5 whitespace-nowrap align-middle">
                          {getTargetBadge(b.target)}
                        </TableCell>

                        {/* Judul */}
                        <TableCell className="py-5 min-w-[220px] align-middle">
                          <div className="flex items-start gap-2">
                            <Radio className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="font-bold text-gray-900 text-sm leading-snug line-clamp-2" title={b.title}>
                              {b.title}
                            </span>
                          </div>
                        </TableCell>

                        {/* Isi Pesan Preview */}
                        <TableCell className="py-5 min-w-[300px] align-middle">
                          <p className="text-xs text-gray-600 line-clamp-2 max-w-xl font-medium leading-relaxed" title={b.message}>
                            {b.message}
                          </p>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-5 text-center whitespace-nowrap align-middle">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Terkirim
                          </span>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="py-5 text-right pr-6 whitespace-nowrap align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenDetail(b)}
                              className="h-8 w-8 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              title="Lihat Detail Pesan"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenEditModal(b)}
                              className="h-8 w-8 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                              title="Edit Pesan Siaran"
                            >
                              <Edit3 className="w-4 h-4 text-amber-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                deleteBroadcasts([b.id]);
                                toast('Pesan siaran berhasil dihapus.', 'success');
                              }}
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Hapus Pesan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <Megaphone className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-700">Tidak ada data siaran ditemukan</p>
                        <p className="text-xs text-gray-400 max-w-sm">
                          Coba sesuaikan kata kunci pencarian atau buat pesan pengumuman baru untuk jamaah.
                        </p>
                      </div>
                      <Button 
                        onClick={handleOpenCreateModal}
                        className="bg-[#740A03] hover:bg-[#580802] text-white text-xs h-9 px-4 rounded-xl mt-2 cursor-pointer shadow-2xs font-semibold"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" /> Buat Siaran Baru
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {sortedBroadcasts.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="font-medium">
              Menampilkan <span className="font-bold text-gray-900">{Math.min(sortedBroadcasts.length, (currentPage - 1) * itemsPerPage + 1)}</span> hingga <span className="font-bold text-gray-900">{Math.min(sortedBroadcasts.length, currentPage * itemsPerPage)}</span> dari <span className="font-bold text-gray-900">{sortedBroadcasts.length}</span> siaran
            </div>

            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="h-8 px-3 text-xs rounded-lg border-gray-200 disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </Button>
              
              <div className="flex items-center gap-1 px-2">
                <span className="font-bold text-gray-900">{currentPage}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="h-8 px-3 text-xs rounded-lg border-gray-200 disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Buat Siaran Baru (Matching Modern Design) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-0 rounded-2xl">
          <form onSubmit={handleSendBroadcast} className="flex flex-col bg-white">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fcedea] text-[#740A03] flex items-center justify-center shrink-0 shadow-2xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">Pancarkan Siaran Baru</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Kirim pengumuman langsung ke aplikasi jamaah & petugas</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Target Penerima */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#00a859]" /> Target Penerima
                  </label>
                  <div className="relative">
                    <select 
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="appearance-none w-full h-12 sm:h-13 rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] shadow-2xs cursor-pointer"
                    >
                      <option value="Semua Jamaah">Semua Jamaah (Global)</option>
                      <option value="Semua Tour Leader">Semua Tour Leader</option>
                      <option value="Semua Mutawif">Semua Mutawif</option>
                      
                      {uniqueKloters.length > 0 && (
                        <optgroup label="Berdasarkan Kloter">
                          {uniqueKloters.map(k => (
                            <option key={k} value={`Kloter ${k}`}>Kloter {k}</option>
                          ))}
                        </optgroup>
                      )}

                      {groups.length > 0 && (
                        <optgroup label="Berdasarkan Rombongan">
                          {groups.map(g => (
                            <option key={g.id} value={`${g.name} (${g.kloter})`}>{g.name} - {g.kloter}</option>
                          ))}
                        </optgroup>
                      )}

                      {tourLeaders.length > 0 && (
                        <optgroup label="Tour Leader Personal">
                          {tourLeaders.map(tl => (
                            <option key={tl.id} value={`Tour Leader: ${tl.name}`}>{tl.name} ({tl.group || 'Standby'})</option>
                          ))}
                        </optgroup>
                      )}

                      {mutawifs.length > 0 && (
                        <optgroup label="Mutawif Personal">
                          {mutawifs.map(m => (
                            <option key={m.id} value={`Mutawif: ${m.name}`}>{m.name} ({m.group || 'Standby'})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {/* Tanggal Siaran */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#782820]" /> Tanggal Siaran
                  </label>
                  <Input 
                    type="date"
                    value={broadcastDate}
                    onChange={(e) => setBroadcastDate(e.target.value)}
                    className="w-full h-12 sm:h-13 rounded-2xl border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Judul Siaran */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" /> Judul Pengumuman
                </label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Kumpul Lobi Hotel & Keberangkatan Raudhah"
                  className="w-full h-12 sm:h-13 rounded-2xl border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] shadow-2xs"
                  required
                />
              </div>

              {/* Isi Pesan */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageSquareText className="w-3.5 h-3.5 text-purple-600" /> Isi Pesan Siaran
                  </label>
                  <span className="text-[11px] font-bold text-gray-400">{message.length} karakter</span>
                </div>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Tuliskan instruksi detail atau pengumuman yang wajib diperhatikan oleh jamaah..."
                  className="w-full rounded-2xl border border-gray-300 bg-white p-4 sm:p-5 text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] shadow-2xs resize-none leading-relaxed"
                  required
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="h-12 px-6 rounded-2xl border-gray-300 text-gray-700 font-bold text-sm cursor-pointer shadow-2xs hover:bg-gray-100"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSending}
                className="h-12 px-6 rounded-2xl bg-[#740A03] hover:bg-[#580802] text-white font-bold text-sm shadow-sm cursor-pointer"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memancarkan...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Pancarkan Sekarang
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detail Siaran - Form Data Diri Pendaftaran Style */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {selectedBroadcast && (
            <div className="space-y-7 animate-fade-in">
              {/* Top Bar Header */}
              <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#740A03] text-white shadow-xs select-none">
                    Detail Pesan Siaran
                  </div>
                </div>
                
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Card 1: Informasi Siaran */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                  Informasi Siaran
                </h2>

                <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                  {/* 1. Tanggal & Hari */}
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Tanggal Siaran</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm text-right">
                      {formatDateLong(selectedBroadcast.date || '2026-07-28')} ({formatDateLabel(selectedBroadcast.date || '2026-07-28')})
                    </span>
                  </div>

                  {/* 2. Waktu */}
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <Clock className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Waktu Kirim</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm text-right font-mono">
                      {formatBroadcastTime(selectedBroadcast.time)} WIB
                    </span>
                  </div>

                  {/* 3. Target Penerima */}
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <Users className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Target Penerima</span>
                    </div>
                    <div>
                      {getTargetBadge(selectedBroadcast.target)}
                    </div>
                  </div>

                  {/* 4. Status */}
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Status Pengiriman</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Terkirim (Berhasil)
                      </span>
                      {selectedBroadcast.isEdited && (
                        <span className="inline-flex items-center gap-1.5 font-bold text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Telah Diperbarui
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5. Judul */}
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <Megaphone className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Judul</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm text-right max-w-xs sm:max-w-md">
                      {selectedBroadcast.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Khusus: Informasi Riwayat & Perubahan (Jika Pernah Diedit) */}
              {selectedBroadcast.isEdited && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Informasi Riwayat & Pembaruan
                  </h2>

                  <div className="bg-amber-50/40 border border-amber-200/90 rounded-3xl overflow-hidden divide-y divide-amber-100 shadow-2xs">
                    {/* Waktu Asli Siaran */}
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6 bg-white/70">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-gray-600 shrink-0" />
                        <span>Tanggal & Waktu Asli Siaran</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right font-mono">
                        {formatDateLong(selectedBroadcast.originalDate || selectedBroadcast.date || '2026-07-28')}, pukul {formatBroadcastTime(selectedBroadcast.originalTime || selectedBroadcast.time)} WIB
                      </span>
                    </div>

                    {/* Waktu Perubahan Dilakukan */}
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6 bg-white/70">
                      <div className="flex items-center gap-3.5 text-amber-900 text-sm font-medium">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Waktu Perubahan Dilakukan</span>
                      </div>
                      <span className="font-bold text-amber-900 text-sm text-right font-mono">
                        {formatDateLong(selectedBroadcast.updatedDate || selectedBroadcast.date || '2026-07-28')}, pukul {formatBroadcastTime(selectedBroadcast.updatedTime || selectedBroadcast.time)} WIB
                      </span>
                    </div>

                    {/* Status Pembaruan */}
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6 bg-white/70">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Edit3 className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Status Versi</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 font-bold text-xs text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300">
                        <Check className="w-3.5 h-3.5 text-amber-700" />
                        Versi Diperbarui (Mutakhir)
                      </span>
                    </div>

                    {/* Catatan Riwayat */}
                    <div className="p-4 sm:p-5 bg-amber-50/70 text-xs text-amber-900 leading-relaxed font-medium">
                      Pesan siaran ini telah disunting dari isi awal yang dipublikasikan pada <strong>{formatDateLong(selectedBroadcast.originalDate || selectedBroadcast.date || '2026-07-28')} pukul {formatBroadcastTime(selectedBroadcast.originalTime || selectedBroadcast.time)} WIB</strong>.
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: Konten & Pesan Siaran */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                  Konten & Pesan Siaran
                </h2>

                <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-gray-700 text-sm font-medium">
                    <div className="flex items-center gap-2.5">
                      <MessageSquareText className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Teks Pengumuman Lengkap</span>
                    </div>
                    {selectedBroadcast.isEdited && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-md">
                        Versi Diperbarui
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-200/80 text-sm sm:text-base font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedBroadcast.message}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => handleOpenEditModal(selectedBroadcast)}
                  className="rounded-xl h-10 px-5 text-sm font-semibold text-amber-800 border-amber-300 hover:bg-amber-50 cursor-pointer shadow-2xs flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  Edit Pesan Ini
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailModalOpen(false)} 
                  className="rounded-xl h-10 px-6 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer shadow-2xs"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Edit Pesan Siaran */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-0 shadow-2xl border-0 overflow-hidden">
          <form onSubmit={handleUpdateBroadcast} className="flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80 shadow-2xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">Edit Pesan Siaran</h3>
                  <p className="text-xs text-gray-500 font-medium">Perbarui judul, penerima, atau pesan siaran yang telah dipancarkan</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 font-medium leading-relaxed">
                  <p className="font-bold">Pembaruan Waktu & Tanda Diedit Otomatis</p>
                  <p className="text-amber-800/90">
                    Menyimpan perubahan akan memperbarui isi pengumuman, mencatat waktu pembaruan terkini (jam sekarang), serta menambahkan tanda <strong>Diedit</strong> pada riwayat dan detail siaran.
                  </p>
                </div>
              </div>

              {/* Baris 1: Target Penerima & Tanggal Siaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Penerima */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" /> Target Penerima
                  </label>
                  <select 
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full h-12 sm:h-13 rounded-2xl border-gray-300 bg-white px-4 sm:px-5 text-sm sm:text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 shadow-2xs cursor-pointer"
                  >
                    <optgroup label="Penerima Global">
                      <option value="Semua Jamaah">Semua Jamaah (Global)</option>
                    </optgroup>
                    <optgroup label="Kloter & Rombongan">
                      {uniqueKloters.map((k, idx) => (
                        <option key={idx} value={k}>{k}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Petugas & Tim">
                      <option value="Semua Tour Leader">Semua Tour Leader</option>
                      <option value="Semua Mutawif">Semua Mutawif</option>
                      <option value="Seluruh Tim Operasional">Seluruh Tim Operasional (TL & Mutawif)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Tanggal Siaran */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Tanggal Siaran
                  </label>
                  <Input 
                    type="date"
                    value={editBroadcastDate}
                    onChange={(e) => setEditBroadcastDate(e.target.value)}
                    className="w-full h-12 sm:h-13 rounded-2xl border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Judul Siaran */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" /> Judul Pengumuman
                </label>
                <Input 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Kumpul Lobi Hotel & Keberangkatan Raudhah"
                  className="w-full h-12 sm:h-13 rounded-2xl border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                  required
                />
              </div>

              {/* Isi Pesan */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageSquareText className="w-3.5 h-3.5 text-purple-600" /> Isi Pesan Siaran
                  </label>
                  <span className="text-[11px] font-bold text-gray-400">{editMessage.length} karakter</span>
                </div>
                <textarea 
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  rows={5}
                  placeholder="Tuliskan instruksi detail atau pengumuman yang wajib diperhatikan oleh jamaah..."
                  className="w-full rounded-2xl border border-gray-300 bg-white p-4 sm:p-5 text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 shadow-2xs resize-none leading-relaxed"
                  required
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                className="h-12 px-6 rounded-2xl border-gray-300 text-gray-700 font-bold text-sm cursor-pointer shadow-2xs hover:bg-gray-100"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="h-12 px-6 rounded-2xl bg-[#740A03] hover:bg-[#580802] text-white font-bold text-sm shadow-sm cursor-pointer"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5" /> Simpan & Perbarui Siaran
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog (Standardized UI) */}
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemCount={selectedIds.size > 0 ? selectedIds.size : totalBroadcasts}
      />
    </div>
  );
}
