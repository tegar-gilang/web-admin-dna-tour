import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, Filter, Plus, Trash2, Edit2, UserPlus, Info, 
  MapPin, Users2, AlertTriangle, Briefcase, Eye, BedDouble, 
  CheckCircle2, Layers, FileSpreadsheet, X, Users, Building2, Calendar, ShieldCheck,
  Sparkles, UserCheck
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { useStore, Group } from '@/core/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { exportToExcel } from '@/lib/export';

export default function Groups() {
  const navigate = useNavigate();
  const { 
    groups, 
    addGroup, 
    updateGroup, 
    deleteGroups, 
    pilgrims, 
    updatePilgrim, 
    tourLeaders, 
    mutawifs, 
    schedules, 
    emergencies,
    rooms 
  } = useStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'detail' | 'edit'>('edit');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
  const [isAddingPilgrim, setIsAddingPilgrim] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "jamaah" | "petugas" | "perjalanan" | "darurat">("info");
  const [pilgrimSearchTerm, setPilgrimSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<Group>>({});

  // Stats Calculations
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.status === 'Active' || g.status === 'Aktif').length;
  const draftGroups = groups.filter(g => g.status === 'Draft').length;
  const archivedGroups = groups.filter(g => g.status === 'Archived' || g.status === 'Diarsipkan').length;
  const totalPilgrimsInGroups = pilgrims.filter(p => p.group && p.group !== '-' && p.group !== 'Belum ada kloter').length;
  const totalAssignedStaff = tourLeaders.filter(t => t.group && t.group !== '-').length + mutawifs.filter(m => m.group && m.group !== '-').length;

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      // Tab filter
      if (activeTab === 'active' && !(g.status === 'Active' || g.status === 'Aktif')) return false;
      if (activeTab === 'draft' && g.status !== 'Draft') return false;
      if (activeTab === 'archived' && !(g.status === 'Archived' || g.status === 'Diarsipkan')) return false;

      // Search
      const matchesSearch = 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.formId && g.formId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.kloter && g.kloter.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.tourLeader && g.tourLeader.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.mutawif && g.mutawif.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [groups, activeTab, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredGroups.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGroups.map(g => g.id)));
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
    deleteGroups(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast("Data kloter berhasil dihapus.", "success");
  };

  const openAddModal = () => {
    setEditingGroup(null);
    setModalMode('edit');
    setFormData({
      id: `G-${Math.floor(100 + Math.random() * 900)}`,
      formId: `KLT-0${groups.length + 1}`,
      name: `Kloter ${groups.length + 1} Al-`,
      kloter: `KNO-0${groups.length + 1}`,
      status: 'Active',
      tourLeader: tourLeaders[0]?.name || 'Ust. H. Muhammad Ridwan',
      mutawif: mutawifs[0]?.name || 'Ust. Ibrahim Al-Madani',
      pilgrims: 0
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (g: Group) => {
    setEditingGroup(g);
    setModalMode('edit');
    setFormData({ ...g });
    setIsFormModalOpen(true);
  };

  const saveGroup = () => {
    if (!formData.name) {
      toast("Nama kloter wajib diisi.", "error");
      return;
    }

    if (editingGroup) {
      updateGroup(editingGroup.id, formData);
      toast("Data kloter berhasil diperbarui.", "success");
    } else {
      addGroup({
        id: formData.id || `G-${Math.floor(100 + Math.random() * 900)}`,
        formId: formData.formId,
        name: formData.name,
        kloter: formData.kloter || 'KNO-01',
        pilgrims: Number(formData.pilgrims) || 0,
        tourLeader: formData.tourLeader || 'Unassigned',
        mutawif: formData.mutawif || 'Unassigned',
        status: formData.status || 'Active',
      });
      toast("Kloter baru berhasil dibuat.", "success");
    }
    setIsFormModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredGroups.map(g => ({
      'ID Kloter': g.id,
      'Form ID': g.formId || '-',
      'Nama Kloter': g.name,
      'Kode Kloter': g.kloter,
      'Jumlah Jamaah': pilgrims.filter(p => p.group === g.name).length,
      'Tour Leader': g.tourLeader,
      'Mutawwif': g.mutawif,
      'Status': g.status,
    }));
    exportToExcel(exportData, 'Data_Kloter_DNA_Tour', 'Laporan Data Kloter & Rombongan - DNA Tour');
    toast("Data kloter berhasil diexport ke Excel.", "success");
  };

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / itemsPerPage));
  const paginatedData = filteredGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner - Exact match with provided design */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Kloter & Rombongan
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Kelola data kloter rombongan, penugasan petugas, dan pembagian jamaah
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
              <Plus className="w-4 h-4 mr-1.5" /> 
              Buat Kloter
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid - Interactive & Tactile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kloter */}
        <Card 
          onClick={() => setActiveTab('all')}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL KLOTER</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalGroups} Rombongan
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Grup Keberangkatan Siap</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Jamaah Terbagi */}
        <Card 
          onClick={() => setActiveTab('all')}
          className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">JAMAAH TERBAGI</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1d4ed8]">
                  {totalPilgrimsInGroups} Jamaah
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Teralokasi dalam Kloter</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Kloter Aktif */}
        <Card 
          onClick={() => setActiveTab('active')}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'active' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">KLOTER AKTIF</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {activeGroups} Kloter
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Jadwal Operasional Berjalan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Petugas SDM */}
        <Card 
          onClick={() => setActiveTab('all')}
          className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL PETUGAS SDM</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#6b21a8]">
                  {tourLeaders.length + mutawifs.length} Petugas
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#faf5ff] text-[#7e22ce] flex items-center justify-center shrink-0 shadow-2xs">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#7e22ce]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>TL & Mutawif Bertugas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card with Navigation Tabs */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-2xs">
        {/* Tabs Header */}
        <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-2.5 pb-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-0">
            <button 
              onClick={() => setActiveTab('all')}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'all' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Semua Kloter</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {groups.length}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('active')}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'active' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Kloter Aktif</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'active' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {activeGroups}
              </span>
              {activeTab === 'active' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('draft')}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'draft' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Draft</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'draft' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {draftGroups}
              </span>
              {activeTab === 'draft' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('archived')}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'archived' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Diarsipkan</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'archived' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {archivedGroups}
              </span>
              {activeTab === 'archived' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Cari nama kloter, kode, petugas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9.5 pr-8 h-9.5 rounded-xl border-gray-200 bg-white text-xs sm:text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-normal"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
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
              variant={showFilters ? "secondary" : "outline"} 
              className={`text-xs h-9 font-semibold px-3.5 rounded-xl cursor-pointer ${showFilters ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filter
            </Button>
          </div>
        </div>

        {/* Extended Filter Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
            <div className="space-y-1.5 w-full sm:w-auto">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status Kloter</label>
              <select 
                className="flex h-9 w-full sm:w-48 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-semibold"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="draft">Draft</option>
                <option value="archived">Diarsipkan</option>
              </select>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-[950px]">
            <TableHeader className="bg-gray-50/80 border-b border-gray-100">
              <TableRow className="border-b-gray-200 hover:bg-transparent">
                <TableHead className="w-12 text-center pl-4 py-3.5 whitespace-nowrap">
                  <Checkbox 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredGroups.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[100px]">ID</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[240px]">NAMA KLOTER ROMBONGAN</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[140px]">JUMLAH JAMAAH</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[180px]">TOUR LEADER (TL)</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[180px]">MUTHAWWIF LOKAL</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[110px]">STATUS</TableHead>
                <TableHead className="text-right pr-6 text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[130px]">AKSI</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody key={activeTab} className="divide-y divide-gray-100 animate-fade-in">
              {paginatedData.map((group) => {
                const groupPilgrimCount = pilgrims.filter(p => p.group === group.name || p.group === group.kloter).length;
                
                return (
                  <TableRow 
                    key={group.id} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50/70 ${selectedIds.has(group.id) ? "bg-[#fcedea]/30" : ""}`}
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <TableCell className="pl-4 py-4 whitespace-nowrap">
                      <Checkbox 
                        checked={selectedIds.has(group.id)}
                        onClick={(e) => e.stopPropagation()} 
                        onCheckedChange={() => toggleSelect(group.id)}
                        aria-label={`Pilih ${group.name}`}
                      />
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="font-bold text-sm tracking-tight text-[#480c0c] whitespace-nowrap">
                        {group.formId || group.id}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#fcedea] border border-[#f5d0cb] flex items-center justify-center text-[#782820] shrink-0 font-bold">
                          <Users2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors whitespace-nowrap">
                          {group.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 tracking-wide uppercase shadow-2xs">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {groupPilgrimCount} Orang
                      </span>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-bold whitespace-nowrap">{group.tourLeader || '-'}</span>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-bold whitespace-nowrap">{group.mutawif || '-'}</span>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border shadow-2xs ${
                        group.status === 'Active' || group.status === 'Aktif'
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                          : group.status === 'Draft'
                          ? 'text-gray-700 bg-gray-100 border-gray-300'
                          : 'text-amber-800 bg-amber-50 border-amber-300'
                      }`}>
                        {group.status === 'Active' || group.status === 'Aktif' ? 'Aktif' : group.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors" 
                          onClick={() => navigate(`/room-allocation?kloter=${encodeURIComponent(group.name)}`)}
                          title="Alokasi Kamar"
                        >
                          <BedDouble className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors" 
                          onClick={() => navigate(`/groups/${group.id}`)}
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors" 
                          onClick={() => openEditModal(group)}
                          title="Edit Kloter"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors" 
                          title="Hapus Kloter"
                          onClick={() => {
                            setSelectedIds(new Set([group.id]));
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

              {filteredGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-200">
                        <Users2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="font-bold text-gray-900 text-sm">Tidak ada kloter ditemukan</p>
                      <p className="text-xs text-gray-500 mt-1">Ubah kata kunci pencarian atau buat kloter baru.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            Menampilkan <span className="font-bold text-gray-900">{filteredGroups.length}</span> data kloter
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-9 px-4 rounded-xl border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs flex-1 sm:flex-none cursor-pointer" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-9 px-4 rounded-xl border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs flex-1 sm:flex-none cursor-pointer" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal: Buat / Edit Kloter Baru (Matching Registration & Pilgrims Design) */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Tabs */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {editingGroup ? (
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
                    Data Kloter
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
                  Tambah Kloter
                </button>
              )}
            </div>

            <button
              onClick={() => setIsFormModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TAB 1: DATA KLOTER (DETAIL) */}
          {modalMode === 'detail' && editingGroup && (
            <div className="space-y-7 animate-fade-in text-left">
              {/* Card 1: Informasi Utama Kloter */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                  Informasi Utama Kloter
                </h2>

                <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <Layers className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Form ID</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm text-right font-mono">
                      {editingGroup.formId || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <Users2 className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Nama Kloter</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm text-right">
                      {editingGroup.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Kode Kloter</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm text-right">
                      {editingGroup.kloter || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Status Kloter</span>
                    </div>
                    <span className="font-bold text-sm text-right">
                      {(editingGroup.status === 'Active' || editingGroup.status === 'Aktif') ? (
                        <span className="text-[#00a859] font-bold">Aktif (Berjalan)</span>
                      ) : editingGroup.status === 'Draft' ? (
                        <span className="text-gray-500 font-bold">Draft (Perencanaan)</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Diarsipkan (Selesai)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Penugasan Petugas */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                  Penugasan Petugas
                </h2>

                <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <Briefcase className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Tour Leader (TL)</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm text-right">
                      {editingGroup.tourLeader || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                    <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                      <UserCheck className="w-4 h-4 text-[#782820] shrink-0" />
                      <span>Muthawwif Lokal</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm text-right">
                      {editingGroup.mutawif || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Tutup Button */}
              <div className="flex justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsFormModalOpen(false)} 
                  className="rounded-xl h-10 px-6 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer shadow-2xs"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: FORM EDIT / TAMBAH */}
          {(modalMode === 'edit' || !editingGroup) && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Section 1: INFORMASI UTAMA KLOTER */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    1
                  </div>
                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    INFORMASI UTAMA KLOTER
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      FORM ID *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.formId || ''} 
                        onChange={(e) => setFormData({...formData, formId: e.target.value})} 
                        placeholder="Cth. KLT-01" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NAMA KLOTER *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="Cth. Kloter 1 Al-Madinah" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KODE KLOTER
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.kloter || ''} 
                        onChange={(e) => setFormData({...formData, kloter: e.target.value})} 
                        placeholder="Cth. KNO-01 atau CGK-02" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      STATUS KLOTER
                    </label>
                    <div className="sm:col-span-8">
                      <select 
                        value={formData.status || 'Active'}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                      >
                        <option value="Active">Aktif (Berjalan)</option>
                        <option value="Draft">Draft (Perencanaan)</option>
                        <option value="Archived">Diarsipkan (Selesai)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: PENUGASAN PETUGAS */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    2
                  </div>
                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    PENUGASAN PETUGAS
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      TOUR LEADER (TL)
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.tourLeader || ''} 
                        onChange={(e) => setFormData({...formData, tourLeader: e.target.value})} 
                        placeholder="Cth. Ust. H. Muhammad Ridwan" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      MUTHAWWIF LOKAL
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.mutawif || ''} 
                        onChange={(e) => setFormData({...formData, mutawif: e.target.value})} 
                        placeholder="Cth. Ust. Ibrahim Al-Madani" 
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
                  onClick={() => setIsFormModalOpen(false)} 
                  className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
                >
                  Batal
                </Button>
                <Button 
                  onClick={saveGroup} 
                  className="h-12 rounded-2xl px-8 font-bold text-white bg-[#00a859] hover:bg-[#008f4c] text-base cursor-pointer shadow-2xs"
                >
                  {editingGroup ? 'Simpan Perubahan' : 'Simpan Kloter'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        itemCount={selectedIds.size}
      />
    </div>
  );
}
