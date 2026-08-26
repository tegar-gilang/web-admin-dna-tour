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
  Search, Filter, Plus, Trash2, Edit2, Eye,
  ShieldAlert, AlertCircle, CheckCircle2, Clock, MapPin, Navigation, 
  Phone, PhoneCall, FileSpreadsheet, X, Check, HeartPulse, Activity,
  UserX, AlertTriangle, MessageSquare, ExternalLink, Calendar,
  User, CheckCheck, RotateCcw, Building2, Users, CreditCard, BookOpen
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { useStore, Emergency as EmergencyType } from '@/core/store';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { exportToExcel } from '@/lib/export';

export default function Emergency() {
  const navigate = useNavigate();
  const { 
    emergencies, 
    resolveEmergency, 
    addEmergency, 
    updateEmergency, 
    deleteEmergency, 
    deleteEmergencies,
    pilgrims,
    groups 
  } = useStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved' | 'medical' | 'lost'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'detail' | 'edit'>('detail');
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyType | null>(null);
  const [formData, setFormData] = useState<Partial<EmergencyType & { notes?: string; contactPhone?: string }>>({});

  const todayStr = new Date().toISOString().split('T')[0];
  const currentTimeStr = new Date().toTimeString().substring(0, 5);

  // Statistics calculation
  const totalEmergencies = emergencies.length;
  const activeEmergencies = emergencies.filter(e => e.status === 'Active');
  const resolvedEmergencies = emergencies.filter(e => e.status === 'Resolved');
  const medicalEmergencies = emergencies.filter(e => e.type.toLowerCase().includes('medic') || e.type.toLowerCase().includes('sehat') || e.type.toLowerCase().includes('sakit'));
  const lostEmergencies = emergencies.filter(e => e.type.toLowerCase().includes('lost') || e.type.toLowerCase().includes('pisah') || e.type.toLowerCase().includes('sesat'));

  const hasActiveFilters = Boolean(filterType || filterGroup || filterStatus);

  const resetFilters = () => {
    setFilterType("");
    setFilterGroup("");
    setFilterStatus("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const filteredEmergencies = useMemo(() => {
    return emergencies.filter(e => {
      // Tab filter
      if (activeTab === 'active' && e.status !== 'Active') return false;
      if (activeTab === 'resolved' && e.status !== 'Resolved') return false;
      if (activeTab === 'medical' && !e.type.toLowerCase().includes('medic') && !e.type.toLowerCase().includes('sehat') && !e.type.toLowerCase().includes('sakit')) return false;
      if (activeTab === 'lost' && !e.type.toLowerCase().includes('lost') && !e.type.toLowerCase().includes('pisah') && !e.type.toLowerCase().includes('sesat')) return false;

      // Search matching
      const matchesSearch = 
        e.pilgrim.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType ? e.type === filterType : true;
      const matchesGroup = filterGroup ? e.group === filterGroup : true;
      const matchesStatus = filterStatus ? e.status === filterStatus : true;

      return matchesSearch && matchesType && matchesGroup && matchesStatus;
    });
  }, [emergencies, activeTab, searchTerm, filterType, filterGroup, filterStatus]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmergencies.length && filteredEmergencies.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmergencies.map(e => e.id)));
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
    deleteEmergencies(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast("Laporan darurat terpilih berhasil dihapus.", "success");
  };

  const handleBatchResolve = () => {
    const ids = Array.from(selectedIds);
    ids.forEach(id => resolveEmergency(id));
    setSelectedIds(new Set());
    toast(`${ids.length} laporan darurat berhasil ditandai selesai.`, "success");
  };

  const openAddModal = () => {
    const newId = `SOS-${Math.floor(2000 + Math.random() * 8000)}`;
    setSelectedEmergency(null);
    setModalMode('edit');
    setFormData({
      id: newId,
      pilgrim: "",
      group: groups[0]?.name || "Group A-1",
      location: "Masjidil Haram - Bab Malik Abdulaziz",
      date: todayStr,
      time: currentTimeStr,
      type: "Medical Emergency",
      status: "Active"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emergency: EmergencyType) => {
    setSelectedEmergency(emergency);
    setModalMode('edit');
    setFormData({
      ...emergency
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (emergency: EmergencyType) => {
    setSelectedEmergency(emergency);
    setModalMode('detail');
    setFormData({ ...emergency });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pilgrim || !formData.pilgrim.trim()) {
      toast("Nama jamaah wajib diisi.", "error");
      return;
    }

    if (selectedEmergency) {
      updateEmergency(selectedEmergency.id, {
        pilgrim: formData.pilgrim,
        group: formData.group || selectedEmergency.group,
        location: formData.location || selectedEmergency.location,
        date: formData.date || selectedEmergency.date,
        time: formData.time || selectedEmergency.time,
        type: formData.type || selectedEmergency.type,
        status: formData.status as ('Active' | 'Resolved') || selectedEmergency.status
      });
      toast("Laporan darurat berhasil diperbarui.", "success");
    } else {
      const newEmergency: EmergencyType = {
        id: formData.id || `SOS-${Math.floor(2000 + Math.random() * 8000)}`,
        pilgrim: formData.pilgrim,
        group: formData.group || "Kloter Umum",
        location: formData.location || "Masjidil Haram Makkah",
        date: formData.date || todayStr,
        time: formData.time || currentTimeStr,
        type: formData.type || "Medical Emergency",
        status: (formData.status as ('Active' | 'Resolved')) || "Active"
      };
      addEmergency(newEmergency);
      toast("Laporan darurat baru berhasil ditambahkan.", "success");
    }
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredEmergencies.map(e => ({
      'ID Laporan': e.id,
      'Nama Jamaah': e.pilgrim,
      'Kloter / Rombongan': e.group,
      'Tipe Darurat': e.type,
      'Lokasi Terakhir': e.location,
      'Tanggal': e.date,
      'Waktu': e.time,
      'Status': e.status === 'Active' ? 'Aktif (Perlu Penanganan)' : 'Selesai Ditangani'
    }));
    exportToExcel(exportData, 'Laporan_Darurat_SOS', 'Laporan Peringatan Darurat & Medis Jamaah - DNA Tour');
  };

  const sortedEmergencies = useMemo(() => {
    return [...filteredEmergencies].sort((a, b) => {
      const dateA = new Date(`${a.date || todayStr}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date || todayStr}T${b.time || '00:00'}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredEmergencies, todayStr]);

  const totalPages = Math.max(1, Math.ceil(sortedEmergencies.length / itemsPerPage));
  const paginatedData = sortedEmergencies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Helper to find matched pilgrim info
  const getPilgrimInfo = (name: string) => {
    return pilgrims.find(p => p.name.toLowerCase() === name.toLowerCase());
  };

  // Helper badge for Emergency Type
  const getTypeBadge = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('medic') || lower.includes('sehat') || lower.includes('sakit')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-300 shadow-2xs whitespace-nowrap shrink-0">
          <HeartPulse className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          {type}
        </span>
      );
    }
    if (lower.includes('lost') || lower.includes('pisah') || lower.includes('sesat')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 shadow-2xs whitespace-nowrap shrink-0">
          <UserX className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          {type}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-300 shadow-2xs whitespace-nowrap shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        {type}
      </span>
    );
  };

  // Date format helper with day name
  const formatIndoDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner Container - Clean & Consistent with Registration */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#740A03] flex items-center justify-center shrink-0 border border-red-100 shadow-2xs">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              Darurat & SOS
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Pusat penanganan darurat jamaah, koordinasi medis, evakuasi, dan pelacakan lokasi real-time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              onClick={openAddModal}
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-2xs flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" /> 
              Lapor Darurat Baru
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Laporan */}
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
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL LAPORAN</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalEmergencies} Kejadian
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Semua Insiden & Log SOS</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Darurat Aktif */}
        <Card 
          onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'active' 
              ? 'border-rose-600 ring-2 ring-rose-600/20 bg-rose-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">DARURAT AKTIF</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-rose-700">
                  {activeEmergencies.length} Kasus
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs relative">
                {activeEmergencies.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white shadow-xs" />
                )}
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{activeEmergencies.length > 0 ? "Memerlukan Penanganan Cepat" : "Tidak Ada Peringatan Aktif"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Selesai Ditangani */}
        <Card 
          onClick={() => { setActiveTab('resolved'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'resolved' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TERTANGANI / SELESAI</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-emerald-800">
                  {resolvedEmergencies.length} Selesai
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Insiden Berhasil Diselesaikan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Kasus Medis */}
        <Card 
          onClick={() => { setActiveTab('medical'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'medical' 
              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">MEDIS & KESEHATAN</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-blue-900">
                  {medicalEmergencies.length} Kasus
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <HeartPulse className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>Tim Medis & Dokter Siaga</span>
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
                  ? 'font-bold text-[#740A03]' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Semua Darurat</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-red-100 text-[#740A03] scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {emergencies.length}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#740A03] rounded-full animate-tab-indicator" />
              )}
            </button>
            
            <button 
              onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'active' 
                  ? 'font-bold text-rose-700' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {activeEmergencies.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />}
                Darurat Aktif
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'active' 
                  ? 'bg-rose-100 text-rose-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {activeEmergencies.length}
              </span>
              {activeTab === 'active' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-rose-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('resolved'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'resolved' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Selesai Ditangani</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'resolved' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {resolvedEmergencies.length}
              </span>
              {activeTab === 'resolved' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('medical'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'medical' 
                  ? 'font-bold text-blue-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Medis & Sakit</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'medical' 
                  ? 'bg-blue-100 text-blue-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {medicalEmergencies.length}
              </span>
              {activeTab === 'medical' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('lost'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'lost' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Terpisah</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'lost' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {lostEmergencies.length}
              </span>
              {activeTab === 'lost' && (
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
              placeholder="Cari jamaah, kloter, lokasi, jenis darurat..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9.5 pr-8 h-9.5 rounded-xl border-gray-200 bg-white text-xs sm:text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
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
              <>
                <Button 
                  onClick={handleBatchResolve} 
                  variant="outline" 
                  className="text-xs h-9 font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 px-3.5 rounded-xl cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                  Selesaikan Terpilih ({selectedIds.size})
                </Button>
                <Button 
                  onClick={handleDeleteSelected} 
                  variant="outline" 
                  className="text-xs h-9 font-semibold text-red-600 border-red-200 hover:bg-red-50 px-3.5 rounded-xl cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Hapus Terpilih ({selectedIds.size})
                </Button>
              </>
            )}

            <Button 
              variant={showFilters || hasActiveFilters ? "secondary" : "outline"} 
              className={`text-xs h-9 font-semibold px-3.5 rounded-xl cursor-pointer ${
                showFilters || hasActiveFilters 
                  ? 'bg-red-50 text-[#740A03] border-red-200' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filter Lanjutan
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#740A03] ml-1.5"></span>
              )}
            </Button>
          </div>
        </div>

        {/* Extended Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-end animate-fade-in">
            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tipe Kejadian</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Tipe</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Lost Person">Lost Person (Terpisah)</option>
                <option value="Kehilangan Paspor">Kehilangan Paspor/Dokumen</option>
                <option value="Kelelahan & Dehidrasi">Kelelahan & Dehidrasi</option>
                <option value="Bantuan Kursi Roda">Bantuan Kursi Roda</option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status Kejadian</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Status</option>
                <option value="Active">Aktif (Butuh Bantuan)</option>
                <option value="Resolved">Selesai Ditangani</option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-52">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kloter Rombongan</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                value={filterGroup}
                onChange={(e) => { setFilterGroup(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Kloter</option>
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
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
                    checked={selectedIds.size > 0 && selectedIds.size === filteredEmergencies.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[170px] w-[180px]">HARI & WAKTU</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[220px]">Jamaah & Kloter</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[180px]">Jenis Darurat</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[220px]">Lokasi Terakhir</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[150px]">Status</TableHead>
                <TableHead className="text-right pr-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[130px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody key={activeTab} className="animate-fade-in">
              {paginatedData.map((alert) => {
                const pilgrimInfo = getPilgrimInfo(alert.pilgrim);
                const isActive = alert.status === 'Active';

                return (
                  <TableRow 
                    key={alert.id}
                    className={`${selectedIds.has(alert.id) ? "bg-rose-50/40" : ""} hover:bg-gray-50/80 transition-colors group cursor-pointer border-b border-gray-100/80`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"], button')) return;
                      openDetailModal(alert);
                    }}
                  >
                    <TableCell className="pl-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.has(alert.id)}
                        onCheckedChange={() => toggleSelect(alert.id)}
                        aria-label={`Pilih ${alert.id}`}
                      />
                    </TableCell>

                    {/* Hari & Waktu */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                          <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="font-mono">{alert.time ? `${alert.time} WIB` : '--:--'}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                          {formatIndoDate(alert.date)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Jamaah & Kloter */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                          isActive 
                            ? 'bg-rose-100 text-rose-800 border-rose-200' 
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {alert.pilgrim.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm whitespace-nowrap flex items-center gap-1.5">
                            {alert.pilgrim}
                            {pilgrimInfo && (
                              <span className="text-[11px] font-medium text-gray-500">
                                ({pilgrimInfo.gender === 'Laki-laki' ? 'L' : 'P'}, {pilgrimInfo.age} thn)
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5 font-medium whitespace-nowrap">
                            {alert.group} • {pilgrimInfo?.phone || '+62 812-3456-7890'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Tipe Kejadian */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {getTypeBadge(alert.type)}
                    </TableCell>

                    {/* Lokasi Terakhir */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{alert.location}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            21.4225, 39.8262
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/live-monitoring');
                            }}
                            className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Navigation className="w-3 h-3" /> Peta
                          </button>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                          AKTIF
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          SELESAI
                        </span>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                        {isActive ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors shrink-0" 
                            title="Tandai Selesai"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveEmergency(alert.id);
                              toast(`Peringatan ${alert.id} berhasil ditandai selesai.`, "success");
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                            title="Buka Kembali"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateEmergency(alert.id, { status: 'Active' });
                              toast(`Peringatan ${alert.id} dibuka kembali sebagai aktif.`, "info");
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Lihat Detail"
                          onClick={() => openDetailModal(alert)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Edit Laporan"
                          onClick={() => openEditModal(alert)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Hapus Laporan"
                          onClick={() => {
                            setSelectedIds(new Set([alert.id]));
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

              {filteredEmergencies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-56 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-200">
                        <ShieldAlert className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {searchTerm || hasActiveFilters ? "Tidak ada darurat yang cocok dengan pencarian" : "Tidak ada data darurat"}
                      </p>
                      <p className="text-xs text-gray-400 max-w-sm mb-4">
                        {searchTerm || hasActiveFilters 
                          ? "Coba ubah kata kunci atau reset filter lanjutan untuk melihat data lainnya." 
                          : "Seluruh jamaah dan kloter dalam keadaan aman dan terkendali."}
                      </p>
                      {searchTerm || hasActiveFilters ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={resetFilters}
                          className="rounded-xl text-xs cursor-pointer border-gray-200 text-gray-700"
                        >
                          Reset Filter
                        </Button>
                      ) : (
                        <Button 
                          onClick={openAddModal}
                          className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Buat Laporan Baru
                        </Button>
                      )}
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
            Menampilkan <span className="font-semibold text-gray-900">{filteredEmergencies.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredEmergencies.length)}</span> dari <span className="font-semibold text-gray-900">{filteredEmergencies.length}</span> laporan
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

      {/* Modal Dialog for Data Diri & Form Edit - Matches Registration Reference Design Exactly */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Tabs */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {selectedEmergency ? (
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
                    Data Detail Darurat
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
                  Lapor Darurat Baru
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

          {/* TAB 1: DETAIL DARURAT */}
          {modalMode === 'detail' && selectedEmergency && (() => {
            const activeEmergency = selectedEmergency;
            const pilgrimInfo = getPilgrimInfo(activeEmergency.pilgrim);
            const isActive = activeEmergency.status === 'Active';

            return (
              <div className="space-y-7 animate-fade-in">
                {/* Status Indicator Card */}
                <div className={`p-4.5 rounded-2xl border flex items-center justify-between gap-4 ${
                  isActive 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      isActive ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {isActive ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider">
                        {isActive ? 'Peringatan Darurat Aktif' : 'Peringatan Selesai Ditangani'}
                      </p>
                      <p className="text-xs font-medium opacity-90 mt-0.5">
                        {isActive ? 'Memerlukan koordinasi & tindakan lapangan segera' : 'Kasus telah berhasil dievakuasi & diselesaikan'}
                      </p>
                    </div>
                  </div>

                  {isActive ? (
                    <Button
                      onClick={() => {
                        resolveEmergency(activeEmergency.id);
                        setIsModalOpen(false);
                        toast(`Peringatan ${activeEmergency.id} berhasil ditandai selesai.`, "success");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 h-9 rounded-xl shadow-2xs shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Tandai Selesai
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        updateEmergency(activeEmergency.id, { status: 'Active' });
                        setIsModalOpen(false);
                        toast(`Peringatan ${activeEmergency.id} dibuka kembali.`, "info");
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 h-9 rounded-xl shadow-2xs shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Buka Kembali
                    </Button>
                  )}
                </div>

                {/* Section 1: Informasi Kejadian */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    Informasi Kejadian
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <ShieldAlert className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>ID Laporan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right font-mono">
                        {activeEmergency.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Activity className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Jenis Kejadian</span>
                      </div>
                      <div className="text-right">
                        {getTypeBadge(activeEmergency.type)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Clock className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Waktu & Tanggal</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeEmergency.time} WIB • {formatIndoDate(activeEmergency.date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <MapPin className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Lokasi Terakhir</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right max-w-xs sm:max-w-md">
                        {activeEmergency.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Data Jamaah Terkait */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    Data Jamaah Terkait
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nama Jamaah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeEmergency.pilgrim}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Users className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Kloter / Rombongan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activeEmergency.group}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Phone className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Kontak Jamaah</span>
                      </div>
                      <span className="font-bold text-blue-700 text-sm text-right font-mono">
                        {pilgrimInfo?.phone || '+62 812-3456-7890'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Building2 className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Hotel Menginap</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {pilgrimInfo?.hotelMakkah || pilgrimInfo?.hotel || 'Swissôtel Al Maqam Makkah'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Contact Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <a 
                    href={`tel:${pilgrimInfo?.phone || '+6281234567890'}`} 
                    className="flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>Telepon Jamaah</span>
                  </a>

                  <a 
                    href={`https://wa.me/${(pilgrimInfo?.phone || '6281234567890').replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat WhatsApp</span>
                  </a>

                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      navigate('/live-monitoring');
                    }}
                    className="flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Pantau di Peta</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: FORM EDIT / ADD */}
          {modalMode === 'edit' && (
            <form onSubmit={handleSaveForm} className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1">
                  {selectedEmergency ? "Edit Laporan Darurat" : "Form Laporan Darurat Baru"}
                </h2>
                <p className="text-xs text-gray-500">
                  Lengkapi data kejadian, data jamaah terkait, serta status penanganan di lapangan.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">ID Laporan</label>
                    <Input 
                      value={formData.id || ""} 
                      disabled 
                      className="h-10 rounded-xl text-xs bg-gray-50 text-gray-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Status Penanganan</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                      value={formData.status || "Active"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="Active">Aktif (Memerlukan Tindakan)</option>
                      <option value="Resolved">Selesai Ditangani</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Jamaah *</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      className="flex h-10 w-full sm:w-1/2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                      onChange={(e) => {
                        const sel = pilgrims.find(p => p.id === e.target.value);
                        if (sel) {
                          setFormData({ 
                            ...formData, 
                            pilgrim: sel.name,
                            group: sel.group || formData.group
                          });
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">-- Pilih dari Daftar Jamaah --</option>
                      {pilgrims.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.group || 'Kloter'})</option>
                      ))}
                    </select>

                    <Input 
                      placeholder="Atau ketik nama jamaah..."
                      value={formData.pilgrim || ""}
                      onChange={(e) => setFormData({ ...formData, pilgrim: e.target.value })}
                      required
                      className="h-10 rounded-xl text-xs font-semibold flex-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Kloter / Rombongan</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                      value={formData.group || ""}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    >
                      <option value="">-- Pilih Kloter --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                      <option value="Group A-1">Group A-1</option>
                      <option value="Group B-2">Group B-2</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Jenis Darurat *</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                      value={formData.type || "Medical Emergency"}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="Medical Emergency">Medical Emergency (Medis / Sakit)</option>
                      <option value="Lost Person">Lost Person (Terpisah dari Rombongan)</option>
                      <option value="Kehilangan Paspor">Kehilangan Dokumen / Paspor</option>
                      <option value="Kelelahan & Dehidrasi">Kelelahan & Dehidrasi</option>
                      <option value="Bantuan Khusus">Bantuan Kursi Roda / Lansia</option>
                      <option value="Kecelakaan Ringan">Kecelakaan Ringan</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Lokasi Terakhir *</label>
                  <Input 
                    placeholder="Contoh: Gate 1 Masjidil Haram, Jabal Rahmah, Hotel Madinah"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="h-10 rounded-xl text-xs font-medium"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Gate 1 Masjidil Haram", "Jabal Rahmah", "Pelataran Tawaf", "Hotel Makkah", "Hotel Madinah"].map(preset => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setFormData({ ...formData, location: preset })}
                        className="text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tanggal Kejadian</label>
                    <Input 
                      type="date"
                      value={formData.date || todayStr}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-10 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Jam Kejadian</label>
                    <Input 
                      type="time"
                      value={formData.time || currentTimeStr}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="h-10 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Form Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs rounded-xl h-10 px-5 font-semibold cursor-pointer"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#740A03] hover:bg-[#580802] text-white text-xs font-bold rounded-xl h-10 px-6 cursor-pointer shadow-2xs"
                >
                  {selectedEmergency ? "Simpan Perubahan" : "Tambah Laporan"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Delete Dialog */}
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemCount={selectedIds.size}
      />
    </div>
  );
}
