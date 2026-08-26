import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useStore, TourLeader } from '@/core/store';
import { toast } from '@/lib/toast';
import { exportToExcel } from '@/lib/export';
import { 
  Search, Filter, UserPlus, Trash2, Edit2, Eye,
  Users, Briefcase, Phone, Award, X, FileSpreadsheet,
  CheckCircle2, Clock, Calendar, User, UserCheck, Check,
  Compass, MapPin, ShieldCheck, Sparkles
} from 'lucide-react';

export default function TourLeaders() {
  const { tourLeaders, addTourLeader, updateTourLeader, deleteTourLeaders, groups } = useStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resting' | 'assigned' | 'unassigned'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'name-asc' | 'name-desc' | 'id-asc' | 'id-desc'>('newest');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'detail' | 'edit'>('edit');
  const [editingLeader, setEditingLeader] = useState<TourLeader | null>(null);
  const [formData, setFormData] = useState<Partial<TourLeader>>({});

  // Helper check assigned
  const isAssigned = (l: TourLeader) => Boolean(l.group && l.group !== 'Unassigned' && l.group !== 'Belum Ditugaskan' && l.group !== '-');

  // Statistics calculation
  const totalLeaders = tourLeaders.length;
  const activeCount = tourLeaders.filter(l => l.status === 'Active' || l.status === 'Aktif').length;
  const restingCount = tourLeaders.filter(l => l.status === 'Resting' || l.status === 'Istirahat' || l.status === 'Standby' || l.status === 'Siaga').length;
  const assignedCount = tourLeaders.filter(l => isAssigned(l)).length;
  const unassignedCount = totalLeaders - assignedCount;
  const activePercent = totalLeaders > 0 ? Math.round((activeCount / totalLeaders) * 100) : 0;

  const hasActiveFilters = Boolean(filterGroup || filterStatus);

  const resetFilters = () => {
    setFilterGroup("");
    setFilterStatus("");
    setSearchTerm("");
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Filter and sort logic
  const filteredLeaders = useMemo(() => {
    return tourLeaders.filter(leader => {
      // Tab filter
      if (activeTab === 'active' && leader.status !== 'Active' && leader.status !== 'Aktif') return false;
      if (activeTab === 'resting' && leader.status !== 'Resting' && leader.status !== 'Istirahat' && leader.status !== 'Standby' && leader.status !== 'Siaga') return false;
      if (activeTab === 'assigned' && !isAssigned(leader)) return false;
      if (activeTab === 'unassigned' && isAssigned(leader)) return false;

      // Status dropdown filter
      if (filterStatus) {
        if (filterStatus === 'ACTIVE' && leader.status !== 'Active' && leader.status !== 'Aktif') return false;
        if (filterStatus === 'RESTING' && leader.status !== 'Resting' && leader.status !== 'Istirahat') return false;
        if (filterStatus === 'STANDBY' && leader.status !== 'Standby' && leader.status !== 'Siaga') return false;
      }

      // Group filter
      if (filterGroup && leader.group !== filterGroup) {
        return false;
      }

      // Search matching
      const matchSearch = 
        leader.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        leader.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (leader.phone && leader.phone.includes(searchTerm)) ||
        (leader.group && leader.group.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((leader.experience || leader.performance || '').toLowerCase().includes(searchTerm.toLowerCase()));

      return matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'id-asc') return a.id.localeCompare(b.id);
      if (sortBy === 'id-desc') return b.id.localeCompare(a.id);
      return 0;
    });
  }, [tourLeaders, activeTab, filterStatus, filterGroup, searchTerm, sortBy]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeaders.length && filteredLeaders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeaders.map(l => l.id)));
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
    deleteTourLeaders(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsDeleteDialogOpen(false);
    toast(`${selectedIds.size} data tour leader berhasil dihapus.`, "success");
  };

  // Modal actions
  const openAddModal = () => {
    const newId = `TL-${Math.floor(100 + Math.random() * 900)}`;
    setEditingLeader(null);
    setFormData({
      id: newId,
      name: '',
      phone: '',
      status: 'Active',
      experience: '5 Tahun',
      performance: 'Sangat Baik / Berpengalaman',
      group: groups.length > 0 ? groups[0].name : 'Belum Ditugaskan'
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openEditModal = (leader: TourLeader) => {
    setEditingLeader(leader);
    setFormData({ ...leader });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openDetailModal = (leader: TourLeader) => {
    setEditingLeader(leader);
    setFormData(leader);
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const saveLeader = () => {
    if (!formData.name || !formData.name.trim()) {
      toast("Nama Tour Leader wajib diisi.", "error");
      return;
    }

    if (editingLeader) {
      updateTourLeader(editingLeader.id, {
        name: formData.name.trim(),
        phone: formData.phone?.trim() || '',
        group: formData.group || 'Belum Ditugaskan',
        experience: formData.experience?.trim() || '1 Tahun',
        performance: formData.performance?.trim() || 'Sangat Baik',
        status: formData.status || 'Active',
      });
      toast(`Data Tour Leader ${formData.name} berhasil diperbarui.`, "success");
    } else {
      const newId = formData.id || `TL-${Math.floor(100 + Math.random() * 900)}`;
      addTourLeader({
        id: newId,
        name: formData.name.trim(),
        phone: formData.phone?.trim() || '',
        group: formData.group || 'Belum Ditugaskan',
        experience: formData.experience?.trim() || '1 Tahun',
        performance: formData.performance?.trim() || 'Sangat Baik',
        status: formData.status || 'Active',
      });
      toast(`Tour Leader ${formData.name} berhasil ditambahkan.`, "success");
    }
    setIsModalOpen(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredLeaders.map((t, idx) => ({
      'No.': idx + 1,
      'ID Tour Leader': t.id,
      'Nama Lengkap': t.name,
      'No. Telepon / WA': t.phone || '-',
      'Kloter Penugasan': t.group || 'Belum Ditugaskan',
      'Pengalaman / Jam Terbang': t.experience || '-',
      'Catatan Performa': t.performance || 'Baik',
      'Status Penugasan': t.status === 'Active' || t.status === 'Aktif' ? 'Aktif Bertugas' : t.status === 'Resting' || t.status === 'Istirahat' ? 'Istirahat / Off' : t.status === 'Standby' || t.status === 'Siaga' ? 'Siaga' : t.status,
    }));
    exportToExcel(exportData, 'Data_Tour_Leader_DNA_Tour', 'Laporan Data Tour Leader & Pembimbing - DNA Tour');
    toast("Data Tour Leader berhasil diexport ke Excel.", "success");
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredLeaders.length / itemsPerPage));
  const paginatedData = filteredLeaders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner Container - Identical to Registration */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Tour Leader & Pembimbing
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Kelola penugasan, rekam jejak, kloter bimbingan, dan status aktif pembimbing jamaah
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              onClick={handleExportExcel}
              variant="outline"
              className="text-xs h-10 font-semibold text-gray-700 border-gray-200 bg-white hover:bg-gray-50 flex-1 sm:flex-none justify-center px-4 rounded-xl cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-gray-600" /> 
              Export Excel
            </Button>

            <Button 
              onClick={openAddModal}
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-2xs flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> 
              Tambah Tour Leader
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid Container - Interactive Category Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tour Leader */}
        <Card 
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all' 
              ? 'border-[#782820] ring-2 ring-[#782820]/20 bg-[#fefcfc]' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL TOUR LEADER</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalLeaders} Pembimbing
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-110">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Database Tour Leader Aktif</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Aktif Bertugas */}
        <Card 
          onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'active' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">AKTIF MEMBIMBING</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-emerald-800">
                  {activeCount} Orang
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{activePercent}% Rasio Siap Tugas di Lapangan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Siaga / Istirahat */}
        <Card 
          onClick={() => { setActiveTab('resting'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'resting' 
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SIAGA / ISTIRAHAT</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-amber-800">
                  {restingCount} Orang
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fdf6e7] text-[#c27803] flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#b45309]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Standby Penugasan Kloter</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Kloter Dibimbing */}
        <Card 
          onClick={() => { setActiveTab('assigned'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'assigned' 
              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">KLOTER DIBIMBING</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-blue-900">
                  {assignedCount} Kloter
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{unassignedCount} Pembimbing Siap Alokasi</span>
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
              <span>Semua Pembimbing</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalLeaders}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            
            <button 
              onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'active' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Aktif Bertugas</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'active' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {activeCount}
              </span>
              {activeTab === 'active' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('resting'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'resting' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Siaga / Istirahat</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'resting' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {restingCount}
              </span>
              {activeTab === 'resting' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('assigned'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'assigned' 
                  ? 'font-bold text-blue-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Teralokasi Kloter</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'assigned' 
                  ? 'bg-blue-100 text-blue-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {assignedCount}
              </span>
              {activeTab === 'assigned' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('unassigned'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'unassigned' 
                  ? 'font-bold text-rose-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Belum Ditugaskan</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'unassigned' 
                  ? 'bg-rose-100 text-rose-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {unassignedCount}
              </span>
              {activeTab === 'unassigned' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-rose-600 rounded-full animate-tab-indicator" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Cari tour leader, ID, no HP, kloter, pengalaman..." 
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
            <div className="space-y-1.5 w-full sm:w-52">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status Penugasan</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Status</option>
                <option value="ACTIVE">Aktif Bertugas</option>
                <option value="RESTING">Istirahat / Off</option>
                <option value="STANDBY">Siaga (Standby)</option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-56">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kloter Bimbingan</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={filterGroup}
                onChange={(e) => { setFilterGroup(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Kloter</option>
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
                <option value="Belum Ditugaskan">Belum Ditugaskan</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-52">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Urutan Data</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Terbaru Ditambahkan</option>
                <option value="name-asc">Nama Pembimbing (A - Z)</option>
                <option value="name-desc">Nama Pembimbing (Z - A)</option>
                <option value="id-asc">ID Tour Leader (Terkecil)</option>
                <option value="id-desc">ID Tour Leader (Terbesar)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9 text-xs text-gray-500 hover:text-gray-900 rounded-xl cursor-pointer"
                onClick={resetFilters}
              >
                Reset Filter
              </Button>
            )}
          </div>
        )}

        {/* Table View */}
        <div className="w-full overflow-x-auto touch-pan-x scrollbar-thin">
          <Table className="min-w-[1050px] w-full">
            <TableHeader className="bg-gray-50/80">
              <TableRow className="hover:bg-transparent border-b-gray-200">
                <TableHead className="w-12 text-center pl-4 py-3 whitespace-nowrap">
                  <Checkbox 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredLeaders.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[110px]">ID TL</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[220px]">Nama Tour Leader</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[180px]">Kloter Penugasan</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[160px]">Pengalaman</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[160px]">Status Penugasan</TableHead>
                <TableHead className="text-right pr-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[110px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody key={activeTab} className="animate-fade-in">
              {paginatedData.map((leader) => {
                const isSelected = selectedIds.has(leader.id);
                const assigned = isAssigned(leader);

                return (
                  <TableRow 
                    key={leader.id} 
                    className={`${isSelected ? "bg-emerald-50/40" : ""} hover:bg-gray-50/80 transition-colors group cursor-pointer`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"], button')) return;
                      openDetailModal(leader);
                    }}
                  >
                    <TableCell className="pl-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(leader.id)}
                        aria-label={`Pilih ${leader.name}`}
                      />
                    </TableCell>

                    {/* ID TL */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="font-bold text-sm tracking-tight text-[#480c0c] whitespace-nowrap">
                        {leader.id}
                      </div>
                    </TableCell>

                    {/* Nama Tour Leader */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-xs shrink-0 border border-emerald-200">
                          {leader.name
                            .split(' ')
                            .filter(Boolean)
                            .map(n => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{leader.name}</span>
                          <span className="text-xs text-gray-500 mt-0.5 font-medium whitespace-nowrap flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {leader.phone || '0812-3456-7890'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Kloter Penugasan */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {assigned ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-[#782820] bg-[#fcedea] border border-[#f5d0cb] shadow-2xs tracking-wide uppercase">
                          {leader.group}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic font-medium">
                          Belum Ditugaskan
                        </span>
                      )}
                    </TableCell>

                    {/* Pengalaman */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="text-xs font-semibold text-gray-800">
                          {leader.experience || leader.performance || '5 Tahun'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status Penugasan */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {leader.status === 'Active' || leader.status === 'Aktif' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          Aktif Bertugas
                        </span>
                      ) : leader.status === 'Resting' || leader.status === 'Istirahat' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Istirahat / Off
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-300 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          Siaga (Standby)
                        </span>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Lihat Data Pembimbing"
                          onClick={() => openDetailModal(leader)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Edit Tour Leader"
                          onClick={() => openEditModal(leader)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Hapus Data"
                          onClick={() => {
                            setSelectedIds(new Set([leader.id]));
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredLeaders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-56 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-200">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-900">Tidak ada data Tour Leader ditemukan</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm">
                        Ubah filter pencarian atau gunakan tombol tambah untuk mendaftarkan tour leader baru.
                      </p>
                      {hasActiveFilters && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 text-xs rounded-xl cursor-pointer"
                          onClick={resetFilters}
                        >
                          Reset Semua Filter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer - Identical to Registration */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            Menampilkan <span className="font-semibold text-gray-900">{filteredLeaders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredLeaders.length)}</span> dari <span className="font-semibold text-gray-900">{filteredLeaders.length}</span> pembimbing
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-lg border-gray-200 text-gray-700 flex-1 sm:flex-none cursor-pointer" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <span className="text-xs font-medium text-gray-600 px-2">
              Hal {currentPage} / {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-lg border-gray-200 text-gray-700 flex-1 sm:flex-none cursor-pointer" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Dialog for Data Diri & Form Edit - Matches Registration Reference Design */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Pill Tabs */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {editingLeader ? (
                <>
                  <button
                    type="button"
                    onClick={() => setModalMode('detail')}
                    className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                      modalMode === 'detail'
                        ? 'bg-[#00a859] text-white shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Data Diri Pembimbing
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('edit')}
                    className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                      modalMode === 'edit'
                        ? 'bg-[#00a859] text-white shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Form Edit
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#00a859] text-white shadow-xs cursor-default select-none"
                >
                  Tambah Tour Leader
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

          {/* TAB 1: DATA DIRI DETAIL */}
          {modalMode === 'detail' && (() => {
            const activeLeader = editingLeader || (formData.name ? (formData as TourLeader) : tourLeaders[0]);
            const matchedGroup = groups.find(g => g.name === activeLeader?.group);

            return (
              <div className="space-y-7 animate-fade-in">
                {/* Card 1: Informasi Pribadi Tour Leader */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    Informasi Pribadi & Kualifikasi
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nama Lengkap</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeLeader?.name || 'Ust. Khalid Basalamah'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Compass className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>ID Tour Leader</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeLeader?.id || 'TL-001'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Phone className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nomor WhatsApp / HP</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeLeader?.phone || '+62 812 3456 7890'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Award className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Pengalaman Lapangan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeLeader?.experience || '10 tahun'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <ShieldCheck className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Status Kesiapan</span>
                      </div>
                      <span className="font-bold text-sm text-right">
                        {activeLeader?.status === 'Active' || activeLeader?.status === 'Aktif' ? (
                          <span className="text-[#00a859] font-bold">Aktif Membimbing</span>
                        ) : activeLeader?.status === 'Resting' || activeLeader?.status === 'Istirahat' ? (
                          <span className="text-amber-700 font-bold">Istirahat / Off</span>
                        ) : (
                          <span className="text-blue-700 font-bold">Siaga (Standby)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Rincian Penugasan Kloter */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    Rincian Penugasan Kloter
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Briefcase className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Kloter Bimbingan Saat Ini</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeLeader?.group || 'Group A-1'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Users className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Estimasi Jamaah Kloter</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {matchedGroup?.pilgrims ? `${matchedGroup.pilgrims} Jamaah` : '45 Jamaah'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Sparkles className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Partner Muthawwif Lokal</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {matchedGroup?.mutawif || 'Syeikh Ammar'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Catatan Performa / Review</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeLeader?.performance || 'Sangat Disiplin & Menguasai Manasik'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Tutup Button */}
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)} 
                    className="rounded-xl h-10 px-6 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer shadow-2xs"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: FORM EDIT (Exact Match to Registration Form Style) */}
          {modalMode === 'edit' && (
            <div className="space-y-6 animate-fade-in">
              {/* Section 1: INFORMASI PRIBADI & KUALIFIKASI */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    1
                  </div>
                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    INFORMASI PRIBADI & KUALIFIKASI
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* ID TOUR LEADER */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      ID TOUR LEADER *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.id || ''} 
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })} 
                        placeholder="Cth. TL-001" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* NAMA LENGKAP */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NAMA LENGKAP *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        placeholder="Cth. Ust. Khalid Basalamah" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* NOMOR WHATSAPP / HP */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NOMOR WHATSAPP / HP
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.phone || ''} 
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                        placeholder="Cth. +62 812 3456 7890" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* PENGALAMAN LAPANGAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      PENGALAMAN LAPANGAN
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.experience || ''} 
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })} 
                        placeholder="Cth. 10 tahun (40+ Keberangkatan)" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* STATUS KESIAPAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      STATUS KESIAPAN
                    </label>
                    <div className="sm:col-span-8">
                      <select
                        value={formData.status || 'Active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                      >
                        <option value="Active">Aktif Membimbing</option>
                        <option value="Resting">Istirahat / Off</option>
                        <option value="Standby">Siaga (Standby)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: RINCIAN PENUGASAN KLOTER */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    2
                  </div>
                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    RINCIAN PENUGASAN KLOTER
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* KLOTER BIMBINGAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KLOTER BIMBINGAN *
                    </label>
                    <div className="sm:col-span-8">
                      <select
                        value={formData.group || 'Belum Ditugaskan'}
                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                        className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                      >
                        <option value="Belum Ditugaskan">-- Belum Ditugaskan --</option>
                        <option value="Group A-1">Group A-1</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.name}>{g.name} ({g.kloter || g.id})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CATATAN PERFORMA / REVIEW */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      CATATAN PERFORMA / REVIEW
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.performance || ''} 
                        onChange={(e) => setFormData({ ...formData, performance: e.target.value })} 
                        placeholder="Cth. Sangat Disiplin & Menguasai Manasik" 
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
                  onClick={saveLeader} 
                  className="h-12 rounded-2xl px-8 font-bold text-white bg-[#00a859] hover:bg-[#008f4c] text-base cursor-pointer shadow-2xs"
                >
                  {editingLeader ? 'Simpan Perubahan' : 'Simpan Tour Leader'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Bulk / Single Delete Dialog */}
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        itemCount={selectedIds.size}
      />
    </div>
  );
}
