import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, Filter, Plus, Trash2, Edit2, Eye,
  ShieldAlert, AlertCircle, CheckCircle2, Clock, MapPin, Navigation, 
  Phone, PhoneCall, FileSpreadsheet, X, Check, HeartPulse, Activity,
  UserX, AlertTriangle, MessageSquare, Calendar,
  User, CheckCheck, Building2, Users, RefreshCw, Info, History
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { exportToExcel } from '@/lib/export';
import {
  getSosIncidents,
  getSosIncident,
  updateSosStatus,
  createSosIncident,
  SosIncident,
  SosStatus,
  CreateSosIncidentPayload,
} from '@/core/services/sosService';
import { jamaahService } from '@/core/services/jamaahService';
import { Pilgrim } from '@/core/store';

// ==========================================
// STATUS & TYPE HELPERS
// ==========================================

export const isValidCoordinate = (val: string | number | null | undefined): boolean => {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && isFinite(num);
};

export const getStatusLabel = (status: SosStatus): string => {
  switch (status) {
    case 'triggered':
      return 'Terpicu (Baru)';
    case 'acknowledged':
      return 'Dikonfirmasi';
    case 'in_action':
      return 'Sedang Ditangani';
    case 'resolved':
      return 'Selesai';
    case 'false_alarm':
      return 'False Alarm';
    default:
      return status;
  }
};

export const getStatusBadge = (status: SosStatus) => {
  switch (status) {
    case 'triggered':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          TERPICU
        </span>
      );
    case 'acknowledged':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          DIKONFIRMASI
        </span>
      );
    case 'in_action':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-300 shadow-2xs">
          <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          PENANGANAN
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          SELESAI
        </span>
      );
    case 'false_alarm':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-300 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          FALSE ALARM
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-300 shadow-2xs">
          {status}
        </span>
      );
  }
};

export const getTypeLabel = (type: string): string => {
  const t = (type || '').toLowerCase();
  if (t === 'health' || t.includes('medic') || t.includes('sehat') || t.includes('sakit')) {
    return 'Darurat Medis';
  }
  if (t === 'lost' || t.includes('pisah') || t.includes('sesat')) {
    return 'Jamaah Terpisah';
  }
  if (t === 'accident' || t.includes('celaka')) {
    return 'Kecelakaan';
  }
  if (t === 'critical' || t.includes('kritis')) {
    return 'Darurat Kritis';
  }
  return type || 'Darurat Umum';
};

export const getTypeBadge = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'health' || t.includes('medic') || t.includes('sehat') || t.includes('sakit')) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-300 shadow-2xs whitespace-nowrap shrink-0">
        <HeartPulse className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        {getTypeLabel(type)}
      </span>
    );
  }
  if (t === 'lost' || t.includes('pisah') || t.includes('sesat')) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 shadow-2xs whitespace-nowrap shrink-0">
        <UserX className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        {getTypeLabel(type)}
      </span>
    );
  }
  if (t === 'accident' || t.includes('celaka')) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-800 bg-orange-50 px-3 py-1 rounded-full border border-orange-300 shadow-2xs whitespace-nowrap shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
        {getTypeLabel(type)}
      </span>
    );
  }
  if (t === 'critical' || t.includes('kritis')) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-300 shadow-2xs whitespace-nowrap shrink-0">
        <ShieldAlert className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        {getTypeLabel(type)}
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

