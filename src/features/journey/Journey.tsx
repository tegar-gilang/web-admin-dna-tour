import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '@/lib/toast';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useStore, Schedule, ScheduleCategory } from '@/core/store';
import { exportToExcel } from '@/lib/export';
import { exportJourneyScheduleToPdf } from '@/lib/exportPdf';
import { 
  Plus, Search, Filter, Download, Trash2, Edit2, CheckCircle2, Circle, Clock,
  MapPin, Calendar, Sparkles, ChevronDown, ChevronUp, UserCheck, Shirt, Lightbulb,
  Building2, Plane, Coffee, BookOpen, Compass, List, ArrowRight, RefreshCw, Check,
  Activity, User, Flag, Layers, CheckSquare, Square, X, Printer
} from 'lucide-react';

export default function Journey() {

// ==========================================
// FITUR: JOURNEY
// Komponen utama untuk fitur JOURNEY
// ==========================================

  const { schedules, addSchedule, updateSchedule, deleteSchedules } = useStore();

  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedDayTab, setSelectedDayTab] = useState<number | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Table pagination & selection
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<Partial<Schedule>>({
    category: 'ibadah',
    dayNumber: 1
  });

  const now = new Date();

  // Helper to format date string into 'DD MMMM YYYY' in Indonesian
  const formatDateFormatted = (dateStr?: string) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const mIndex = parseInt(month, 10) - 1;
      const mName = months[mIndex] || month;
      return `${parseInt(day, 10)} ${mName} ${year}`;
    }
    return dateStr;
  };

  // Sort schedules chronologically
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [schedules]);

  // Helper / Map to calculate activity status automatically based on current time & overrides
  const scheduleStatusMap = useMemo(() => {
    const map = new Map<string, 'completed' | 'in_progress' | 'upcoming'>();
    if (sortedSchedules.length === 0) return map;

    const currentTime = now.getTime();

    sortedSchedules.forEach((schedule, index) => {
      if (schedule.statusOverride) {
        map.set(schedule.id, schedule.statusOverride);
      } else {
        const startTime = new Date(`${schedule.date}T${schedule.time}`).getTime();
        const nextSchedule = sortedSchedules[index + 1];
        const nextStart = nextSchedule
          ? new Date(`${nextSchedule.date}T${nextSchedule.time}`).getTime()
          : startTime + 2 * 60 * 60 * 1000; // Default 2 hours duration for the last item

        if (currentTime >= nextStart) {
          map.set(schedule.id, 'completed');
        } else if (currentTime >= startTime && currentTime < nextStart) {
          map.set(schedule.id, 'in_progress');
        } else {
          map.set(schedule.id, 'upcoming');
        }
      }
    });

    return map;
  }, [sortedSchedules, now]);

  // Helper function to get schedule status from calculated status map
  const getScheduleStatus = (schedule: Schedule): 'completed' | 'in_progress' | 'upcoming' => {
    return scheduleStatusMap.get(schedule.id) || schedule.statusOverride || 'upcoming';
  };

  // Animation props based on status
  const getAnimationProps = (status: string, index: number) => {
    if (status === 'completed') {
      return {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 0.85, x: 0 },
        transition: { duration: 0.3, delay: Math.min(index * 0.04, 0.4) }
      };
    } else if (status === 'in_progress') {
      return {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.4, delay: Math.min(index * 0.04, 0.4), type: 'spring' as const }
      };
    } else {
      return {
        initial: { opacity: 0, x: 10 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.3, delay: Math.min(index * 0.04, 0.4) }
      };
    }
  };

  // Statistics
  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let upcoming = 0;

    sortedSchedules.forEach(s => {
      const status = getScheduleStatus(s);
      if (status === 'completed') completed++;
      else if (status === 'in_progress') inProgress++;
      else upcoming++;
    });

    const total = sortedSchedules.length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, upcoming, progressPercent };
  }, [sortedSchedules]);

  // Unique Days with representative date
  const daysWithInfo = useMemo(() => {
    const map = new Map<number, string>();
    sortedSchedules.forEach(s => {
      const dayNum = s.dayNumber || 1;
      if (!map.has(dayNum)) {
        map.set(dayNum, s.date);
      }
    });
    return Array.from(map.entries())
      .map(([dayNumber, date]) => ({ dayNumber, date }))
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }, [sortedSchedules]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return sortedSchedules.filter(s => {
      const matchesSearch = 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.keterangan && s.keterangan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.pic && s.pic.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
      const status = getScheduleStatus(s);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      const matchesDate = filterDate ? s.date === filterDate : true;
      const matchesDayTab = selectedDayTab === 'all' || (s.dayNumber || 1) === selectedDayTab;

      return matchesSearch && matchesCategory && matchesStatus && matchesDate && matchesDayTab;
    });
  }, [sortedSchedules, searchTerm, filterCategory, filterStatus, filterDate, selectedDayTab]);

  // Pagination for table view
  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    return filteredSchedules.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredSchedules, currentPage, itemsPerPage]);

  // Category visual mapping
  const getCategoryBadge = (category?: ScheduleCategory) => {
    switch (category) {
      case 'ibadah':
        return {
          label: 'Ibadah',
          bg: 'bg-red-50 text-red-800 border-red-200',
          icon: <Compass className="w-3.5 h-3.5 mr-1 text-red-600" />
        };
      case 'ziyarah':
        return {
          label: 'Ziyarah / Tur',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <MapPin className="w-3.5 h-3.5 mr-1 text-amber-600" />
        };
      case 'makan':
        return {
          label: 'Konsumsi',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: <Coffee className="w-3.5 h-3.5 mr-1 text-rose-600" />
        };
      case 'transit':
        return {
          label: 'Transit / Transport',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <Plane className="w-3.5 h-3.5 mr-1 text-blue-600" />
        };
      case 'hotel':
        return {
          label: 'Hotel / Check-in',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <Building2 className="w-3.5 h-3.5 mr-1 text-purple-600" />
        };
      case 'manasik':
        return {
          label: 'Manasik & Edukasi',
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          icon: <BookOpen className="w-3.5 h-3.5 mr-1 text-teal-600" />
        };
      default:
        return {
          label: 'Kegiatan',
          bg: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Calendar className="w-3.5 h-3.5 mr-1 text-gray-600" />
        };
    }
  };

  // Actions
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSchedules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSchedules.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteSchedules(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsDeleteDialogOpen(false);
    toast("Jadwal terpilih berhasil dihapus.");
  };

  const toggleStatusOverride = (schedule: Schedule) => {
    const currentStatus = getScheduleStatus(schedule);
    let nextStatus: 'completed' | 'in_progress' | 'upcoming';
    if (currentStatus === 'upcoming') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'completed';
    else nextStatus = 'upcoming';

    if (nextStatus === 'in_progress') {
      schedules.forEach(s => {
        if (s.id !== schedule.id && s.statusOverride === 'in_progress') {
          updateSchedule(s.id, { statusOverride: undefined });
        }
      });
    }

    updateSchedule(schedule.id, { statusOverride: nextStatus });
    toast(`Status kegiatan diubah menjadi "${nextStatus === 'completed' ? 'Selesai' : nextStatus === 'in_progress' ? 'Sedang Berlangsung' : 'Belum Mulai'}"`);
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: '08:00',
      category: 'ibadah',
      dayNumber: daysWithInfo.length > 0 ? daysWithInfo[daysWithInfo.length - 1].dayNumber : 1,
      title: '',
      location: '',
      keterangan: '',
      pic: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData(schedule);
    setIsModalOpen(true);
  };

  const saveSchedule = () => {
    if (!formData.title || !formData.date || !formData.time) {
      toast("Mohon isi judul, tanggal, dan waktu kegiatan.");
      return;
    }

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, formData);
      toast("Jadwal berhasil diperbarui.");
    } else {
      addSchedule({
        id: `S-${Math.floor(100 + Math.random() * 900)}`,
        title: formData.title || 'Kegiatan Tanpa Judul',
        date: formData.date || '2026-07-27',
        time: formData.time || '08:00',
        location: formData.location || 'Lokasi Kegiatan',
        keterangan: formData.keterangan || '',
        category: formData.category || 'ibadah',
        pic: formData.pic || '',
        dayNumber: Number(formData.dayNumber) || 1
      });
      toast("Jadwal baru berhasil ditambahkan.");
    }
    setIsModalOpen(false);
  };

  const handleExportPDF = () => {
    try {
      exportJourneyScheduleToPdf({
        schedules: filteredSchedules
      });
      toast("Dokumen PDF Jadwal Perjalanan berhasil diunduh.", "success");
    } catch (err) {
      console.error(err);
      toast("Gagal mengunduh PDF, silakan coba lagi.", "error");
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredSchedules.map(s => ({
      'ID Jadwal': s.id,
      'Hari ke-': s.dayNumber ? `Hari ${s.dayNumber}` : '-',
      'Tanggal': s.date,
      'Waktu': s.time,
      'Kategori': s.category || '-',
      'Judul Kegiatan': s.title,
      'Lokasi': s.location,
      'Penanggung Jawab': s.pic || '-',
      'Keterangan': s.keterangan || '-'
    }));
    exportToExcel(exportData, 'Timeline_Jadwal_Perjalanan', 'Laporan Jadwal Perjalanan - DNA Tour');
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Refined Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-emerald-700" />
              Timeline Perjalanan
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1 max-w-2xl">
              kelola seluruh agenda jamaah dari tanah air hingga tanah suci secara informatif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              className="text-[13px] h-10 font-bold text-slate-700 border-slate-200 hover:bg-slate-50 flex-1 sm:flex-none justify-center px-4 rounded-xl cursor-pointer bg-white shadow-none"
            >
              <Printer className="w-[18px] h-[18px] mr-2 text-slate-500" />
              Cetak PDF
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              className="text-[13px] h-10 font-bold text-slate-700 border-slate-200 hover:bg-slate-50 flex-1 sm:flex-none justify-center px-4 rounded-xl cursor-pointer bg-white shadow-none"
            >
              <Download className="w-[18px] h-[18px] mr-2 text-emerald-600" />
              Excel
            </Button>

            <Button 
              onClick={openAddModal} 
              className="bg-[#740a03] hover:bg-[#580802] text-white font-bold text-[13px] h-10 px-5 rounded-xl shadow-none flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <Plus className="w-[18px] h-[18px] mr-2 stroke-[2.5]" />
              Tambah Jadwal
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards & Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-red-900 to-red-950 text-white shadow-md border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Compass className="w-40 h-40 text-white" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-semibold tracking-wider text-red-200/80">Progres Agenda Utama</span>
                <span className="text-2xl font-bold text-red-300">{stats.progressPercent}%</span>
              </div>
              <h3 className="text-xl font-bold mt-1 text-white">Kelancaran Itinerary Umrah</h3>
              <p className="text-xs text-red-100/70 mt-1">
                {stats.completed} dari {stats.total} agenda telah terlaksana dengan sukses.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="w-full bg-red-800/60 rounded-full h-3 overflow-hidden p-0.5 border border-red-700/50">
                <motion.div 
                  className="bg-gradient-to-r from-red-400 to-red-300 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-red-200/90 font-medium">
                <span>Hari Ini: <strong className="text-white">{stats.inProgress} Berlangsung</strong></span>
                <span>Mendatang: <strong className="text-white">{stats.upcoming} Agenda</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-2xs flex flex-col justify-between">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Status Saat Ini</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1.5" />
              Kegiatan Sedang Berlangsung
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-2xs flex flex-col justify-between">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Selesai / Terjadwal</span>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.completed} <span className="text-sm font-normal text-gray-400">/ {stats.total}</span>
            </div>
            <p className="text-xs text-red-600 font-medium mt-1 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              {stats.upcoming} kegiatan mendatang
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: View Switcher & Filters */}
      <Card className="bg-white border-gray-200 shadow-2xs">
        <CardHeader className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            {/* View Mode Selector Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-full lg:w-auto">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-red-800 shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Compass className="w-4 h-4" />
                Timeline Alur
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-red-800 shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                Tabel Kelola Data
              </button>
            </div>

            {/* Search and Filter Trigger */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari agenda, lokasi, PIC..."
                  className="pl-9 bg-gray-50 border-gray-200 text-sm h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                className={`w-full sm:w-auto h-9 cursor-pointer ${showFilters ? 'bg-red-700 text-white' : 'bg-gray-50 text-gray-700'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1.5" />
                Filter Detail
                {(filterCategory !== 'all' || filterStatus !== 'all' || filterDate !== '') && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-200 text-red-900 rounded-full font-bold">!</span>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Day Selector Tabs removed per user request */}

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-3 border-t border-gray-100"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Kategori Kegiatan
                    </label>
                    <select
                      className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-2xs focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="all">Semua Kategori</option>
                      <option value="ibadah">🕌 Ibadah</option>
                      <option value="ziyarah">🚌 Ziyarah / Tur</option>
                      <option value="makan">🍽️ Konsumsi</option>
                      <option value="transit">✈️ Transit / Penerbangan</option>
                      <option value="hotel">🏨 Hotel / Check-in</option>
                      <option value="manasik">📜 Manasik & Pengarahan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Status Pelaksanaan
                    </label>
                    <select
                      className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-2xs focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Semua Status</option>
                      <option value="completed">✅ Selesai</option>
                      <option value="in_progress">⚡ Sedang Berlangsung</option>
                      <option value="upcoming">⏳ Akan Datang</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Pilih Tanggal
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-2xs focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                      {(filterCategory !== 'all' || filterStatus !== 'all' || filterDate !== '' || selectedDayTab !== 'all') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 text-xs text-gray-500 hover:text-red-600 cursor-pointer"
                          onClick={() => {
                            setFilterCategory('all');
                            setFilterStatus('all');
                            setFilterDate('');
                            setSelectedDayTab('all');
                          }}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>
      </Card>

      {/* VIEW MODE 1: TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <Card className="bg-white border-gray-200 shadow-2xs">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Alur Timeline Perjalanan</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Linimasa agenda perjalanan jamaah secara berurutan dan terpantau real-time.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-medium text-red-800 bg-red-50 border-red-200">
                {filteredSchedules.length} Agenda Ditemukan
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {filteredSchedules.length > 0 ? (
              <div className="relative pl-2 sm:pl-6 space-y-6">
                {filteredSchedules.map((schedule, index) => {
                  const status = getScheduleStatus(schedule);
                  const catInfo = getCategoryBadge(schedule.category);
                  const animProps = getAnimationProps(status, index);

                  return (
                    <motion.div
                      key={schedule.id}
                      initial={animProps.initial}
                      animate={animProps.animate}
                      transition={animProps.transition}
                      className="relative z-10 flex items-start gap-3 sm:gap-5 group min-w-0"
                    >
                      {/* Timeline Segment Line */}
                      {index < filteredSchedules.length - 1 && (
                        <div className="absolute left-[11px] top-[28px] bottom-[-24px] w-0.5 bg-gray-200 -z-10" style={{ left: '11px' }}>
                          {status === 'completed' && (
                            <div className="w-full h-full bg-green-500" />
                          )}
                          {status === 'in_progress' && (
                            <div className="w-full h-1/2 bg-blue-400" />
                          )}
                        </div>
                      )}

                      {/* Timeline Icon Node */}
                      <button 
                        onClick={() => toggleStatusOverride(schedule)}
                        className="mt-3 flex-shrink-0 cursor-pointer focus:outline-none"
                      >
                        {status === 'completed' ? (
                          <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center ring-2 ring-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : status === 'in_progress' ? (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center ring-2 ring-white">
                            <Activity className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center ring-2 ring-white">
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                          </div>
                        )}
                      </button>

                      {/* Timeline Content Card */}
                      <div className={`flex-1 min-w-0 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg p-3 sm:p-4 transition-all duration-200 shadow-xs`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                          {/* Detail Left Side */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                            
                            <div className="flex flex-col w-full sm:w-44 shrink-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-[#740A03] border border-rose-200">
                                  Hari {schedule.dayNumber || 1}
                                </span>
                                <span className="font-mono text-sm font-bold text-gray-900">
                                  {schedule.time} WIB
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 font-medium mt-1">{formatDateFormatted(schedule.date)}</span>
                            </div>

                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-bold text-gray-900 text-sm truncate">{schedule.title}</span>
                              {schedule.keterangan && (
                                <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">{schedule.keterangan}</span>
                              )}
                            </div>

                            <div className="flex flex-col w-full sm:w-40 shrink-0">
                              <div className="flex items-center text-xs font-medium text-gray-600">
                                <MapPin className="w-3.5 h-3.5 text-red-600 mr-1.5 shrink-0" />
                                <span className="truncate">{schedule.location}</span>
                              </div>
                            </div>
                            
                            <div className="w-full sm:w-32 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleStatusOverride(schedule)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors focus:outline-none py-1 px-2 rounded-lg hover:bg-gray-100/60"
                              >
                                {status === 'completed' ? (
                                  <>
                                    <CheckSquare className="w-4 h-4 text-green-600 shrink-0" />
                                    <span className="font-bold text-green-700">Selesai</span>
                                  </>
                                ) : status === 'in_progress' ? (
                                  <>
                                    <Activity className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
                                    <span className="font-bold text-blue-700">Berlangsung</span>
                                  </>
                                ) : (
                                  <>
                                    <Square className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="font-medium text-gray-500">Belum Selesai</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Right Column: Edit Action */}
                          <div className="flex items-center justify-end shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs font-medium text-gray-700 hover:text-red-800 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all rounded-lg cursor-pointer"
                              onClick={() => openEditModal(schedule)}
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1.5 text-red-600" /> Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 space-y-3">
                <Compass className="w-12 h-12 mx-auto text-gray-300" />
                <p className="font-semibold text-gray-700">Tidak ada agenda perjalanan yang sesuai filter.</p>
                <p className="text-xs text-gray-400">Coba atur ulang kata kunci pencarian atau filter status Anda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* VIEW MODE 2: TABLE DATA MANAGEMENT */}
      {viewMode === 'table' && (
        <Card className="bg-white border-gray-200 shadow-2xs">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Pengelolaan Data Jadwal & Itinerary</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Kelola, edit, atau hapus entri kegiatan dalam bentuk daftar tabel ringkas.
                </CardDescription>
              </div>

              {selectedIds.size > 0 && (
                <Button 
                  onClick={handleDeleteSelected} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Hapus ({selectedIds.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-gray-50/80 border-b border-gray-200">
                    <TableHead className="w-14 text-center pl-6">
                      <Checkbox 
                        checked={selectedIds.size > 0 && selectedIds.size === filteredSchedules.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Pilih semua"
                        className="border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                    </TableHead>
                    <TableHead className="w-[200px] font-semibold text-gray-900">Hari & Waktu</TableHead>
                    <TableHead className="font-semibold text-gray-900">Detail Kegiatan</TableHead>
                    <TableHead className="w-[180px] font-semibold text-gray-900">Lokasi</TableHead>
                    <TableHead className="w-[170px] font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="text-right pr-6 font-semibold text-gray-900">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => {
                    const status = getScheduleStatus(schedule);

                    return (
                      <TableRow key={schedule.id} className={`transition-all ${selectedIds.has(schedule.id) ? "bg-red-50/50" : "hover:bg-gray-50 relative z-10"}`}>
                        <TableCell className="pl-6">
                          <Checkbox 
                            checked={selectedIds.has(schedule.id)}
                            onCheckedChange={() => toggleSelect(schedule.id)}
                            aria-label={`Pilih ${schedule.title}`}
                            className="border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-[#740A03] border border-rose-200">
                                Hari {schedule.dayNumber || 1}
                              </span>
                              <span className="font-mono text-sm font-bold text-gray-900">
                                {schedule.time} WIB
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{formatDateFormatted(schedule.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm">{schedule.title}</span>
                            {schedule.keterangan && (
                               <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">{schedule.keterangan}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-800 text-xs font-medium truncate max-w-[170px]">
                            <MapPin className="w-3.5 h-3.5 text-red-600 mr-1 shrink-0" />
                            <span className="truncate">{schedule.location || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => toggleStatusOverride(schedule)}
                            className="cursor-pointer focus:outline-none inline-flex items-center gap-1.5 text-xs transition-colors py-0.5 px-1.5 rounded hover:bg-gray-100/60"
                            title="Klik untuk mengubah status"
                          >
                            {status === 'in_progress' ? (
                              <>
                                <Activity className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
                                <span className="font-bold text-blue-700">Sedang Berlangsung</span>
                              </>
                            ) : status === 'completed' ? (
                              <>
                                <CheckSquare className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="font-bold text-green-700">Selesai</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-medium text-gray-400">Belum Selesai</span>
                              </>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all rounded-lg cursor-pointer" onClick={() => openEditModal(schedule)}>
                            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredSchedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                        Tidak ada data kegiatan ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer Summary */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Total menampilkan <span className="font-bold text-gray-900">{filteredSchedules.length}</span> agenda
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Add / Edit Schedule */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Tabs */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {editingSchedule ? (
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#00a859] text-white shadow-xs cursor-default select-none"
                >
                  Form Edit
                </button>
              ) : (
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#00a859] text-white shadow-xs cursor-default select-none"
                >
                  Tambah Agenda
                </button>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 animate-fade-in text-left">
            {/* Section 1: INFORMASI AGENDA */}
            <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                  1
                </div>
                <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                  INFORMASI AGENDA
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    NAMA KEGIATAN *
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      value={formData.title || ''} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})} 
                      placeholder="Cth. Ziyarah Raudhah & Makam Rasulullah" 
                      className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    KATEGORI
                  </label>
                  <div className="sm:col-span-8 relative">
                    <Input 
                      list="journey-categories"
                      value={formData.category || ''} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})} 
                      placeholder="Pilih atau ketik kategori..." 
                      className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] w-full"
                    />
                    <datalist id="journey-categories">
                      <option value="ibadah" />
                      <option value="ziyarah" />
                      <option value="manasik" />
                      <option value="transit" />
                      <option value="hotel" />
                      <option value="makan" />
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    KETERANGAN
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      value={formData.keterangan || ''} 
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value})} 
                      placeholder="Cth. Kumpul di Lobi 10 menit sebelumnya..." 
                      className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: WAKTU & TEMPAT */}
            <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                  2
                </div>
                <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                  WAKTU & TEMPAT
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    HARI KE-
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      type="number" 
                      min="1"
                      max="30"
                      value={formData.dayNumber || 1} 
                      onChange={(e) => setFormData({...formData, dayNumber: parseInt(e.target.value, 10) || 1})} 
                      className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    TANGGAL *
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      type="date" 
                      value={formData.date || ''} 
                      onChange={(e) => setFormData({...formData, date: e.target.value})} 
                      className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    WAKTU (JAM) *
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      type="time" 
                      value={formData.time || ''} 
                      onChange={(e) => setFormData({...formData, time: e.target.value})} 
                      className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    LOKASI KEGIATAN
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      value={formData.location || ''} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})} 
                      placeholder="Cth. Masjid Nabawi Madinah" 
                      className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
              >
                Batal
              </Button>
              <Button 
                onClick={saveSchedule} 
                className="h-12 rounded-2xl px-8 font-bold text-white bg-[#00a859] hover:bg-[#008f4c] text-base cursor-pointer shadow-2xs"
              >
                {editingSchedule ? 'Simpan Perubahan' : 'Simpan Agenda'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        itemCount={selectedIds.size}
      />
    </div>
  );
}
