import React, { useEffect, useState, useMemo } from 'react';
import { toast } from '@/lib/toast';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Search,
  Filter,
  UserPlus,
  Trash2,
  Edit2,
  Eye,
  Users,
  CreditCard,
  BookOpen,
  FileCheck,
  Phone,
  AlertCircle,
  Package,
  Building2,
  PlaneTakeoff,
  PlaneLanding,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  User,
  Flag,
  UserCheck,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { useStore, Pilgrim } from '@/core/store';
import {
  JamaahPayload,
  jamaahService,
  mapGenderToBackend,
  formatDateForInput,
} from '@/core/services/jamaahService';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/Dialog';
import { exportMasterWorkbookToExcel } from '@/lib/export';
import { kloterService } from '@/core/services/kloterService';
import {
  tourLeaderService,
  getPrimaryTourLeader,
} from '@/core/services/tourLeaderService';

export default function Pilgrims() {
  // ==========================================
  // FITUR: PILGRIMS
  // Komponen utama untuk fitur PILGRIMS
  // ==========================================

  const {
    pilgrims,
    setPilgrims,
    groups,
    setGroups,
    tourLeaders,
    setTourLeaders,
    mutawifs,
    schedules,
    emergencies,
    rooms,
    staffStocks,
    financeTransactions,
    financeExpenses,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<
    'all' | 'male' | 'female' | 'elderly' | 'unassigned'
  >('all');

  const [showFilters, setShowFilters] = useState(false);
  const [filterPackage, setFilterPackage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterPassportStatus, setFilterPassportStatus] = useState('');
  const [filterDepartureDate, setFilterDepartureDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);
  const [modalTab, setModalTab] = useState<'data-diri' | 'form-edit'>(
    'data-diri'
  );
  const [formData, setFormData] = useState<Partial<Pilgrim>>({});
  const [modifiedDates, setModifiedDates] = useState<{
    [key: string]: boolean;
  }>({});

  const [isLoadingJamaah, setIsLoadingJamaah] = useState(false);
  const [jamaahError, setJamaahError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // ==========================================
  // LOAD JAMAAH & DATA TERKAIT DARI BACKEND
  // ==========================================

  useEffect(() => {
    const fetchJamaahs = async () => {
      setIsLoadingJamaah(true);
      setJamaahError(null);

      try {
        const data = await jamaahService.getJamaahs();
        setPilgrims(data);
      } catch (error) {
        console.error('Gagal mengambil data jamaah:', error);

        setJamaahError(
          error instanceof Error
            ? error.message
            : 'Gagal mengambil data jamaah.'
        );
      } finally {
        setIsLoadingJamaah(false);
      }
    };

    fetchJamaahs();
  }, [setPilgrims]);

  useEffect(() => {
    const fetchKlotersAndTourLeaders = async () => {
      try {
        const [klotersData, tourLeadersData] = await Promise.all([
          kloterService.getKloters(),
          tourLeaderService.getTourLeaders(),
        ]);

        setGroups(klotersData);
        setTourLeaders(tourLeadersData);
      } catch (error) {
        console.error('Gagal mengambil data kloter/tour leader:', error);
      }
    };

    fetchKlotersAndTourLeaders();
  }, [setGroups, setTourLeaders]);

  const formatIndoDate = (
    dateStr?: string,
    fallback: string = '-'
  ) => {
    if (!dateStr) return fallback;
    const cleaned = formatDateForInput(dateStr);
    if (!cleaned) return fallback;
    const parts = cleaned.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    if (
      isNaN(year) ||
      isNaN(monthIdx) ||
      isNaN(day) ||
      monthIdx < 0 ||
      monthIdx > 11
    ) {
      return dateStr;
    }
    return `${day} ${months[monthIdx]} ${year}`;
  };

  // ==========================================
  // STATS
  // ==========================================

  const totalPilgrims = pilgrims.length;

  const totalMale = pilgrims.filter(
    (p) => p.gender === 'Laki-laki' || p.gender === 'L'
  ).length;

  const totalFemale = pilgrims.filter(
    (p) => p.gender === 'Perempuan' || p.gender === 'P'
  ).length;

  const totalElderly = pilgrims.filter(
    (p) => (p.age || 0) >= 60
  ).length;

  const totalUnassigned = pilgrims.filter(
    (p) =>
      !p.group ||
      p.group === '-' ||
      p.group === 'Belum ada kloter'
  ).length;

  const totalPassportReady = pilgrims.filter(
    (p) => p.passport && p.passport.trim().length > 3
  ).length;

  const uniqueDepartureDates = useMemo(() => {
    const dates = new Set<string>();

    pilgrims.forEach((p) => {
      if (
        p.departureDate &&
        p.departureDate.trim() &&
        p.departureDate !== '-'
      ) {
        dates.add(p.departureDate);
      }
    });

    return Array.from(dates);
  }, [pilgrims]);

  // ==========================================
  // FILTER
  // ==========================================

  const filteredPilgrims = useMemo(() => {
    return pilgrims.filter((p) => {
      if (
        activeTab === 'male' &&
        !(p.gender === 'Laki-laki' || p.gender === 'L')
      ) {
        return false;
      }

      if (
        activeTab === 'female' &&
        !(p.gender === 'Perempuan' || p.gender === 'P')
      ) {
        return false;
      }

      if (
        activeTab === 'elderly' &&
        (p.age || 0) < 60
      ) {
        return false;
      }

      if (
        activeTab === 'unassigned' &&
        p.group &&
        p.group !== '-' &&
        p.group !== 'Belum ada kloter'
      ) {
        return false;
      }

      const matchesSearch =
        p.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (p.passport &&
          p.passport
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        p.id
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (p.phone &&
          p.phone
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (p.group &&
          p.group
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesPackage = filterPackage
        ? p.umrahPackage === filterPackage
        : true;

      const matchesGroup = filterGroup
        ? p.group === filterGroup
        : true;

      const matchesDeparture = filterDepartureDate
        ? p.departureDate === filterDepartureDate ||
          (p.departureDate &&
            formatIndoDate(p.departureDate) ===
              formatIndoDate(filterDepartureDate))
        : true;

      let matchesPassport = true;

      if (filterPassportStatus === 'ready') {
        matchesPassport = Boolean(
          p.passport && p.passport.trim().length > 3
        );
      } else if (filterPassportStatus === 'pending') {
        matchesPassport =
          !p.passport || p.passport.trim().length <= 3;
      }

      return (
        matchesSearch &&
        matchesPackage &&
        matchesGroup &&
        matchesDeparture &&
        matchesPassport
      );
    });
  }, [
    pilgrims,
    activeTab,
    searchTerm,
    filterPackage,
    filterGroup,
    filterDepartureDate,
    filterPassportStatus,
  ]);

  // ==========================================
  // SELECT
  // ==========================================

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPilgrims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(filteredPilgrims.map((p) => p.id))
      );
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    setIsDeleteDialogOpen(true);
  };

  // ==========================================
  // DELETE VIA BACKEND
  // ==========================================

  const confirmDelete = async () => {
    try {
      setIsLoadingJamaah(true);
      setJamaahError(null);

      const selectedPilgrims = pilgrims.filter(
        (pilgrim) => selectedIds.has(pilgrim.id)
      );

      await Promise.all(
        selectedPilgrims.map((pilgrim) => {
          if (!pilgrim.backendId) {
            throw new Error(
              `ID backend untuk jamaah ${pilgrim.id} tidak ditemukan.`
            );
          }

          return jamaahService.deleteJamaah(
            pilgrim.backendId
          );
        })
      );

      setPilgrims(
        pilgrims.filter(
          (pilgrim) => !selectedIds.has(pilgrim.id)
        )
      );

      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);

      toast(
        'Data jamaah berhasil dihapus.',
        'success'
      );
    } catch (error) {
      console.error(
        'Gagal menghapus jamaah:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menghapus data jamaah.';

      setJamaahError(message);
      toast(message, 'error');
    } finally {
      setIsLoadingJamaah(false);
    }
  };

  // ==========================================
  // DETAIL
  // ==========================================

  const openDetailModal = (p: Pilgrim) => {
    setSelectedPilgrim(p);
    setFormData({ ...p });

    setModifiedDates({
      departureDate: true,
      returnDate: true,
      registrationDate: true,
    });

    setModalTab('data-diri');
    setIsFormModalOpen(true);
  };

  // ==========================================
  // TAMBAH JAMAAH
  // ==========================================

  const openAddModal = () => {
    setSelectedPilgrim(null);
    setModifiedDates({});
    setModalTab('form-edit');

    setFormData({
      id: '',
      name: '',
      ktp: '',
      passport: '',
      visaNumber: '',
      nationality: 'Indonesia',
      gender: '',
      birthDate: '',
      age: undefined,
      phone: '',
      emergencyContact: '',
      group: '',
      kloterId: null,
      tourLeader: '',
      mutawifLocal: '',
      umrahPackage: '',
      hotelMakkah: '',
      hotelMadinah: '',
      hotel: '',
      departureDate: '',
      returnDate: '',
    });

    setIsFormModalOpen(true);
  };

  // ==========================================
  // EDIT
  // ==========================================

  const openEditModal = (p: Pilgrim) => {
    setSelectedPilgrim(p);

    let kloterBackendId = p.kloterId;
    if (!kloterBackendId && p.group) {
      const foundGrp = groups.find(g => g.name === p.group || g.id === p.group);
      kloterBackendId = foundGrp?.backendId || foundGrp?.id || null;
    }
    const primaryTL = kloterBackendId ? getPrimaryTourLeader(kloterBackendId, tourLeaders) : null;

    setFormData({
      ...p,
      tourLeader: primaryTL ? primaryTL.name : '',
    });

    setModifiedDates({
      departureDate: true,
      returnDate: true,
      registrationDate: true,
    });

    setModalTab('form-edit');
    setIsFormModalOpen(true);
  };

  // ==========================================
  // CREATE / UPDATE VIA BACKEND
  // ==========================================

  const savePilgrim = async () => {
    if (!formData.id || !formData.id.trim()) {
      toast(
        'ID Jamaah wajib diisi.',
        'error'
      );
      return;
    }

    if (formData.id.trim().length > 10) {
      toast(
        'ID Jamaah (login_id) maksimal 10 karakter.',
        'error'
      );
      return;
    }

    if (!formData.name || !formData.name.trim()) {
      toast(
        'Nama lengkap jamaah wajib diisi.',
        'error'
      );
      return;
    }

    if (
      !formData.ktp ||
      formData.ktp.trim().length !== 16
    ) {
      toast(
        'NIK wajib diisi dan harus 16 digit.',
        'error'
      );
      return;
    }

    try {
      setIsLoadingJamaah(true);
      setJamaahError(null);

      const selectedGroup = groups.find(
        (group) => group.name === formData.group
      );

      if (formData.group && !selectedGroup?.backendId) {
        throw new Error(
          'ID backend kloter tidak ditemukan.'
        );
      }

      const payload: Partial<JamaahPayload> = {
        login_id: formData.id.trim(),
        nik: formData.ktp.trim(),
        full_name: formData.name.trim(),

        passport_number:
          formData.passport?.trim() || null,

        visa_number:
          formData.visaNumber?.trim() || null,

        nationality:
          formData.nationality?.trim() ||
          'Indonesia',

        gender: mapGenderToBackend(
          formData.gender
        ),

        birth_date:
          formData.birthDate || null,

        phone:
          formData.phone?.trim() || null,

        emergency_contact:
          formData.emergencyContact?.trim() ||
          null,

        package_id: null,
        kloter_id: formData.kloterId ?? null,

        hotel_makkah:
          formData.hotelMakkah?.trim() ||
          null,

        hotel_madinah:
          formData.hotelMadinah?.trim() ||
          null,

        departure_date:
          formData.departureDate || null,

        return_date:
          formData.returnDate || null,

        tour_leader:
          formData.tourLeader?.trim() ||
          null,

        mutawif_local:
          formData.mutawifLocal?.trim() ||
          null,
      };

      // CREATE
      if (!selectedPilgrim) {
        const createdJamaah =
          await jamaahService.createJamaah(
            payload as JamaahPayload
          );

        setPilgrims([
          createdJamaah,
          ...pilgrims,
        ]);

        toast(
          'Data jamaah berhasil disimpan.',
          'success'
        );

        setIsFormModalOpen(false);

        return;
      }

      // UPDATE
      if (!selectedPilgrim.backendId) {
        throw new Error(
          `ID backend untuk jamaah ${selectedPilgrim.id} tidak ditemukan.`
        );
      }

      const updatedJamaah =
        await jamaahService.updateJamaah(
          selectedPilgrim.backendId,
          payload
        );

      setPilgrims(
        pilgrims.map((pilgrim) =>
          pilgrim.backendId ===
          selectedPilgrim.backendId
            ? updatedJamaah
            : pilgrim
        )
      );

      toast(
        'Data jamaah berhasil diperbarui.',
        'success'
      );

      setIsFormModalOpen(false);
    } catch (error) {
      console.error(
        'Gagal menyimpan data jamaah:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan data jamaah.';

      setJamaahError(message);
      toast(message, 'error');
    } finally {
      setIsLoadingJamaah(false);
    }
  };

  // ==========================================
  // EXPORT
  // ==========================================

  const handleExportExcel = async () => {
    try {
      const totalIncome =
        financeTransactions
          .filter(
            (t) =>
              t.type.startsWith('Pemasukan') &&
              t.status === 'Berhasil'
          )
          .reduce(
            (sum, t) => sum + t.amount,
            0
          );

      const totalExpense =
        financeExpenses
          .filter(
            (t) => t.type === 'Pengeluaran'
          )
          .reduce(
            (sum, t) => sum + t.amount,
            0
          );

      const netBalance =
        totalIncome - totalExpense;

      const targetPilgrims =
        filteredPilgrims.length > 0
          ? filteredPilgrims
          : pilgrims;

      const masterSheets = [
        {
          sheetName: 'Ringkasan Dashboard',
          title:
            'Ringkasan Eksekutif & Master Index System',
          data: [
            {
              'Modul / Menu': 'Data Jamaah',
              'Total Data': `${targetPilgrims.length} Jamaah`,
              'Catatan Status':
                'Data Master Jamaah',
            },
            {
              'Modul / Menu':
                'Data Kloter & Group',
              'Total Data': `${groups.length} Kloter`,
              'Catatan Status':
                'Rombongan Pembimbing',
            },
            {
              'Modul / Menu':
                'Buku Kas Keuangan',
              'Total Data': `${financeTransactions.length} Transaksi`,
              'Catatan Status':
                `Net Saldo: Rp ${netBalance.toLocaleString(
                  'id-ID'
                )}`,
            },
            {
              'Modul / Menu':
                'Room Meet Hotel',
              'Total Data': `${rooms.length} Kamar`,
              'Catatan Status':
                'Makkah & Madinah Hotels',
            },
            {
              'Modul / Menu':
                'Stok & Inventaris Staff',
              'Total Data': `${staffStocks.length} Items`,
              'Catatan Status':
                'Perlengkapan Staff & Gudang',
            },
            {
              'Modul / Menu':
                'SDM Mutawif & TL',
              'Total Data': `${
                tourLeaders.length +
                mutawifs.length
              } SDM`,
              'Catatan Status':
                'Tour Leader & Mutawif Local',
            },
            {
              'Modul / Menu':
                'Itinerary & Agenda',
              'Total Data': `${schedules.length} Kegiatan`,
              'Catatan Status':
                'Jadwal Rangkaian Ibadah',
            },
            {
              'Modul / Menu':
                'Log Darurat SOS',
              'Total Data': `${emergencies.length} Insiden`,
              'Catatan Status':
                'Riwayat Laporan Darurat',
            },
          ],
        },
        {
          sheetName: 'Data Jamaah',
          title:
            'Master Data Jamaah Umrah - DNA Tour',
          data: targetPilgrims.map((p) => ({
            'ID Jamaah': p.id,
            'Nama Lengkap': p.name,
            'NIK': p.ktp || '-',
            'No. Paspor': p.passport || '-',
            'No. Visa': p.visaNumber || '-',
            'Kewarganegaraan': p.nationality || 'Indonesia',
            'Jenis Kelamin': p.gender || '-',
            'Usia': p.age ?? '-',
            'No. HP': p.phone || '-',
            'Kontak Darurat': p.emergencyContact || '-',
            'Paket Umrah': p.umrahPackage || '-',
            'Kloter / Group': p.group || '-',
            'Tour Leader': p.tourLeader || '-',
            'Mutawif Local': (() => { const grp = groups.find(g => g.backendId === p.kloterId || g.id === p.kloterId || g.name === p.group); return grp?.mutawifs?.length ? grp.mutawifs.map(m => m.name).join(', ') : (p.mutawifLocal || '-'); })(),
            'Hotel Makkah': p.hotelMakkah || p.hotel || '-',
            'Hotel Madinah': p.hotelMadinah || '-',
            'Tgl. Keberangkatan': formatIndoDate(p.departureDate),
            'Tgl. Kepulangan': formatIndoDate(p.returnDate),
          })),
        },
      ];

      await exportMasterWorkbookToExcel(
        masterSheets,
        `Master_Jamaah_DNA_Tour_${todayStr}`,
        'LAPORAN MASTER REKAPITULASI JAMAAH - DNA TOUR'
      );

      toast(
        'Export Master Excel jamaah berhasil diunduh!',
        'success'
      );
    } catch {
      toast(
        'Gagal melakukan export Excel.',
        'error'
      );
    }
  };

  // ==========================================
  // FILTER CONTROL
  // ==========================================

  const hasActiveFilters =
    filterPackage ||
    filterGroup ||
    filterDepartureDate ||
    filterPassportStatus;

  const resetFilters = () => {
    setFilterPackage('');
    setFilterGroup('');
    setFilterDepartureDate('');
    setFilterPassportStatus('');
  };

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPilgrims.length /
        itemsPerPage
    )
  );

  const paginatedData =
    filteredPilgrims.slice(
      (currentPage - 1) *
        itemsPerPage,
      currentPage * itemsPerPage
    );

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Jamaah
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Kelola dan pantau informasi data diri serta rincian perjalanan jamaah
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
              Tambah Jamaah
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => {
            setActiveTab('all');
            setCurrentPage(1);
          }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all'
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20'
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  TOTAL JAMAAH TERDAFTAR
                </p>

                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalPilgrims} Jamaah
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Database Jamaah Aktif</span>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            setActiveTab('elderly');
            setCurrentPage(1);
          }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'elderly'
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20'
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  JAMAAH LANSIA (≥60 THN)
                </p>

                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalElderly} Jamaah
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-[#fdf6e7] text-[#c27803] flex items-center justify-center shrink-0 shadow-2xs">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-[#b45309]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Pendampingan Prioritas</span>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            setActiveTab('unassigned');
            setCurrentPage(1);
          }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'unassigned'
              ? 'border-rose-600 ring-2 ring-rose-600/20 bg-rose-50/20'
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  BELUM ADA KLOTER
                </p>

                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalUnassigned} Jamaah
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Perlu Plotting Kloter</span>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            setActiveTab('all');
            setCurrentPage(1);
          }}
          className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  PASPOR TERVERIFIKASI
                </p>

                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900">
                  {totalPassportReady} Dokumen
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Dokumen Valid Siap Visa</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-2xs">
        <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-2.5 pb-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-0">
            {[
              ['all', 'Semua Jamaah', totalPilgrims],
              ['male', 'Laki-laki', totalMale],
              ['female', 'Perempuan', totalFemale],
              ['elderly', 'Lansia (≥60)', totalElderly],
              ['unassigned', 'Belum Ada Kloter', totalUnassigned],
            ].map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(
                    key as
                      | 'all'
                      | 'male'
                      | 'female'
                      | 'elderly'
                      | 'unassigned'
                  );
                  setCurrentPage(1);
                }}
                className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                  activeTab === key
                    ? 'font-bold text-emerald-800'
                    : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
                }`}
              >
                <span>{label}</span>

                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                    activeTab === key
                      ? 'bg-emerald-100 text-emerald-800 scale-105'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
                  }`}
                >
                  {count}
                </span>

                {activeTab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

            <Input
              placeholder="Cari nama, ID, paspor, HP, kloter..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9.5 pr-8 h-9.5 rounded-xl border-gray-200 bg-white text-xs sm:text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
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
                className="text-xs h-9 font-semibold text-red-600 border-red-200 hover:bg-red-50 px-3.5 rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Hapus Terpilih ({selectedIds.size})
              </Button>
            )}

            <Button
              variant={
                showFilters || hasActiveFilters
                  ? 'secondary'
                  : 'outline'
              }
              className={`text-xs h-9 font-semibold px-3.5 rounded-xl ${
                showFilters || hasActiveFilters
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() =>
                setShowFilters(!showFilters)
              }
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filter Lanjutan

              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 ml-1.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Paket Umrah
              </label>

              <select
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterPackage}
                onChange={(e) => {
                  setFilterPackage(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Semua Paket</option>
                <option value="Yamani">Yamani</option>
                <option value="Raudhah">Raudhah</option>
                <option value="Multazam">Multazam</option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Kloter Rombongan
              </label>

              <select
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterGroup}
                onChange={(e) => {
                  setFilterGroup(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">
                  Semua Kloter
                </option>

                {groups.map((g) => (
                  <option
                    key={g.id}
                    value={g.name}
                  >
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-40">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Status Paspor
              </label>

              <select
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterPassportStatus}
                onChange={(e) => {
                  setFilterPassportStatus(
                    e.target.value
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="">
                  Semua Status
                </option>
                <option value="ready">
                  Paspor Siap
                </option>
                <option value="pending">
                  Belum Ada Paspor
                </option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Tanggal Keberangkatan
              </label>

              <select
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterDepartureDate}
                onChange={(e) => {
                  setFilterDepartureDate(
                    e.target.value
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="">
                  Semua Tanggal
                </option>

                {uniqueDepartureDates.map(
                  (d) => (
                    <option
                      key={d}
                      value={d}
                    >
                      {formatIndoDate(d)}
                    </option>
                  )
                )}
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                className="h-9 text-xs text-gray-500 hover:text-gray-900"
                onClick={resetFilters}
              >
                Reset Filter
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-[1150px]">
            <TableHeader className="bg-gray-50/70 border-b border-gray-100">
              <TableRow className="border-b-gray-100 hover:bg-transparent">
                <TableHead className="w-12 text-center pl-4 py-3.5 whitespace-nowrap">
                  <Checkbox
                    checked={
                      selectedIds.size > 0 &&
                      selectedIds.size ===
                        filteredPilgrims.length
                    }
                    onCheckedChange={
                      toggleSelectAll
                    }
                    aria-label="Pilih semua"
                  />
                </TableHead>

                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[100px]">
                  ID JAMAAH
                </TableHead>

                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[260px]">
                  PROFIL JAMAAH
                </TableHead>

                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[180px]">
                  TGL KEBERANGKATAN
                </TableHead>

                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[180px]">
                  KLOTER ROMBONGAN
                </TableHead>

                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[200px]">
                  PAKET UMRAH
                </TableHead>

                <TableHead className="text-right pr-6 text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[130px]">
                  AKSI
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody
              key={activeTab}
              className="divide-y divide-gray-100 animate-fade-in"
            >
              {isLoadingJamaah &&
                pilgrims.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-56 text-center"
                    >
                      <div className="text-sm text-gray-500">
                        Memuat data jamaah...
                      </div>
                    </TableCell>
                  </TableRow>
                )}

              {!isLoadingJamaah &&
                paginatedData.map(
                  (pilgrim) => {
                    const isElderly =
                      (pilgrim.age ||
                        0) >= 60;

                    const formatDisplayDate =
                      (
                        dateStr?: string
                      ) => {
                        if (!dateStr)
                          return '-';

                        try {
                          const d =
                            new Date(
                              dateStr
                            );

                          if (
                            isNaN(
                              d.getTime()
                            )
                          ) {
                            return dateStr;
                          }

                          return d.toLocaleDateString(
                            'id-ID',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          );
                        } catch {
                          return dateStr;
                        }
                      };

                    const depFormatted =
                      formatDisplayDate(
                        pilgrim.departureDate
                      );

                    const retFormatted =
                      formatDisplayDate(
                        pilgrim.returnDate
                      );

                    return (
                      <TableRow
                        key={pilgrim.id}
                        className={`cursor-pointer transition-colors hover:bg-gray-50/60 ${
                          selectedIds.has(
                            pilgrim.id
                          )
                            ? 'bg-[#fcedea]/30'
                            : ''
                        }`}
                        onClick={(e) => {
                          if (
                            (
                              e.target as HTMLElement
                            ).closest(
                              'input[type="checkbox"], button'
                            )
                          ) {
                            return;
                          }

                          openDetailModal(
                            pilgrim
                          );
                        }}
                      >
                        <TableCell className="pl-4 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedIds.has(
                              pilgrim.id
                            )}
                            onCheckedChange={() =>
                              toggleSelect(
                                pilgrim.id
                              )
                            }
                            aria-label={`Pilih ${pilgrim.name}`}
                          />
                        </TableCell>

                        <TableCell className="py-4 whitespace-nowrap">
                          <div className="font-bold text-sm tracking-tight text-[#480c0c] whitespace-nowrap">
                            {pilgrim.id}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#fcedea] text-[#782820] font-bold text-xs flex items-center justify-center shrink-0 border border-[#f5d0cb]">
                              {pilgrim.name
                                .split(' ')
                                .map(
                                  (n) =>
                                    n[0]
                                )
                                .join('')
                                .substring(
                                  0,
                                  2
                                )
                                .toUpperCase()}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="font-bold text-sm text-gray-900 whitespace-nowrap">
                                  {pilgrim.name}
                                </span>

                                {isElderly && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fdf6e7] text-[#b45309] border border-[#fbe8bf] shrink-0 whitespace-nowrap">
                                    Lansia
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500 font-normal mt-0.5 whitespace-nowrap">
                                <span>
                                  {pilgrim.gender}{' '}
                                  &bull;{' '}
                                  {pilgrim.age ||
                                    45}{' '}
                                  thn
                                </span>

                                {pilgrim.phone && (
                                  <span className="text-gray-400 whitespace-nowrap">
                                    &bull;{' '}
                                    {
                                      pilgrim.phone
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                              <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                              <span>
                                {depFormatted}
                              </span>
                            </div>

                            {pilgrim.returnDate && (
                              <div className="text-[11px] text-gray-400 pl-5.5 font-normal whitespace-nowrap">
                                Pulang:{' '}
                                {
                                  retFormatted
                                }
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 whitespace-nowrap">
                          {pilgrim.group &&
                          pilgrim.group !==
                            '-' &&
                          pilgrim.group !==
                            'Belum ada kloter' ? (
                            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-800 bg-white border border-gray-200/90 shadow-2xs whitespace-nowrap shrink-0 tracking-wide uppercase">
                              {pilgrim.group}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 whitespace-nowrap shrink-0">
                              Belum Ada Kloter
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-[#782820] bg-[#fcedea] border border-[#f5d0cb] shadow-2xs tracking-wide uppercase whitespace-nowrap shrink-0">
                            {pilgrim.umrahPackage ||
                              'Yamani'}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0"
                              title="Lihat Data Diri"
                              onClick={() =>
                                openDetailModal(
                                  pilgrim
                                )
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0"
                              title="Edit Jamaah"
                              onClick={() =>
                                openEditModal(
                                  pilgrim
                                )
                              }
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors shrink-0"
                              title="Hapus Jamaah"
                              onClick={() => {
                                setSelectedIds(
                                  new Set([
                                    pilgrim.id,
                                  ])
                                );

                                setIsDeleteDialogOpen(
                                  true
                                );
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}

              {!isLoadingJamaah &&
                filteredPilgrims.length ===
                  0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-56 text-center"
                    >
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-200">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>

                        <p className="font-semibold text-gray-900">
                          Tidak ada data jamaah ditemukan
                        </p>

                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                          Ubah filter pencarian atau gunakan tombol tambah untuk mendaftarkan jamaah baru.
                        </p>

                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 text-xs rounded-xl"
                            onClick={
                              resetFilters
                            }
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

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            Menampilkan{' '}
            <span className="font-semibold text-gray-900">
              {filteredPilgrims.length > 0
                ? (currentPage - 1) *
                    itemsPerPage +
                  1
                : 0}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(
                currentPage *
                  itemsPerPage,
                filteredPilgrims.length
              )}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-gray-900">
              {filteredPilgrims.length}
            </span>{' '}
            jamaah
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-lg border-gray-200 text-gray-700 flex-1 sm:flex-none cursor-pointer"
              onClick={() =>
                setCurrentPage((p) =>
                  Math.max(1, p - 1)
                )
              }
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>

            <span className="text-xs font-medium text-gray-600 px-2">
              Hal {currentPage} /{' '}
              {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-lg border-gray-200 text-gray-700 flex-1 sm:flex-none cursor-pointer"
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(
                    totalPages,
                    p + 1
                  )
                )
              }
              disabled={
                currentPage === totalPages
              }
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal */}
      <Dialog
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
      >
        <DialogContent
          hideClose
          className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar"
        >
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {selectedPilgrim ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setModalTab('data-diri')
                    }
                    className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                      modalTab ===
                      'data-diri'
                        ? 'bg-[#00a859] text-white shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Data Diri Jamaah
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setModalTab('form-edit')
                    }
                    className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                      modalTab ===
                      'form-edit'
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
                  Tambah Jamaah
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setIsFormModalOpen(false)
              }
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DETAIL */}
          {modalTab ===
            'data-diri' &&
            (() => {
              const activePilgrim =
                selectedPilgrim ||
                (formData.name
                  ? (formData as Pilgrim)
                  : pilgrims[0]);

              const matchedGroup = groups.find(
                (g) =>
                  g.backendId === activePilgrim?.kloterId ||
                  g.id === activePilgrim?.kloterId ||
                  g.name === activePilgrim?.group
              );

              const formatDetailDate = (
                dateStr?: string
              ) => {
                if (!dateStr) return '-';

                try {
                  const d =
                    new Date(dateStr);

                  if (
                    isNaN(
                      d.getTime()
                    )
                  ) {
                    return dateStr;
                  }

                  const months = [
                    'Januari',
                    'Februari',
                    'Maret',
                    'April',
                    'Mei',
                    'Juni',
                    'Juli',
                    'Agustus',
                    'September',
                    'Oktober',
                    'November',
                    'Desember',
                  ];

                  return `${d.getDate()} ${
                    months[d.getMonth()]
                  } ${d.getFullYear()}`;
                } catch {
                  return dateStr;
                }
              };

              const genderFormatted =
                activePilgrim?.gender ===
                'Perempuan'
                  ? 'Wanita (Female)'
                  : 'Pria (Male)';

              const birthDateFormatted =
                activePilgrim?.birthDate
                  ? `${formatDetailDate(
                      activePilgrim.birthDate
                    )} (${activePilgrim.age || 0} Thn)`
                  : '-';

              const passportFormatted =
                activePilgrim?.passport
                  ? activePilgrim.passport
                  : '-';

              const visaFormatted =
                activePilgrim?.visaNumber ||
                '-';

              const nationalityFormatted =
                activePilgrim?.nationality ||
                'Indonesia';

              const phoneFormatted =
                activePilgrim?.phone ||
                '-';

              const emergencyFormatted =
                activePilgrim?.emergencyContact ||
                '-';

              const groupFormatted =
                activePilgrim?.group ||
                '-';

              let activeKloterId = activePilgrim?.kloterId;
              if (!activeKloterId && activePilgrim?.group) {
                const foundG = groups.find(
                  (g) => g.name === activePilgrim.group || g.id === activePilgrim.group
                );
                activeKloterId = foundG?.backendId || foundG?.id || null;
              }
              const activePrimaryTL = activeKloterId
                ? getPrimaryTourLeader(activeKloterId, tourLeaders)
                : null;
              const tlFormatted = activePrimaryTL
                ? activePrimaryTL.name
                : '-';

              const mutawifFormatted =
                matchedGroup?.mutawifs?.length
                  ? matchedGroup.mutawifs.map(m => m.name).join(', ')
                  : activePilgrim?.mutawifLocal || '-';

              const packageFormatted =
                activePilgrim?.umrahPackage ||
                '-';

              const hotelFormatted =
                activePilgrim?.hotelMakkah ||
                activePilgrim?.hotel ||
                '-';

              const depFormatted =
                activePilgrim?.departureDate
                  ? formatDetailDate(
                      activePilgrim.departureDate
                    )
                  : '-';

              const retFormatted =
                activePilgrim?.returnDate
                  ? formatDetailDate(
                      activePilgrim.returnDate
                    )
                  : '-';

              return (
                <div className="space-y-7 animate-fade-in">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                      Informasi Pribadi
                    </h2>

                    <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                      {[
                        [
                          <CreditCard className="w-4 h-4 text-[#782820] shrink-0" />,
                          'ID Jamaah',
                          activePilgrim?.id ||
                            '-',
                        ],
                        [
                          <User className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Nama Lengkap',
                          activePilgrim?.name ||
                            '-',
                        ],
                        [
                          <BookOpen className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Nomor Paspor',
                          passportFormatted,
                        ],
                        [
                          <FileCheck className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Nomor Visa Umrah',
                          visaFormatted,
                        ],
                        [
                          <Flag className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Kewarganegaraan',
                          nationalityFormatted,
                        ],
                        [
                          <Users className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Jenis Kelamin',
                          genderFormatted,
                        ],
                        [
                          <Calendar className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Tanggal Lahir',
                          birthDateFormatted,
                        ],
                        [
                          <Phone className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Nomor Telepon',
                          phoneFormatted,
                        ],
                        [
                          <AlertCircle className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Kontak Darurat',
                          emergencyFormatted,
                        ],
                      ].map(
                        ([icon, label, value]) => (
                          <div
                            key={String(
                              label
                            )}
                            className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6"
                          >
                            <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                              {icon}
                              <span>
                                {label}
                              </span>
                            </div>

                            <span className="font-bold text-gray-900 text-sm text-right">
                              {value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                      Rincian Perjalanan
                    </h2>

                    <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                      {[
                        [
                          <Users className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Kloter Saat Ini',
                          groupFormatted,
                        ],
                        [
                          <UserCheck className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Pembimbing (Tour Leader)',
                          tlFormatted,
                        ],
                        [
                          <User className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Mutawif Lokal',
                          mutawifFormatted,
                        ],
                        [
                          <Package className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Paket Umrah',
                          packageFormatted,
                        ],
                        [
                          <Building2 className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Hotel Makkah',
                          hotelFormatted,
                        ],
                        [
                          <PlaneTakeoff className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Tanggal Keberangkatan',
                          depFormatted,
                        ],
                        [
                          <PlaneLanding className="w-4 h-4 text-[#782820] shrink-0" />,
                          'Tanggal Kepulangan',
                          retFormatted,
                        ],
                      ].map(
                        ([icon, label, value]) => (
                          <div
                            key={String(
                              label
                            )}
                            className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6"
                          >
                            <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                              {icon}
                              <span>
                                {label}
                              </span>
                            </div>

                            <span className="font-bold text-gray-900 text-sm text-right">
                              {value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setIsFormModalOpen(false)
                      }
                      className="rounded-xl h-10 px-6 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer shadow-2xs"
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              );
            })()}

          {/* FORM */}
          {modalTab ===
            'form-edit' && (
            <div className="space-y-6">
              {/* Informasi Pribadi */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    1
                  </div>

                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    INFORMASI PRIBADI
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      ID JAMAAH *
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.id ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id: e.target.value,
                          })
                        }
                        placeholder="Cth. JAMAAH-001"
                        maxLength={10}
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                          formData.id
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* Nama */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NAMA LENGKAP *
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.name ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Cth. H. Ahmad Zaki Al-Farizi"
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                          formData.name
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* NIK */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NIK *
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.ktp ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ktp: e.target.value,
                          })
                        }
                        placeholder="Cth. 3271041405780001"
                        maxLength={16}
                        inputMode="numeric"
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                          formData.ktp
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* Passport */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NOMOR PASPOR
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.passport ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passport:
                              e.target.value,
                          })
                        }
                        placeholder="Cth. X-99821014"
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                          formData.passport
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 uppercase focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* Visa */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NOMOR VISA UMRAH
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.visaNumber ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            visaNumber:
                              e.target.value,
                          })
                        }
                        placeholder="Cth. VSA-2026-99210-SA"
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                          formData.visaNumber
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* Nationality */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KEWARGANEGARAAN
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.nationality ||
                          'Indonesia'
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nationality:
                              e.target.value,
                          })
                        }
                        placeholder="Indonesia"
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                          formData.nationality
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      JENIS KELAMIN
                    </label>

                    <div className="sm:col-span-8">
                      <select
                        value={
                          formData.gender ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gender:
                              e.target.value,
                          })
                        }
                        className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${
                          formData.gender
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                      >
                        <option value="">
                          Pilih Jenis Kelamin
                        </option>
                        <option value="Laki-laki">
                          Laki-laki
                        </option>
                        <option value="Perempuan">
                          Perempuan
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Birth date */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      TANGGAL LAHIR
                    </label>

                    <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <Input
                          type="date"
                          value={
                            formData.birthDate ||
                            ''
                          }
                          onChange={(e) => {
                            const bDate =
                              e.target.value;

                            let computedAge =
                              formData.age;

                            if (bDate) {
                              const birth =
                                new Date(
                                  bDate
                                );

                              const today =
                                new Date();

                              let age =
                                today.getFullYear() -
                                birth.getFullYear();

                              const monthDiff =
                                today.getMonth() -
                                birth.getMonth();

                              if (
                                monthDiff < 0 ||
                                (
                                  monthDiff ===
                                    0 &&
                                  today.getDate() <
                                    birth.getDate()
                                )
                              ) {
                                age--;
                              }

                              computedAge =
                                age;
                            }

                            setFormData({
                              ...formData,
                              birthDate:
                                bDate,
                              age:
                                computedAge,
                            });
                          }}
                          className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                            formData.birthDate
                              ? 'font-bold text-gray-900'
                              : 'font-normal text-gray-400'
                          } px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                        />
                      </div>

                      <div className="sm:col-span-5 flex items-center gap-2">
                        <Input
                          type="number"
                          value={
                            formData.age !==
                              undefined &&
                            formData.age !==
                              0
                              ? formData.age
                              : ''
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              age: Number(
                                e.target.value
                              ),
                            })
                          }
                          placeholder="Usia (Thn)"
                          className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                            formData.age
                              ? 'font-bold text-gray-900'
                              : 'font-normal text-gray-400'
                          } placeholder:text-gray-400 placeholder:font-normal px-4 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                        />

                        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                          Tahun
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NOMOR TELEPON
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.phone ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Cth. +62 812-3456-7890"
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                          formData.phone
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* Emergency */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KONTAK DARURAT
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.emergencyContact ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact:
                              e.target.value,
                          })
                        }
                        placeholder="Cth. Keluarga Jamaah (+62 811-9988-7766)"
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${
                          formData.emergencyContact
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Perjalanan */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    2
                  </div>

                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    RINCIAN PERJALANAN
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Kloter */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KLOTER SAAT INI
                    </label>

                    <div className="sm:col-span-8">
                      <select
                        value={formData.kloterId || ''}
                        onChange={(e) => {
                          const selectedKloterId = e.target.value;

                          const foundGrp = groups.find(
                            (g) => g.backendId === selectedKloterId || g.id === selectedKloterId
                          );

                          const targetId = selectedKloterId || foundGrp?.backendId || foundGrp?.id || '';
                          const primaryTL = targetId ? getPrimaryTourLeader(targetId, tourLeaders) : null;

                          setFormData({
                            ...formData,
                            kloterId: selectedKloterId || null,
                            group: foundGrp?.name || '',
                            tourLeader: primaryTL ? primaryTL.name : '',
                            mutawifLocal:
                              foundGrp?.mutawifs?.length ? foundGrp.mutawifs.map(m => m.name).join(', ') : formData.mutawifLocal,
                          });
                        }}
                        className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${
                          formData.kloterId
                            ? 'font-bold text-gray-900'
                            : 'font-normal text-gray-400'
                        } focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                      >
                        <option value="">
                          -- Pilih Kloter Keberangkatan --
                        </option>

                        {groups.map((g) => (
                          <option
                            key={g.backendId || g.id}
                            value={g.backendId || ''}
                          >
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tour Leader */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      TOUR LEADER
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.tourLeader ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tourLeader:
                              e.target.value,
                          })
                        }
                        placeholder="Cth. Ust. H. Muhammad Ridwan"
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* Mutawif */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      MUTAWIF LOKAL
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.mutawifLocal ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mutawifLocal:
                              e.target.value,
                          })
                        }
                        placeholder="Cth. Syeikh Abdullah"
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* Package */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      PAKET UMRAH
                    </label>

                    <div className="sm:col-span-8">
                      <select
                        value={
                          formData.umrahPackage ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            umrahPackage:
                              e.target.value,
                          })
                        }
                        className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                      >
                        <option value="">
                          Pilih Paket Umrah
                        </option>

                        {[
                          'Multazam',
                          'Raudhah',
                          'Yamani',
                          'VIP 9 Hari',
                          'Reguler 12 Hari',
                          'Reguler 9 Hari',
                        ].map((pkg) => (
                          <option
                            key={pkg}
                            value={pkg}
                          >
                            {pkg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Hotel Makkah */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      HOTEL MAKKAH
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.hotelMakkah ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hotelMakkah:
                              e.target.value,
                          })
                        }
                        placeholder="Cth. Swissôtel Al Maqam Makkah"
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* Hotel Madinah */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      HOTEL MADINAH
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        value={
                          formData.hotelMadinah ||
                          ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hotelMadinah:
                              e.target.value,
                          })
                        }
                        placeholder="Cth. Anwar Al Madinah Movenpick"
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* Departure */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      TANGGAL KEBERANGKATAN
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        type="date"
                        value={
                          formData.departureDate ||
                          ''
                        }
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            departureDate:
                              e.target.value,
                          });

                          setModifiedDates(
                            (prev) => ({
                              ...prev,
                              departureDate:
                                true,
                            })
                          );
                        }}
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* Return */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      TANGGAL KEPULANGAN
                    </label>

                    <div className="sm:col-span-8">
                      <Input
                        type="date"
                        value={
                          formData.returnDate ||
                          ''
                        }
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            returnDate:
                              e.target.value,
                          });

                          setModifiedDates(
                            (prev) => ({
                              ...prev,
                              returnDate:
                                true,
                            })
                          );
                        }}
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() =>
                    setIsFormModalOpen(false)
                  }
                  className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
                >
                  Batal
                </Button>

                <Button
                  onClick={savePilgrim}
                  disabled={isLoadingJamaah}
                  className="h-12 rounded-2xl px-8 bg-[#00a859] hover:bg-[#009b50] text-white font-bold text-base shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isLoadingJamaah
                    ? 'Menyimpan...'
                    : selectedPilgrim
                      ? 'Simpan Perubahan'
                      : 'Simpan Data Jamaah'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() =>
          setIsDeleteDialogOpen(false)
        }
        onConfirm={confirmDelete}
        itemCount={selectedIds.size}
      />
    </div>
  );
}