export const formatIndoDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export const formatIndoTime = (dateStr?: string | null) => {
  if (!dateStr) return '--:--';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--:--';
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins} WIB`;
  } catch {
    return '--:--';
  }
};

export default function Emergency() {
  const navigate = useNavigate();

  // Data states from backend
  const [incidents, setIncidents] = useState<SosIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 50,
    total: 0,
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved' | 'medical' | 'lost'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<SosIncident | null>(null);
  const [detailedIncident, setDetailedIncident] = useState<SosIncident | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Create Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availablePilgrims, setAvailablePilgrims] = useState<Pilgrim[]>([]);
  const [isLoadingPilgrims, setIsLoadingPilgrims] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createFormData, setCreateFormData] = useState<{
    jamaah_id: string;
    type: 'health' | 'lost' | 'accident' | 'critical';
    location_name: string;
    latitude: string;
    longitude: string;
    description: string;
  }>({
    jamaah_id: '',
    type: 'health',
    location_name: 'Masjidil Haram - Bab Malik Abdulaziz',
    latitude: '21.4225',
    longitude: '39.8262',
    description: '',
  });

  // False Alarm Confirmation Modal states
  const [isFalseAlarmModalOpen, setIsFalseAlarmModalOpen] = useState(false);
  const [falseAlarmIncidentId, setFalseAlarmIncidentId] = useState<string | null>(null);
  const [falseAlarmReason, setFalseAlarmReason] = useState("");
  const [falseAlarmError, setFalseAlarmError] = useState<string | null>(null);

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchIncidentsData = useCallback(async (page = 1) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await getSosIncidents(page);
      setIncidents(res.data || []);
      setPagination({
        currentPage: res.current_page || 1,
        lastPage: res.last_page || 1,
        perPage: res.per_page || 50,
        total: res.total || 0,
      });
    } catch (err: any) {
      console.error("Gagal mengambil data SOS:", err);
      setFetchError(err.message || "Gagal menghubungi server untuk memuat laporan SOS.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidentsData(currentPage);
  }, [fetchIncidentsData, currentPage]);

  // Load pilgrims for Create Form
  const loadPilgrims = async () => {
    if (availablePilgrims.length > 0) return;
    setIsLoadingPilgrims(true);
    try {
      const data = await jamaahService.getJamaahs();
      setAvailablePilgrims(data);
    } catch (err: any) {
      console.warn("Gagal mengambil daftar jamaah untuk form SOS:", err);
    } finally {
      setIsLoadingPilgrims(false);
    }
  };

  // ==========================================
  // STATUS TRANSITION HANDLER
  // ==========================================

  const handleUpdateStatus = async (id: string, newStatus: SosStatus, reason?: string) => {
    if (updatingId) return;

    if (newStatus === 'false_alarm') {
      const trimmedReason = (reason || '').trim();
      if (!trimmedReason) {
        toast("Alasan wajib diisi untuk laporan false alarm.", "error");
        return;
      }
      if (trimmedReason.length > 500) {
        toast("Alasan maksimal 500 karakter.", "error");
        return;
      }
    }

    setUpdatingId(id);
    try {
      const updated = await updateSosStatus(id, newStatus, reason?.trim());
      toast(`Status SOS berhasil diperbarui menjadi ${getStatusLabel(newStatus)}.`, "success");

      // Update in local list
      setIncidents(prev => prev.map(item => (item.id === id ? { ...item, ...updated } : item)));

      // If viewing detail modal, refresh full details
      if (selectedEmergency?.id === id) {
        setSelectedEmergency(prev => prev ? { ...prev, ...updated } : null);
        try {
          const freshDetail = await getSosIncident(id);
          setDetailedIncident(freshDetail);
        } catch {
          setDetailedIncident(prev => prev ? { ...prev, ...updated } : null);
        }
      }

      setIsFalseAlarmModalOpen(false);
      setFalseAlarmIncidentId(null);
      setFalseAlarmReason("");
      setFalseAlarmError(null);
    } catch (err: any) {
      console.error("Gagal update status SOS:", err);
      toast(err.message || "Gagal memperbarui status SOS.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const openFalseAlarmModal = (id: string) => {
    setFalseAlarmIncidentId(id);
    setFalseAlarmReason("");
    setFalseAlarmError(null);
    setIsFalseAlarmModalOpen(true);
  };

  const handleConfirmFalseAlarm = () => {
    if (!falseAlarmReason.trim()) {
      setFalseAlarmError("Alasan wajib diisi untuk membatalkan laporan.");
      return;
    }
    if (falseAlarmReason.trim().length > 500) {
      setFalseAlarmError("Alasan maksimal 500 karakter.");
      return;
    }
    if (falseAlarmIncidentId) {
      handleUpdateStatus(falseAlarmIncidentId, 'false_alarm', falseAlarmReason.trim());
    }
  };

  // ==========================================
  // DETAIL MODAL HANDLER
  // ==========================================

  const openDetailModal = async (alert: SosIncident) => {
    setSelectedEmergency(alert);
    setDetailedIncident(alert);
    setIsModalOpen(true);
    setIsLoadingDetail(true);

    try {
      const fullData = await getSosIncident(alert.id);
      setDetailedIncident(fullData);
    } catch (err: any) {
      console.warn("Detail tambahan tidak dapat dimuat:", err.message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // ==========================================
  // CREATE INCIDENT HANDLER
  // ==========================================

  const openCreateModal = () => {
    loadPilgrims();
    setCreateFormData({
      jamaah_id: '',
      type: 'health',
      location_name: 'Masjidil Haram - Bab Malik Abdulaziz',
      latitude: '21.4225',
      longitude: '39.8262',
      description: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.jamaah_id) {
      toast("Pilih jamaah yang mengalami keadaan darurat.", "error");
      return;
    }

    const lat = parseFloat(createFormData.latitude);
    const lng = parseFloat(createFormData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast("Latitude harus berupa angka valid antara -90 dan 90.", "error");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast("Longitude harus berupa angka valid antara -180 dan 180.", "error");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const payload: CreateSosIncidentPayload = {
        jamaah_id: createFormData.jamaah_id,
        type: createFormData.type,
        location_name: createFormData.location_name.trim() || undefined,
        description: createFormData.description.trim() || undefined,
        latitude: lat,
        longitude: lng,
      };

      await createSosIncident(payload);
      toast("Laporan darurat SOS berhasil dibuat di server.", "success");
      setIsCreateModalOpen(false);
      // Refresh list to include newly created incident
      fetchIncidentsData(1);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Gagal membuat laporan SOS:", err);
      toast(err.message || "Gagal membuat laporan darurat SOS.", "error");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // ==========================================
  // EXPORT EXCEL
  // ==========================================

  const handleExportExcel = () => {
    if (filteredEmergencies.length === 0) {
      toast("Tidak ada data darurat untuk diekspor.", "error");
      return;
    }
    const exportData = filteredEmergencies.map(e => ({
      'ID Laporan': e.id,
      'Nama Jamaah': e.jamaah?.full_name || 'Tidak Diketahui',
      'Kontak Jamaah': e.jamaah?.phone || '-',
      'Kloter / Rombongan': e.kloter?.name || '-',
      'Tipe Darurat': getTypeLabel(e.type),
      'Lokasi Terakhir': e.location_name || (e.latitude && e.longitude ? `${e.latitude}, ${e.longitude}` : '-'),
      'Waktu Pemicu': formatIndoTime(e.triggered_at),
      'Tanggal': formatIndoDate(e.triggered_at),
      'Status': getStatusLabel(e.status),
    }));
    exportToExcel(exportData, 'Laporan_Darurat_SOS_Backend', 'Laporan Peringatan Darurat & Medis Jamaah - DNA Tour');
  };

  // ==========================================
  // METRICS & FILTERS CALCULATION
  // ==========================================

  const isIncidentActive = (status: SosStatus) => {
    return status === 'triggered' || status === 'acknowledged' || status === 'in_action';
  };

  const isIncidentResolved = (status: SosStatus) => {
    return status === 'resolved' || status === 'false_alarm';
  };

  const isIncidentMedical = (type: string, desc?: string | null) => {
    const combined = `${type} ${desc || ''}`.toLowerCase();
    return combined.includes('health') || combined.includes('medic') || combined.includes('sehat') || combined.includes('sakit');
  };

  const isIncidentLost = (type: string, desc?: string | null) => {
    const combined = `${type} ${desc || ''}`.toLowerCase();
    return combined.includes('lost') || combined.includes('pisah') || combined.includes('sesat');
  };

  // Dynamic statistics from loaded data
  const totalEmergencies = pagination.total || incidents.length;
  const activeEmergencies = incidents.filter(e => isIncidentActive(e.status));
  const resolvedEmergencies = incidents.filter(e => isIncidentResolved(e.status));
  const medicalEmergencies = incidents.filter(e => isIncidentMedical(e.type, e.description));
  const lostEmergencies = incidents.filter(e => isIncidentLost(e.type, e.description));

  const hasActiveFilters = Boolean(filterType || filterGroup || filterStatus);

  const resetFilters = () => {
    setFilterType("");
    setFilterGroup("");
    setFilterStatus("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Kloter list derived from incidents
  const availableKloters = useMemo(() => {
    const map = new Map<string, string>();
    incidents.forEach(inc => {
      if (inc.kloter?.name) {
        map.set(inc.kloter.id, inc.kloter.name);
      }
    });
    return Array.from(map.values()).sort();
  }, [incidents]);

  // Filtered incidents
  const filteredEmergencies = useMemo(() => {
    return incidents.filter(e => {
      // Tab filter
      if (activeTab === 'active' && !isIncidentActive(e.status)) return false;
      if (activeTab === 'resolved' && !isIncidentResolved(e.status)) return false;
      if (activeTab === 'medical' && !isIncidentMedical(e.type, e.description)) return false;
      if (activeTab === 'lost' && !isIncidentLost(e.type, e.description)) return false;

      // Search matching
      const pilgrimName = e.jamaah?.full_name || '';
      const groupName = e.kloter?.name || '';
      const location = e.location_name || '';
      const desc = e.description || '';
      const typeLabel = getTypeLabel(e.type);
      const query = searchTerm.toLowerCase();

      const matchesSearch = 
        !searchTerm ||
        pilgrimName.toLowerCase().includes(query) ||
        e.id.toLowerCase().includes(query) ||
        groupName.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        typeLabel.toLowerCase().includes(query);

      const matchesType = filterType ? e.type === filterType : true;
      const matchesGroup = filterGroup ? e.kloter?.name === filterGroup : true;
      const matchesStatus = filterStatus ? e.status === filterStatus : true;

      return matchesSearch && matchesType && matchesGroup && matchesStatus;
    });
  }, [incidents, activeTab, searchTerm, filterType, filterGroup, filterStatus]);

  // Selection handlers
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

  // Helper to determine next primary status action
  const getNextActionConfig = (status: SosStatus) => {
    switch (status) {
      case 'triggered':
        return {
          nextStatus: 'acknowledged' as SosStatus,
          buttonText: 'Konfirmasi (Acknowledge)',
          badgeText: 'Konfirmasi',
          icon: CheckCircle2,
          className: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'acknowledged':
        return {
          nextStatus: 'in_action' as SosStatus,
          buttonText: 'Mulai Penanganan (In Action)',
          badgeText: 'Tangani',
          icon: Activity,
          className: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'in_action':
        return {
          nextStatus: 'resolved' as SosStatus,
          buttonText: 'Tandai Selesai (Resolve)',
          badgeText: 'Selesaikan',
          icon: CheckCheck,
          className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner Container */}
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
              Pusat penanganan darurat jamaah, koordinasi medis, evakuasi, dan pelacakan lokasi real-time terintegrasi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={() => fetchIncidentsData(currentPage)}
              disabled={isLoading}
              className="text-xs h-10 px-3.5 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Segarkan data dari server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#740A03]' : ''}`} />
              <span>Segarkan</span>
            </Button>

            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs h-10 px-3 rounded-xl border-gray-200 text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Batal Pilih ({selectedIds.size})
              </Button>
            )}

            <Button 
              variant="outline"
              onClick={handleExportExcel}
              disabled={isLoading || filteredEmergencies.length === 0}
              className="text-xs h-10 px-3.5 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedIds.size > 0 ? `Ekspor Terpilih (${selectedIds.size})` : 'Ekspor Excel'}</span>
            </Button>

            <Button 
              onClick={openCreateModal}
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
          onClick={() => { setActiveTab('all'); }}
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
              <span>Semua Insiden & Log SOS Server</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Darurat Aktif */}
        <Card 
          onClick={() => { setActiveTab('active'); }}
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
          onClick={() => { setActiveTab('resolved'); }}
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
              <span>Insiden Selesai / False Alarm</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Kasus Medis */}
        <Card 
          onClick={() => { setActiveTab('medical'); }}
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
              onClick={() => { setActiveTab('all'); }}
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
                {incidents.length}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#740A03] rounded-full animate-tab-indicator" />
              )}
            </button>
            
            <button 
              onClick={() => { setActiveTab('active'); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'active' 
                  ? 'font-bold text-rose-700' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {activeEmergencies.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" />}
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
              onClick={() => { setActiveTab('resolved'); }}
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
              onClick={() => { setActiveTab('medical'); }}
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
              onClick={() => { setActiveTab('lost'); }}
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
              placeholder="Cari nama jamaah, ID laporan, lokasi, kloter..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Semua Tipe</option>
                <option value="health">Darurat Medis (health)</option>
                <option value="lost">Jamaah Terpisah (lost)</option>
                <option value="accident">Kecelakaan (accident)</option>
                <option value="critical">Darurat Kritis (critical)</option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status Kejadian</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="triggered">Terpicu (Baru)</option>
                <option value="acknowledged">Dikonfirmasi Petugas</option>
                <option value="in_action">Dalam Penanganan</option>
                <option value="resolved">Selesai Ditangani</option>
                <option value="false_alarm">False Alarm (Batal)</option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-52">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kloter Rombongan</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="">Semua Kloter</option>
                {availableKloters.map(name => (
                  <option key={name} value={name}>{name}</option>
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

        {/* Server Error Alert Banner */}
        {fetchError && (
          <div className="p-4 mx-4 my-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-800 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchIncidentsData(currentPage)}
              className="text-xs h-7 px-3 bg-white border-red-200 hover:bg-red-100 text-red-800 cursor-pointer"
            >
              Coba Lagi
            </Button>
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
                <TableHead className="text-right pr-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[170px]">Aksi Penanganan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody key={activeTab} className="animate-fade-in">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`} className="animate-pulse border-b border-gray-100">
                    <TableCell className="pl-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded"></div></TableCell>
                    <TableCell className="py-4"><div className="w-28 h-4 bg-gray-200 rounded mb-1.5"></div><div className="w-20 h-3 bg-gray-100 rounded"></div></TableCell>
                    <TableCell className="py-4"><div className="w-36 h-4 bg-gray-200 rounded mb-1.5"></div><div className="w-24 h-3 bg-gray-100 rounded"></div></TableCell>
                    <TableCell className="py-4"><div className="w-24 h-6 bg-gray-200 rounded-full"></div></TableCell>
                    <TableCell className="py-4"><div className="w-32 h-4 bg-gray-200 rounded mb-1.5"></div><div className="w-20 h-3 bg-gray-100 rounded"></div></TableCell>
                    <TableCell className="py-4"><div className="w-20 h-6 bg-gray-200 rounded-full"></div></TableCell>
                    <TableCell className="text-right pr-6 py-4"><div className="w-24 h-8 bg-gray-200 rounded ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : filteredEmergencies.length > 0 ? (
                filteredEmergencies.map((alert) => {
                  const pilgrimName = alert.jamaah?.full_name || 'Jamaah Tidak Dikenal';
                  const pilgrimPhone = alert.jamaah?.phone || null;
                  const kloterName = alert.kloter?.name || 'Tanpa Kloter';
                  const isActive = isIncidentActive(alert.status);
                  const isUpdatingThis = updatingId === alert.id;
                  const nextAction = getNextActionConfig(alert.status);
                  const hasTableCoords = isValidCoordinate(alert.latitude) && isValidCoordinate(alert.longitude);

                  return (
                    <TableRow 
                      key={alert.id}
                      className={`${selectedIds.has(alert.id) ? "bg-rose-50/40" : ""} hover:bg-gray-50/80 transition-colors group cursor-pointer border-b border-gray-100/80`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('input[type="checkbox"], button, a')) return;
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
                            <span className="font-mono">{formatIndoTime(alert.triggered_at)}</span>
                          </div>
                          <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                            {formatIndoDate(alert.triggered_at)}
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
                            {pilgrimName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm whitespace-nowrap flex items-center gap-1.5">
                              {pilgrimName}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5 font-medium whitespace-nowrap">
                              {kloterName} • {pilgrimPhone || 'Tidak ada no telepon'}
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
                            <span>
                              {alert.location_name || (hasTableCoords ? `Koordinat (${Number(alert.latitude).toFixed(4)}, ${Number(alert.longitude).toFixed(4)})` : 'Lokasi tidak disebutkan')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {hasTableCoords ? (
                              <>
                                <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/live-monitoring', {
                                      state: {
                                        lat: Number(alert.latitude),
                                        lng: Number(alert.longitude),
                                        name: pilgrimName,
                                        incidentId: alert.id,
                                      }
                                    });
                                  }}
                                  className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Navigation className="w-3 h-3" /> Peta
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">
                                Koordinat GPS tidak ada
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4 whitespace-nowrap">
                        {getStatusBadge(alert.status)}
                      </TableCell>

                      {/* Aksi Penanganan */}
                      <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                          {/* Next Status Transition Button */}
                          {nextAction && (
                            <Button 
                              size="sm"
                              disabled={isUpdatingThis}
                              className={`h-8 text-xs font-semibold px-2.5 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 ${nextAction.className}`}
                              title={nextAction.buttonText}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(alert.id, nextAction.nextStatus);
                              }}
                            >
                              <nextAction.icon className={`w-3.5 h-3.5 ${isUpdatingThis ? 'animate-spin' : ''}`} />
                              <span>{nextAction.badgeText}</span>
                            </Button>
                          )}

                          {/* False Alarm Button for active incidents */}
                          {isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdatingThis}
                              className="h-8 text-[11px] font-medium px-2 rounded-lg text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                              title="Tandai sebagai False Alarm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFalseAlarmModal(alert.id);
                              }}
                            >
                              False Alarm
                            </Button>
                          )}

                          {/* View Detail Button */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                            title="Lihat Detail Riwayat & Info Lengkap"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailModal(alert);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
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
                          onClick={openCreateModal}
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

        {/* Pagination Footer - Synced with Backend Pagination */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            {filteredEmergencies.length !== incidents.length ? (
              <>
                Menampilkan <span className="font-semibold text-gray-900">{filteredEmergencies.length}</span> laporan hasil filter (dari <span className="font-semibold text-gray-900">{pagination.total}</span> total di server)
              </>
            ) : pagination.total > 0 ? (
              <>
                Menampilkan <span className="font-semibold text-gray-900">{(pagination.currentPage - 1) * pagination.perPage + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(pagination.currentPage * pagination.perPage, pagination.total)}</span> dari <span className="font-semibold text-gray-900">{pagination.total}</span> laporan server
              </>
            ) : (
              "Menampilkan 0 laporan"
            )}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-lg border-gray-200 text-gray-700 flex-1 sm:flex-none cursor-pointer" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage <= 1 || isLoading}
            >
              Sebelumnya
            </Button>
            <span className="text-xs font-medium text-gray-600 px-2">
              Hal {pagination.currentPage} / {Math.max(1, pagination.lastPage)}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-lg border-gray-200 text-gray-700 flex-1 sm:flex-none cursor-pointer" 
              onClick={() => setCurrentPage(p => Math.min(pagination.lastPage, p + 1))} 
              disabled={currentPage >= pagination.lastPage || isLoading}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: DETAIL DARURAT & RIWAYAT STATUS PENANGANAN                       */}
      {/* ========================================================================= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#00a859] text-white shadow-xs select-none">
                Data Detail Darurat SOS
              </span>
            </div>
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedEmergency && (() => {
            const currentItem = detailedIncident || selectedEmergency;
            const pilgrimName = currentItem.jamaah?.full_name || 'Jamaah Tidak Dikenal';
            const pilgrimPhone = currentItem.jamaah?.phone || null;
            const kloterName = currentItem.kloter?.name || 'Tanpa Kloter';
            const isActive = isIncidentActive(currentItem.status);
            const isUpdatingThis = updatingId === currentItem.id;
            const nextAction = getNextActionConfig(currentItem.status);
            const statusHistories = currentItem.status_histories || (currentItem as any).statusHistories || [];
            const responsesList = currentItem.responses || [];
            const hasDetailCoords = isValidCoordinate(currentItem.latitude) && isValidCoordinate(currentItem.longitude);

            return (
              <div className="space-y-6 animate-fade-in">
                {/* Status Indicator Card & Transition Buttons */}
                <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isActive 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : currentItem.status === 'resolved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-gray-100 border-gray-200 text-gray-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      isActive 
                        ? 'bg-rose-600 text-white' 
                        : currentItem.status === 'resolved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-600 text-white'
                    }`}>
                      {isActive ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                        <span>STATUS: {getStatusLabel(currentItem.status)}</span>
                      </p>
                      <p className="text-xs font-medium opacity-90 mt-0.5">
                        {isActive 
                          ? 'Memerlukan koordinasi & tindakan petugas di lapangan' 
                          : currentItem.status === 'resolved'
                            ? 'Insiden telah selesai ditangani dan ditutup'
                            : 'Laporan telah dibatalkan sebagai false alarm'}
                      </p>
                    </div>
                  </div>

                  {/* Transition Actions in Modal Header */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {nextAction && (
                      <Button
                        disabled={isUpdatingThis}
                        onClick={() => handleUpdateStatus(currentItem.id, nextAction.nextStatus)}
                        className={`text-xs font-bold px-4 h-9 rounded-xl shadow-2xs shrink-0 cursor-pointer ${nextAction.className}`}
                      >
                        <nextAction.icon className={`w-3.5 h-3.5 mr-1.5 ${isUpdatingThis ? 'animate-spin' : ''}`} />
                        {nextAction.buttonText}
                      </Button>
                    )}

                    {isActive && (
                      <Button
                        variant="outline"
                        disabled={isUpdatingThis}
                        onClick={() => openFalseAlarmModal(currentItem.id)}
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold px-3.5 h-9 rounded-xl shadow-2xs shrink-0 cursor-pointer"
                      >
                        False Alarm
                      </Button>
                    )}
                  </div>
                </div>

                {/* Section 1: Informasi Kejadian */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-3 flex items-center justify-between">
                    <span>Informasi Kejadian</span>
                    {isLoadingDetail && (
                      <span className="text-xs font-normal text-gray-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Memuat detail server...
                      </span>
                    )}
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-2xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3 px-5">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <ShieldAlert className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>ID Laporan (UUID)</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs text-right font-mono select-all">
                        {currentItem.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 px-5">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <Activity className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Jenis Kejadian</span>
                      </div>
                      <div className="text-right">
                        {getTypeBadge(currentItem.type)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 px-5">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <Clock className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Waktu Pemicu (Triggered)</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs sm:text-sm text-right">
                        {formatIndoTime(currentItem.triggered_at)} • {formatIndoDate(currentItem.triggered_at)}
                      </span>
                    </div>

                    {currentItem.acknowledged_at && (
                      <div className="flex items-center justify-between py-3 px-5">
                        <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Waktu Dikonfirmasi</span>
                        </div>
                        <span className="font-bold text-gray-900 text-xs sm:text-sm text-right">
                          {formatIndoTime(currentItem.acknowledged_at)} • {formatIndoDate(currentItem.acknowledged_at)}
                        </span>
                      </div>
                    )}

                    {currentItem.resolved_at && (
                      <div className="flex items-center justify-between py-3 px-5">
                        <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                          <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Waktu Selesai Ditangani</span>
                        </div>
                        <span className="font-bold text-gray-900 text-xs sm:text-sm text-right">
                          {formatIndoTime(currentItem.resolved_at)} • {formatIndoDate(currentItem.resolved_at)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3 px-5">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <MapPin className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Lokasi Landmark</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs sm:text-sm text-right max-w-xs sm:max-w-md">
                        {currentItem.location_name || 'Tidak ada deskripsi lokasi'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 px-5">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Koordinat GPS Nyata</span>
                      </div>
                      <span className="font-mono text-xs sm:text-sm text-right text-gray-800">
                        {hasDetailCoords ? (
                          `${Number(currentItem.latitude).toFixed(5)}, ${Number(currentItem.longitude).toFixed(5)}`
                        ) : (
                          <span className="text-gray-400 italic font-sans">Koordinat GPS tidak tersedia</span>
                        )}
                      </span>
                    </div>

                    {currentItem.description && (
                      <div className="py-3 px-5">
                        <p className="text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1">
                          Catatan / Keterangan Kondisi:
                        </p>
                        <p className="text-xs sm:text-sm text-gray-800 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          {currentItem.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Data Jamaah Terkait */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-3">
                    Data Jamaah Terkait
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-2xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3 px-5">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nama Lengkap Jamaah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs sm:text-sm text-right">
                        {pilgrimName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 px-5">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <Users className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Kloter / Rombongan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs sm:text-sm text-right">
                        {kloterName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 px-5">
                      <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm font-medium">
                        <Phone className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nomor Kontak / WhatsApp</span>
                      </div>
                      <span className="font-bold text-blue-700 text-xs sm:text-sm text-right font-mono">
                        {pilgrimPhone || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Riwayat Status & Catatan Penanganan */}
                {statusHistories.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-3 flex items-center gap-2">
                      <History className="w-4.5 h-4.5 text-[#740A03]" />
                      <span>Riwayat Perubahan Status ({statusHistories.length})</span>
                    </h2>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {statusHistories.map((hist, idx) => {
                        const actor =
                          hist.internal_user?.full_name ||
                          (hist as any).internalUser?.full_name ||
                          hist.tour_leader?.full_name ||
                          (hist as any).tourLeader?.full_name ||
                          'Petugas';
                        return (
                          <div 
                            key={hist.id || idx}
                            className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-2 h-2 rounded-full bg-[#740A03] mt-1.5 shrink-0" />
                              <div>
                                <p className="font-bold text-gray-900">
                                  {hist.old_status ? getStatusLabel(hist.old_status) : 'Awal'} &rarr; {getStatusLabel(hist.new_status)}
                                </p>
                                <p className="text-gray-500 text-[11px] mt-0.5">
                                  Oleh: <span className="font-semibold text-gray-700">{actor}</span>
                                </p>
                                {hist.reason && (
                                  <p className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md mt-1.5 text-[11px]">
                                    Alasan: {hist.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-gray-400 font-mono text-[11px] sm:text-right shrink-0">
                              {formatIndoTime(hist.changed_at)} • {formatIndoDate(hist.changed_at)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 4: Tanggapan & Catatan Lapangan */}
                {responsesList.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4.5 h-4.5 text-[#740A03]" />
                      <span>Tanggapan & Catatan Lapangan ({responsesList.length})</span>
                    </h2>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {responsesList.map((resp, idx) => {
                        const sender =
                          resp.internal_user?.full_name ||
                          (resp as any).internalUser?.full_name ||
                          resp.tour_leader?.full_name ||
                          (resp as any).tourLeader?.full_name ||
                          resp.jamaah?.full_name ||
                          'Petugas Lapangan';
                        return (
                          <div
                            key={resp.id || idx}
                            className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-gray-900">{sender}</span>
                              <span className="text-gray-400 font-mono text-[11px]">
                                {formatIndoTime(resp.created_at)} • {formatIndoDate(resp.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-800 bg-white p-2.5 rounded-lg border border-gray-200/60">
                              {resp.message}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notice on Immutability */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-[11px] flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    Catatan: Informasi kejadian darurat dan riwayat audit trail dikelola secara permanen oleh server Laravel untuk menjaga integritas data penanganan.
                  </span>
                </div>

                {/* Quick Action Contact Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {pilgrimPhone ? (
                    <>
                      <a 
                        href={`tel:${pilgrimPhone}`} 
                        className="flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                      >
                        <PhoneCall className="w-4 h-4 text-emerald-600" />
                        <span>Telepon Jamaah</span>
                      </a>

                      <a 
                        href={`https://wa.me/${pilgrimPhone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat WhatsApp</span>
                      </a>
                    </>
                  ) : (
                    <div className="sm:col-span-2 flex items-center justify-center h-11 rounded-2xl text-xs bg-gray-100 text-gray-400">
                      Kontak telepon jamaah tidak tersedia
                    </div>
                  )}

                  <button 
                    type="button"
                    disabled={!currentItem.latitude || !currentItem.longitude}
                    onClick={() => {
                      if (!currentItem.latitude || !currentItem.longitude) return;
                      setIsModalOpen(false);
                      navigate('/live-monitoring', {
                        state: {
                          lat: currentItem.latitude,
                          lng: currentItem.longitude,
                          name: pilgrimName,
                          incidentId: currentItem.id,
                        }
                      });
                    }}
                    className={`flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-xs transition-all shadow-2xs ${
                      currentItem.latitude && currentItem.longitude
                        ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Pantau di Peta</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: FORM LAPOR DARURAT BARU (POST /api/sos-incidents)                */}
      {/* ========================================================================= */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Lapor Kejadian Darurat Baru (SOS)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Menerbitkan laporan darurat resmi ke sistem pusat dan aplikasi Tour Leader
              </p>
            </div>
            
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {/* Jamaah Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                <span>Pilih Jamaah Terkait *</span>
                {isLoadingPilgrims && (
                  <span className="text-[11px] font-normal text-gray-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Memuat jamaah...
                  </span>
                )}
              </label>
              <select
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                value={createFormData.jamaah_id}
                onChange={(e) => setCreateFormData({ ...createFormData, jamaah_id: e.target.value })}
                required
              >
                <option value="">-- Pilih Jamaah dari Sistem --</option>
                {availablePilgrims.map(p => (
                  <option key={p.backendId || p.id} value={p.backendId || p.id}>
                    {p.name} {p.group ? `(${p.group})` : ''} - {p.passport ? `Paspor: ${p.passport}` : p.ktp}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview Selected Pilgrim */}
            {(() => {
              const selectedPilgrim = availablePilgrims.find(
                p => (p.backendId || p.id) === createFormData.jamaah_id
              );
              if (!selectedPilgrim) return null;
              return (
                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 text-xs text-gray-700 flex flex-col gap-1 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{selectedPilgrim.name}</span>
                    <span className="text-[11px] font-medium text-red-800 bg-red-100/60 px-2 py-0.5 rounded-md">
                      {selectedPilgrim.group || 'Kloter belum ditentukan'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Kontak: <strong className="text-gray-700 font-mono">{selectedPilgrim.phone || '-'}</strong></span>
                    <span>Hotel: <strong className="text-gray-700">{selectedPilgrim.hotelMakkah || selectedPilgrim.hotel || '-'}</strong></span>
                    {selectedPilgrim.passport && <span>Paspor: <strong className="text-gray-700 font-mono">{selectedPilgrim.passport}</strong></span>}
                  </div>
                </div>
              );
            })()}

            {/* Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Jenis Kejadian Darurat *</label>
              <select
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                value={createFormData.type}
                onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value as any })}
                required
              >
                <option value="health">Darurat Medis / Sakit (health)</option>
                <option value="lost">Jamaah Terpisah / Tersesat (lost)</option>
                <option value="accident">Kecelakaan (accident)</option>
                <option value="critical">Darurat Kritis / Evakuasi (critical)</option>
              </select>
            </div>

            {/* Location Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Lokasi / Landmark Kejadian</label>
              <Input 
                placeholder="Contoh: Gate 1 Bab Malik Abdulaziz, Masjidil Haram"
                value={createFormData.location_name}
                onChange={(e) => setCreateFormData({ ...createFormData, location_name: e.target.value })}
                className="h-10 rounded-xl text-xs font-medium"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { name: "Bab Malik Abdulaziz", lat: "21.4225", lng: "39.8262" },
                  { name: "Pelataran Tawaf", lat: "21.4225", lng: "39.8262" },
                  { name: "Jabal Rahmah Arafah", lat: "21.3547", lng: "39.9840" },
                  { name: "Masjid Nabawi Madinah", lat: "24.4672", lng: "39.6111" },
                ].map(preset => (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() => setCreateFormData({
                      ...createFormData,
                      location_name: preset.name,
                      latitude: preset.lat,
                      longitude: preset.lng,
                    })}
                    className="text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates Lat / Lng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Latitude (-90 s/d 90) *</label>
                <Input 
                  type="number"
                  step="any"
                  value={createFormData.latitude}
                  onChange={(e) => setCreateFormData({ ...createFormData, latitude: e.target.value })}
                  required
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Longitude (-180 s/d 180) *</label>
                <Input 
                  type="number"
                  step="any"
                  value={createFormData.longitude}
                  onChange={(e) => setCreateFormData({ ...createFormData, longitude: e.target.value })}
                  required
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Deskripsi Tambahan</label>
              <textarea 
                rows={3}
                placeholder="Rincian kondisi darurat jamaah (misal: pusing berat, dehidrasi, terpisah saat tawaf)..."
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs rounded-xl h-10 px-5 font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <Button 
                type="submit"
                disabled={isSubmittingCreate}
                className="bg-[#740A03] hover:bg-[#580802] text-white text-xs font-bold rounded-xl h-10 px-6 cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {isSubmittingCreate && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmittingCreate ? "Menerbitkan..." : "Terbitkan Laporan SOS"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: FALSE ALARM CONFIRMATION & REASON INPUT                          */}
      {/* ========================================================================= */}
      <Dialog open={isFalseAlarmModalOpen} onOpenChange={setIsFalseAlarmModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-md sm:w-full bg-white rounded-3xl p-6 shadow-2xl border-0">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Konfirmasi False Alarm</h3>
                <p className="text-xs text-gray-500">Tandai laporan sebagai palsu atau tidak sengaja tertekan</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
              Backend mewajibkan alasan resmi untuk membatalkan laporan darurat. Status ini bersifat final dan tidak dapat dibuka kembali.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex justify-between">
                <span>Alasan Pembatalan / False Alarm *</span>
                <span className="text-[11px] font-mono text-gray-400">{falseAlarmReason.length}/500</span>
              </label>
              <textarea 
                rows={3}
                maxLength={500}
                placeholder="Contoh: Tombol darurat tidak sengaja tertekan di saku oleh jamaah..."
                value={falseAlarmReason}
                onChange={(e) => {
                  setFalseAlarmReason(e.target.value);
                  if (falseAlarmError) setFalseAlarmError(null);
                }}
                className={`w-full rounded-xl border p-3 text-xs focus:outline-none focus:ring-1 ${
                  falseAlarmError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-amber-500'
                }`}
              />
              {falseAlarmError && (
                <p className="text-[11px] text-red-600 font-medium">{falseAlarmError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFalseAlarmModalOpen(false)}
                className="text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={Boolean(updatingId)}
                onClick={handleConfirmFalseAlarm}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer shadow-2xs"
              >
                {updatingId ? "Menyimpan..." : "Tandai False Alarm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
