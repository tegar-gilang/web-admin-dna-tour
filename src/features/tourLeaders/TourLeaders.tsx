import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useStore, TourLeader } from '@/core/store';
import { tourLeaderService } from '@/core/services/tourLeaderService';
import { kloterService } from '@/core/services/kloterService';
import { toast } from '@/lib/toast';
import { exportToExcel } from '@/lib/export';
import { 
  Search, Filter, UserPlus, Trash2, Edit2, Eye,
  Users, Briefcase, Phone, Award, X, FileSpreadsheet,
  CheckCircle2, Clock, Calendar, User, UserCheck, Check,
  Compass, MapPin, ShieldCheck, Sparkles, Loader2, AlertCircle, RefreshCw, Plus
} from 'lucide-react';

export default function TourLeaders() {

// ==========================================
// FITUR: TOURLEADERS
// Komponen utama untuk fitur TOURLEADERS (API Integrated)
// ==========================================

  const { tourLeaders, setTourLeaders, groups, setGroups } = useStore();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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

  // Additional state for adding new kloter assignment inside modal
  const [selectedKloterToAssign, setSelectedKloterToAssign] = useState<string>('');
  const [isAssigningKloter, setIsAssigningKloter] = useState<boolean>(false);

  // Fetch Tour Leaders from Backend API
  const fetchTourLeaders = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await tourLeaderService.getTourLeaders();
      setTourLeaders(data);
    } catch (err: any) {
      const msg = err?.message || 'Gagal mengambil data Tour Leader dari server.';
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [setTourLeaders]);

  const fetchKloters = useCallback(async () => {
    try {
      const data = await kloterService.getKloters();
      setGroups(data);
    } catch (err) {
      console.error('Gagal mengambil data Kloter:', err);
    }
  }, [setGroups]);

  useEffect(() => {
    fetchTourLeaders();
    fetchKloters();
  }, [fetchTourLeaders, fetchKloters]);

  // Helper check assigned
  const isAssigned = (l: TourLeader) => Boolean(
    (l.kloters && l.kloters.length > 0) || 
    (l.group && l.group !== 'Unassigned' && l.group !== 'Belum Ditugaskan' && l.group !== '-')
  );

  // Helper to resolve Kloter UUID safely
  const getKloterUuid = useCallback((kloterIdOrUuid: string): string | null => {
    if (!kloterIdOrUuid || kloterIdOrUuid === 'Belum Ditugaskan') return null;
    const matchedGroup = groups.find(g => 
      (g.backendId && g.backendId === kloterIdOrUuid) || 
      g.id === kloterIdOrUuid || 
      g.name === kloterIdOrUuid
    );
    return matchedGroup?.backendId || matchedGroup?.id || kloterIdOrUuid;
  }, [groups]);

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

      // Group filter (matches any kloter in leader.kloters or leader.group)
      if (filterGroup) {
        const hasMatchingKloter = leader.kloters?.some(k => k.name === filterGroup || k.id === filterGroup || k.code === filterGroup)
          || leader.group === filterGroup;
        if (!hasMatchingKloter) return false;
      }

      // Search matching
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      const matchSearch = 
        leader.name.toLowerCase().includes(term) || 
        (leader.id && leader.id.toLowerCase().includes(term)) ||
        (leader.loginId && leader.loginId.toLowerCase().includes(term)) ||
        (leader.phone && leader.phone.includes(term)) ||
        (leader.group && leader.group !== 'Belum Ditugaskan' && leader.group.toLowerCase().includes(term)) ||
        (leader.kloters && leader.kloters.some(k => k.name.toLowerCase().includes(term))) ||
        ((leader.experience || leader.performance || '').toLowerCase().includes(term));

      return matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'id-asc') return (a.id || '').localeCompare(b.id || '');
      if (sortBy === 'id-desc') return (b.id || '').localeCompare(a.id || '');
      return 0;
    });
  }, [tourLeaders, activeTab, filterStatus, filterGroup, searchTerm, sortBy]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeaders.length && filteredLeaders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeaders.map(l => l.backendId || l.id)));
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

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const leadersToDelete = tourLeaders.filter(l => 
        selectedIds.has(l.backendId || l.id) || 
        (l.backendId && selectedIds.has(l.backendId)) || 
        (l.id && selectedIds.has(l.id))
      );

      for (const leader of leadersToDelete) {
        await tourLeaderService.deleteTourLeaderWithUnassign(leader);
      }
      toast(`${selectedIds.size} data Tour Leader berhasil dihapus.`, "success");
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      await fetchTourLeaders();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menghapus Tour Leader. Pastikan penugasan kloter sudah dilepas terlebih dahulu.';
      toast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Modal actions
  const openAddModal = () => {
    const newId = `TL-${Math.floor(100 + Math.random() * 900)}`;
    setEditingLeader(null);
    setFormData({
      id: newId,
      loginId: newId,
      name: '',
      phone: '',
      status: 'Active',
      experience: '5 Tahun',
      performance: 'Sangat Baik / Berpengalaman',
      group: 'Belum Ditugaskan'
    });
    setSelectedKloterToAssign('');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openEditModal = (leader: TourLeader) => {
    setEditingLeader(leader);
    setFormData({ ...leader });
    setSelectedKloterToAssign('');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openDetailModal = (leader: TourLeader) => {
    setEditingLeader(leader);
    setFormData({ ...leader });
    setSelectedKloterToAssign('');
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const saveLeader = async () => {
    if (!formData.name || !formData.name.trim()) {
      toast("Nama Tour Leader wajib diisi.", "error");
      return;
    }

    const loginIdValue = (formData.loginId || formData.id || '').trim();
    if (!loginIdValue) {
      toast("ID Tour Leader / Login ID wajib diisi.", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (editingLeader) {
        // Update existing Tour Leader
        const targetId = editingLeader.backendId || editingLeader.id;
        const updated = await tourLeaderService.updateTourLeader(targetId, {
          loginId: loginIdValue,
          name: formData.name.trim(),
          phone: formData.phone?.trim() || '',
          experience: formData.experience?.trim() || '',
          performance: formData.performance?.trim() || '',
          status: formData.status || 'Active',
        });

        // If a new kloter is selected to be assigned in form
        if (selectedKloterToAssign && selectedKloterToAssign !== 'Belum Ditugaskan') {
          const kloterUuid = getKloterUuid(selectedKloterToAssign);
          if (kloterUuid) {
            await tourLeaderService.assignKloter(updated.backendId || updated.id, kloterUuid);
          }
        }

        toast(`Data Tour Leader ${formData.name} berhasil diperbarui.`, "success");
      } else {
        // Create new Tour Leader
        const created = await tourLeaderService.createTourLeader({
          loginId: loginIdValue,
          name: formData.name.trim(),
          phone: formData.phone?.trim() || '',
          experience: formData.experience?.trim() || '1 Tahun',
          performance: formData.performance?.trim() || 'Sangat Baik',
          status: formData.status || 'Active',
        });

        // Assign kloter if selected
        if (selectedKloterToAssign && selectedKloterToAssign !== 'Belum Ditugaskan') {
          const kloterUuid = getKloterUuid(selectedKloterToAssign);
          if (kloterUuid) {
            await tourLeaderService.assignKloter(created.backendId || created.id, kloterUuid);
          }
        }

        toast(`Tour Leader ${formData.name} berhasil ditambahkan.`, "success");
      }

      setIsModalOpen(false);
      await fetchTourLeaders();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menyimpan data Tour Leader ke server.';
      toast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper assign single kloter from modal (with state sync)
  const handleAssignKloterToLeader = async (leaderId: string, kloterIdOrUuid: string) => {
    if (!kloterIdOrUuid || kloterIdOrUuid === 'Belum Ditugaskan') return;
    const targetId = leaderId;
    const kloterUuid = getKloterUuid(kloterIdOrUuid);

    if (!kloterUuid) {
      toast("ID Kloter tidak valid.", "error");
      return;
    }

    setIsAssigningKloter(true);
    try {
      const updated = await tourLeaderService.assignKloter(targetId, kloterUuid);
      toast(`Kloter berhasil ditugaskan ke Tour Leader.`, "success");
      setEditingLeader(updated);
      setFormData(updated);
      setSelectedKloterToAssign('');
      await fetchTourLeaders();
    } catch (err: any) {
      toast(err?.message || 'Gagal menugaskan Kloter.', 'error');
    } finally {
      setIsAssigningKloter(false);
    }
  };

  // Helper unassign single kloter from modal (with state sync)
  const handleUnassignKloterFromLeader = async (leaderId: string, kloterUuid: string) => {
    if (!leaderId || !kloterUuid) return;
    setIsAssigningKloter(true);
    try {
      await tourLeaderService.unassignKloter(leaderId, kloterUuid);
      toast(`Penugasan Kloter berhasil dilepas.`, "success");
      
      const refreshedDetail = await tourLeaderService.getTourLeaderById(leaderId);
      setEditingLeader(refreshedDetail);
      setFormData(refreshedDetail);
      await fetchTourLeaders();
    } catch (err: any) {
      toast(err?.message || 'Gagal melepaskan penugasan Kloter.', 'error');
    } finally {
      setIsAssigningKloter(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredLeaders.map((t, idx) => ({
      'No.': idx + 1,
      'ID Tour Leader': t.loginId || t.id,
      'Nama Lengkap': t.name,
      'No. Telepon / WA': t.phone || '-',
      'Kloter Penugasan': t.kloters && t.kloters.length > 0 ? t.kloters.map(k => k.name).join(', ') : t.group || 'Belum Ditugaskan',
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
              onClick={fetchTourLeaders}
              variant="outline"
              disabled={isLoading}
              className="text-xs h-10 font-semibold text-gray-700 border-gray-200 bg-white hover:bg-gray-50 justify-center px-3 rounded-xl cursor-pointer shadow-2xs"
              title="Refresh Data dari Server"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

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

      {/* Error Banner if API error */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-red-800 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button 
            onClick={fetchTourLeaders}
            size="sm"
            variant="outline"
            className="border-red-200 text-red-800 hover:bg-red-100 text-xs h-8 px-3 rounded-lg"
          >
            Coba Lagi
          </Button>
        </div>
      )}

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
              <span>Kloter Dibimbing</span>
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
          </div>
        </div>

        {/* Toolbar Bar - Search, Filter, Sort & Bulk Actions */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Cari Tour Leader, ID, WhatsApp, Kloter..."
                className="pl-10 h-10 text-xs rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className={`h-10 text-xs font-medium border-gray-200 rounded-xl px-3 flex items-center gap-1.5 cursor-pointer ${
                hasActiveFilters ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {selectedIds.size > 0 && (
              <Button
                onClick={handleDeleteSelected}
                variant="outline"
                className="h-10 text-xs font-semibold border-red-200 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl px-3 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Hapus ({selectedIds.size})</span>
              </Button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 text-xs rounded-xl border border-gray-200 bg-white px-3 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="name-asc">Nama (A-Z)</option>
                <option value="name-desc">Nama (Z-A)</option>
                <option value="id-asc">ID (Asc)</option>
                <option value="id-desc">ID (Desc)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="bg-gray-50/80 p-4 border-b border-gray-100 animate-fade-in grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Filter Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="w-full h-9 text-xs rounded-lg border border-gray-200 bg-white px-3 font-medium text-gray-700 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">Semua Status</option>
                <option value="ACTIVE">Aktif Membimbing</option>
                <option value="RESTING">Istirahat / Off</option>
                <option value="STANDBY">Siaga (Standby)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Filter Kloter
              </label>
              <select
                value={filterGroup}
                onChange={(e) => { setFilterGroup(e.target.value); setCurrentPage(1); }}
                className="w-full h-9 text-xs rounded-lg border border-gray-200 bg-white px-3 font-medium text-gray-700 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">Semua Kloter</option>
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-end">
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="h-9 text-xs text-gray-600 border-gray-200 hover:bg-gray-100 rounded-lg px-4 cursor-pointer"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[320px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Memuat data Tour Leader dari server...</p>
            </div>
          ) : filteredLeaders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-3">
              <Users className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-bold text-gray-700">Tidak ada data Tour Leader</p>
              <p className="text-xs text-gray-500 max-w-sm text-center">
                {searchTerm || hasActiveFilters
                  ? "Tidak ditemukan data yang cocok dengan kriteria pencarian/filter Anda."
                  : "Belum ada data Tour Leader yang tersimpan di sistem."}
              </p>
              {hasActiveFilters && (
                <Button onClick={resetFilters} variant="outline" size="sm" className="mt-2 text-xs rounded-xl">
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60 hover:bg-gray-50/60 border-gray-100">
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={selectedIds.size === filteredLeaders.length && filteredLeaders.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Pilih semua"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-3.5">
                    Tour Leader & ID
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-3.5">
                    No. Kontak / WA
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-3.5">
                    Kloter Penugasan
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-3.5">
                    Pengalaman
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-3.5">
                    Status Kesiapan
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider py-3.5 text-right pr-6">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((leader) => {
                  const itemKey = leader.backendId || leader.id;
                  const isSelected = selectedIds.has(itemKey);
                  const leaderKloters = leader.kloters && leader.kloters.length > 0
                    ? leader.kloters
                    : (leader.group && leader.group !== 'Belum Ditugaskan' && leader.group !== 'Unassigned' ? [{ id: '1', name: leader.group }] : []);

                  return (
                    <TableRow 
                      key={itemKey}
                      className={`border-gray-100 transition-colors hover:bg-gray-50/80 ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(itemKey)}
                          aria-label={`Pilih ${leader.name}`}
                        />
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100/70 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {leader.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                              {leader.name}
                            </p>
                            <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                              {leader.loginId || leader.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{leader.phone || '-'}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        {leaderKloters.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {leaderKloters.map((k, idx) => (
                              <span 
                                key={k.id || idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60"
                              >
                                <Briefcase className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>{k.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                            Belum Ditugaskan
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="text-xs text-gray-700 font-medium">
                          <p className="font-semibold text-gray-900">{leader.experience || '-'}</p>
                          {leader.performance && (
                            <p className="text-[11px] text-gray-500 truncate max-w-[160px]">{leader.performance}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        {leader.status === 'Active' || leader.status === 'Aktif' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Aktif Membimbing
                          </span>
                        ) : leader.status === 'Resting' || leader.status === 'Istirahat' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Istirahat / Off
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Siaga (Standby)
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetailModal(leader)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Detail Data Diri & Penugasan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(leader)}
                            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Tour Leader"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIds(new Set([itemKey]));
                              setIsDeleteDialogOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Tour Leader"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Table Footer with Pagination */}
        {!isLoading && filteredLeaders.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
            <div>
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredLeaders.length)} hingga {Math.min(currentPage * itemsPerPage, filteredLeaders.length)} dari {filteredLeaders.length} data
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs font-semibold border-gray-200 rounded-lg px-3 cursor-pointer disabled:opacity-50"
              >
                Sebelumnya
              </Button>

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === p 
                        ? 'bg-emerald-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 text-xs font-semibold border-gray-200 rounded-lg px-3 cursor-pointer disabled:opacity-50"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
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
            const activeKloters = activeLeader?.kloters && activeLeader.kloters.length > 0
              ? activeLeader.kloters
              : (activeLeader?.group && activeLeader.group !== 'Belum Ditugaskan' ? [{ id: '1', name: activeLeader.group }] : []);

            const activeTargetId = activeLeader?.backendId || activeLeader?.id;

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
                      <span className="font-bold text-gray-900 text-sm text-right font-mono">
                        {activeLeader?.loginId || activeLeader?.id || 'TL-001'}
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

                {/* Card 2: Rincian Penugasan Kloter (Multiple Kloter Support) */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    Rincian Penugasan Kloter
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 shadow-2xs space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                        Daftar Kloter Bimbingan ({activeKloters.length})
                      </label>
                      {activeKloters.length > 0 ? (
                        <div className="space-y-2">
                          {activeKloters.map((k) => (
                            <div key={k.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
                              <div className="flex items-center gap-3">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{k.name}</p>
                                  {k.code && <p className="text-[11px] font-mono text-gray-500">{k.code}</p>}
                                </div>
                              </div>
                              {activeTargetId && k.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isAssigningKloter}
                                  onClick={() => handleUnassignKloterFromLeader(activeTargetId, k.id)}
                                  className="text-xs border-red-200 text-red-700 hover:bg-red-50 rounded-xl h-8 px-3 cursor-pointer"
                                >
                                  Lepas Kloter
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          Belum ada Kloter yang ditugaskan ke Tour Leader ini.
                        </div>
                      )}
                    </div>

                    {/* Quick Assign Kloter Form in Detail View */}
                    {activeTargetId && (
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                        <select
                          value={selectedKloterToAssign}
                          onChange={(e) => setSelectedKloterToAssign(e.target.value)}
                          className="flex-1 h-10 text-xs rounded-xl border border-gray-300 bg-white px-3 font-semibold text-gray-800"
                        >
                          <option value="">-- Pilih Kloter Tambahan --</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.backendId || g.id}>{g.name} ({g.kloter || g.id})</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={!selectedKloterToAssign || isAssigningKloter}
                          onClick={() => handleAssignKloterToLeader(activeTargetId, selectedKloterToAssign)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-10 px-4 rounded-xl cursor-pointer"
                        >
                          {isAssigningKloter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                          Tugaskan
                        </Button>
                      </div>
                    )}
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

          {/* TAB 2: FORM EDIT */}
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
                        value={formData.loginId || formData.id || ''} 
                        onChange={(e) => setFormData({ ...formData, loginId: e.target.value, id: e.target.value })} 
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
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                      TAMBAH PENUGASAN KLOTER
                    </label>
                    <div className="sm:col-span-8">
                      <select
                        value={selectedKloterToAssign}
                        onChange={(e) => setSelectedKloterToAssign(e.target.value)}
                        className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                      >
                        <option value="">-- Pilih Kloter untuk Ditugaskan --</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.backendId || g.id}>{g.name} ({g.kloter || g.id})</option>
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
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)} 
                  className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
                >
                  Batal
                </Button>
                <Button 
                  onClick={saveLeader} 
                  disabled={isSaving}
                  className="h-12 rounded-2xl px-8 font-bold text-white bg-[#00a859] hover:bg-[#008f4c] text-base cursor-pointer shadow-2xs flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingLeader ? 'Simpan Perubahan' : 'Simpan Tour Leader'}</span>
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
        isLoading={isDeleting}
      />
    </div>
  );
}
