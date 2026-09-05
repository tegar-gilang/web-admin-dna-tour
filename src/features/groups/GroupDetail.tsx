import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, UserPlus, BedDouble, MapPin, Briefcase, 
  AlertTriangle, Download, Search, CheckCircle2, 
  Clock, Edit2, ShieldAlert, Phone, Building2, Calendar, FileText,
  Trash2, ExternalLink, Printer, Plus, X, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDeleteButton';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useStore, Group, Pilgrim, RoomItem, RoomCategory, RoomOccupant } from '@/core/store';
import { exportToExcel } from '@/lib/export';
import { exportRoomListToPdf } from '@/lib/exportPdf';
import { toast } from '@/lib/toast';

export default function GroupDetail() {

// ==========================================
// FITUR: GROUPS
// Komponen utama untuk fitur GROUPS
// ==========================================

  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const { 
    groups, 
    updateGroup, 
    pilgrims, 
    updatePilgrim, 
    tourLeaders, 
    mutawifs, 
    schedules, 
    emergencies, 
    rooms, 
    addRoom,
    updateRoom,
    deleteRoom,
    addOccupantToRoom,
    removeOccupantFromRoom,
    updateOccupantInRoom
  } = useStore();

  // Find the group by ID or by name/kloter
  const group = groups.find(g => g.id === groupId || g.name === groupId || g.kloter === groupId);

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'jamaah' | 'kamar' | 'petugas' | 'jadwal' | 'darurat'>('ringkasan');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPilgrimModalOpen, setIsAddPilgrimModalOpen] = useState(false);
  const [pilgrimSearchTerm, setPilgrimSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Group>>({});

  // Room Meet States inside Kloter
  const [selectedHotelLocation, setSelectedHotelLocation] = useState<'Makkah' | 'Madinah'>("Makkah");
  const [makkahHotelName, setMakkahHotelName] = useState<string>("Swissôtel Al Maqam Makkah");
  const [madinahHotelName, setMadinahHotelName] = useState<string>("Anwar Al Madinah Movenpick");
  const [periodTitle, setPeriodTitle] = useState<string>("JULI 2026");

  // Room Modals
  const [isAddRoomOpen, setIsAddRoomOpen] = useState<boolean>(false);
  const [newRoomCategory, setNewRoomCategory] = useState<RoomCategory>('DOUBLE');
  const [newRoomNumber, setNewRoomNumber] = useState<string>('');

  const [isAddOccupantOpen, setIsAddOccupantOpen] = useState<boolean>(false);
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  const [selectedPilgrimId, setSelectedPilgrimId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<'MR' | 'MRS' | 'MISS' | 'MSTR'>('MR');
  const [customName, setCustomName] = useState<string>('');
  const [customAge, setCustomAge] = useState<string>('');

  const [isEditOccupantOpen, setIsEditOccupantOpen] = useState<boolean>(false);
  const [editingRoomId, setEditingRoomId] = useState<string>('');
  const [editingOccupant, setEditingOccupant] = useState<RoomOccupant | null>(null);

  const [isEditRoomNoOpen, setIsEditRoomNoOpen] = useState<boolean>(false);
  const [editingRoomNoId, setEditingRoomNoId] = useState<string>('');
  const [editingRoomNoVal, setEditingRoomNoVal] = useState<string>('');

  if (!group) {
    return (
      <div className="p-8 text-center space-y-4 bg-white rounded-2xl border border-gray-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Kloter Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500">Data kloter dengan ID "{groupId}" tidak ditemukan di sistem.</p>
        <Button onClick={() => navigate('/groups')} variant="outline" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Kloter
        </Button>
      </div>
    );
  }

  // Related Data for this Kloter
  const groupPilgrims = pilgrims.filter(p => p.group === group.name || p.group === group.kloter || p.group === group.id);
  const groupTourLeaders = tourLeaders.filter(t => t.group === group.name || t.group === group.kloter);
  const groupMutawifs = mutawifs.filter(m => m.group === group.name || m.group === group.kloter);
  const groupEmergencies = emergencies.filter(e => e.group === group.name || e.group === group.kloter);

  // Demographics & Paspor Ready
  const totalLaki = groupPilgrims.filter(p => p.gender === 'L' || p.gender === 'Laki-laki').length;
  const totalPerempuan = groupPilgrims.filter(p => p.gender === 'P' || p.gender === 'Perempuan').length;
  const totalLansia = groupPilgrims.filter(p => (p.age || 0) >= 60).length;
  const totalPasporLengkap = groupPilgrims.filter(p => p.passport && p.passport.length > 3).length;

  // Room Meet calculation for this Kloter
  const currentHotelName = selectedHotelLocation === 'Makkah' ? makkahHotelName : madinahHotelName;
  const setCurrentHotelName = (val: string) => {
    if (selectedHotelLocation === 'Makkah') setMakkahHotelName(val);
    else setMadinahHotelName(val);
  };

  // Filtered Rooms for this specific Kloter & Location
  const kloterRooms = rooms.filter(r => 
    (r.kloter === group.name || r.kloter === group.kloter) && 
    r.hotelLocation === selectedHotelLocation
  );

  // All rooms across location for stats
  const allKloterRooms = rooms.filter(r => r.kloter === group.name || r.kloter === group.kloter);

  // Unassigned pilgrims in this group for selected location
  const assignedNamesLocation = new Set(
    kloterRooms.flatMap(r => r.occupants.map(o => o.name.toLowerCase().trim()))
  );
  const unassignedPilgrimsLocation = groupPilgrims.filter(
    p => !assignedNamesLocation.has(p.name.toLowerCase().trim())
  );

  // Room Category Counts
  const roomCategoryCounts = {
    DOUBLE: kloterRooms.filter(r => r.category === 'DOUBLE').length,
    TRIPLE: kloterRooms.filter(r => r.category === 'TRIPLE').length,
    QUAD: kloterRooms.filter(r => r.category === 'QUAD').length,
    QUINT: kloterRooms.filter(r => r.category === 'QUINT').length,
  };

  // Capacity calculations
  const totalOccupantsCount = kloterRooms.reduce((acc, r) => acc + r.occupants.length, 0);
  const totalCapacity = kloterRooms.reduce((acc, r) => {
    const cap = r.category === 'DOUBLE' ? 2 : r.category === 'TRIPLE' ? 3 : r.category === 'QUAD' ? 4 : 5;
    return acc + cap;
  }, 0);

  const getNextSequentialNo = () => {
    let count = 0;
    kloterRooms.forEach(r => {
      count += r.occupants.length;
    });
    return count + 1;
  };

  // Handlers for Room Allocation
  const handleCreateRoom = () => {
    const existingCount = kloterRooms.filter(r => r.category === newRoomCategory).length;
    const roomLabel = `${newRoomCategory} ${existingCount + 1}`;

    const newRoom: RoomItem = {
      id: `RM-${Date.now()}`,
      category: newRoomCategory,
      roomLabel,
      roomNumber: newRoomNumber,
      kloter: group.name,
      hotelLocation: selectedHotelLocation,
      hotelName: currentHotelName,
      occupants: []
    };

    addRoom(newRoom);
    setIsAddRoomOpen(false);
    setNewRoomNumber('');
    toast(`Kamar ${roomLabel} berhasil dibuat untuk ${group.name}.`, "success");
  };

  const handleAddOccupant = () => {
    if (!targetRoomId) return;

    let title: 'MR' | 'MRS' | 'MISS' | 'MSTR' = customTitle;
    let name = customName.trim().toUpperCase();
    let age: number | string = customAge;

    if (selectedPilgrimId) {
      const p = pilgrims.find(item => item.id === selectedPilgrimId);
      if (p) {
        title = (p.gender === 'L' || p.gender === 'Laki-laki') ? 'MR' : 'MRS';
        name = p.name.toUpperCase();
        age = p.age || '';
      }
    }

    if (!name) {
      toast("Nama penghuni wajib diisi.", "error");
      return;
    }

    const nextNo = getNextSequentialNo();
    const newOccupant: RoomOccupant = {
      id: `OC-${Date.now()}`,
      no: nextNo,
      title,
      name,
      age: age || ''
    };

    addOccupantToRoom(targetRoomId, newOccupant);
    setIsAddOccupantOpen(false);
    setSelectedPilgrimId('');
    setCustomName('');
    setCustomAge('');
    toast(`Penghuni ${name} berhasil ditambahkan ke kamar.`, "success");
  };

  const handleSaveEditOccupant = () => {
    if (!editingRoomId || !editingOccupant) return;
    updateOccupantInRoom(editingRoomId, editingOccupant.id, editingOccupant);
    setIsEditOccupantOpen(false);
    setEditingOccupant(null);
    toast("Data penghuni berhasil diperbarui.", "success");
  };

  const handleSaveRoomNo = () => {
    if (!editingRoomNoId) return;
    updateRoom(editingRoomNoId, { roomNumber: editingRoomNoVal });
    setIsEditRoomNoOpen(false);
    toast("Nomor kamar hotel berhasil diperbarui.", "success");
  };

  const handleExportRoomListExcel = () => {
    const excelRows: any[] = [];
    kloterRooms.forEach((room) => {
      if (room.occupants.length === 0) {
        excelRows.push({
          'ROOM': room.roomLabel,
          'NO. ROOM': room.roomNumber || '-',
          'NO': '-',
          'TITTLE': '-',
          'NAMA': '(Kamar Kosong)',
          'AGE': '-'
        });
      } else {
        room.occupants.forEach((occ) => {
          excelRows.push({
            'ROOM': room.roomLabel,
            'NO. ROOM': room.roomNumber || '-',
            'NO': occ.no,
            'TITTLE': occ.title,
            'NAMA': occ.name,
            'AGE': occ.age || '-'
          });
        });
      }
    });

    const filename = `Roomlist_${group.name.replace(/\s+/g, '_')}_${selectedHotelLocation}`;
    const headerTitle = `Room List ${periodTitle} - ${currentHotelName.toUpperCase()} (${group.name.toUpperCase()})`;
    exportToExcel(excelRows, filename, headerTitle);
    toast("Room list berhasil diunduh ke Excel!", "success");
  };

  const handleExportRoomListPdf = () => {
    try {
      exportRoomListToPdf({
        kloterName: group.name,
        hotelLocation: selectedHotelLocation,
        hotelName: currentHotelName,
        periodTitle: periodTitle,
        rooms: kloterRooms
      });
      toast("Dokumen PDF Room List berhasil diunduh!", "success");
    } catch (err) {
      console.error(err);
      toast("Gagal mengunduh dokumen PDF.", "error");
    }
  };

  const handleExportKloterExcel = () => {
    const exportData = groupPilgrims.map((p, idx) => ({
      'No': idx + 1,
      'ID Jamaah': p.id,
      'Nama Lengkap': p.name,
      'No. Paspor': p.passport,
      'No. Visa': p.visaNumber || '-',
      'Jenis Kelamin': p.gender,
      'Usia': p.age,
      'No. HP': p.phone,
      'Kontak Darurat': p.emergencyContact || '-',
      'Paket Umrah': p.umrahPackage || '-',
      'Kloter': group.name,
      'Tour Leader': group.tourLeader,
      'Muthawwif': group.mutawif,
      'Hotel Makkah': p.hotelMakkah || p.hotel || '-',
      'Hotel Madinah': p.hotelMadinah || '-'
    }));

    exportToExcel(exportData, `Detail_Kloter_${group.name.replace(/\s+/g, '_')}`, `LAPORAN DETAIL KLOTER - ${group.name.toUpperCase()}`);
    toast('Data kloter berhasil diunduh ke Excel!', 'success');
  };

  const handleSaveEditGroup = () => {
    updateGroup(group.id, editFormData);
    setIsEditModalOpen(false);
    toast('Informasi kloter berhasil diperbarui!', 'success');
  };
  const [genderFilter, setGenderFilter] = useState<'all' | 'L' | 'P' | 'lansia'>('all');

  const filteredGroupPilgrims = groupPilgrims.filter(p => {
    const matchSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.passport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.formId && p.formId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.phone && p.phone.includes(searchTerm));

    if (!matchSearch) return false;
    if (genderFilter === 'L') return p.gender === 'L' || p.gender === 'Laki-laki';
    if (genderFilter === 'P') return p.gender === 'P' || p.gender === 'Perempuan';
    if (genderFilter === 'lansia') return (p.age || 0) >= 60;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Back Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/groups')}
            className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl cursor-pointer font-semibold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Daftar Kloter</span>
          </Button>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{group.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border shadow-2xs ${
                group.status === 'Active' || group.status === 'Aktif'
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                  : group.status === 'Draft'
                  ? 'text-gray-700 bg-gray-100 border-gray-300'
                  : 'text-amber-800 bg-amber-50 border-amber-300'
              }`}>
                {group.status === 'Active' || group.status === 'Aktif' ? 'Aktif' : group.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              ID Kloter: <span className="font-bold text-[#480c0c]">{group.formId || group.id}</span>
              {group.kloter && <span className="ml-2">&bull; Penerbangan: <span className="font-semibold text-gray-700">{group.kloter}</span></span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportKloterExcel}
            className="text-xs h-9.5 font-semibold text-gray-700 bg-white border-gray-200 hover:bg-gray-50 px-3.5 rounded-xl shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Export Excel
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              setEditFormData(group);
              setIsEditModalOpen(true);
            }}
            className="text-xs h-9.5 font-semibold text-gray-700 bg-white border-gray-200 hover:bg-gray-50 px-3.5 rounded-xl shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Edit Kloter
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards (4 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Jamaah */}
        <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL JAMAAH</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900">
                  {groupPilgrims.length} <span className="text-sm font-semibold text-gray-500">Orang</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span>{totalLaki} L &bull; {totalPerempuan} P ({totalLansia} Lansia)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Petugas Kloter */}
        <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PETUGAS KLOTER</p>
                <p className="text-sm sm:text-base font-bold tracking-tight text-gray-900 truncate max-w-[180px]" title={group.tourLeader}>
                  TL: {group.tourLeader || 'Belum ditugaskan'}
                </p>
                <p className="text-xs text-gray-600 truncate max-w-[180px]" title={group.mutawif}>
                  MW: {group.mutawif || 'Belum ditugaskan'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{groupTourLeaders.length + groupMutawifs.length + 2} Staf & Pembimbing</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Room Meet */}
        <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">ROOM MEET</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900">
                  {allKloterRooms.length} <span className="text-sm font-semibold text-gray-500">Kamar Hotel</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center shrink-0">
                <BedDouble className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700">
              <span>{allKloterRooms.reduce((sum, r) => sum + r.occupants.length, 0)} Bed Terisi</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Kesiapan Paspor */}
        <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">KESIAPAN PASPOR</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-emerald-800">
                  {totalPasporLengkap} <span className="text-sm font-semibold text-gray-500">/ {groupPilgrims.length} Valid</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Status Dokumen Terverifikasi</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-2xs">
        <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-3 pb-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-0.5">
            <button 
              onClick={() => setActiveTab('ringkasan')}
              className={`pb-3 px-2 text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ringkasan' 
                  ? 'font-bold border-emerald-600 text-emerald-800' 
                  : 'font-medium border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Ringkasan Info
            </button>
            <button 
              onClick={() => setActiveTab('jamaah')}
              className={`pb-3 px-2 text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'jamaah' 
                  ? 'font-bold border-emerald-600 text-emerald-800' 
                  : 'font-medium border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Daftar Jamaah
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'jamaah' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                {groupPilgrims.length}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('kamar')}
              className={`pb-3 px-2 text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'kamar' 
                  ? 'font-bold border-emerald-600 text-emerald-800' 
                  : 'font-medium border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <BedDouble className="w-4 h-4" />
              Room Meet
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'kamar' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                {allKloterRooms.length}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('petugas')}
              className={`pb-3 px-2 text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'petugas' 
                  ? 'font-bold border-emerald-600 text-emerald-800' 
                  : 'font-medium border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Petugas & Pembimbing
            </button>
            <button 
              onClick={() => setActiveTab('jadwal')}
              className={`pb-3 px-2 text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'jadwal' 
                  ? 'font-bold border-emerald-600 text-emerald-800' 
                  : 'font-medium border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Jadwal Perjalanan
            </button>
            <button 
              onClick={() => setActiveTab('darurat')}
              className={`pb-3 px-2 text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'darurat' 
                  ? 'font-bold border-emerald-600 text-emerald-800' 
                  : 'font-medium border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Log Darurat
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'darurat' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                {groupEmergencies.length}
              </span>
            </button>
          </div>
        </div>
      </Card>

      {/* TAB CONTENT: RINGKASAN INFO */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Identitas Kloter */}
            <Card className="border-gray-200/80 shadow-2xs rounded-2xl p-6 bg-white">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <Building2 className="w-4 h-4 text-emerald-700" /> 
                <span>Informasi & Pengoperasian Kloter</span>
              </h3>
              <div className="divide-y divide-gray-100 mt-2">
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-gray-500 font-medium">Nama Kloter</span>
                  <span className="font-bold text-sm text-gray-900">{group.name}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-gray-500 font-medium">ID Kloter</span>
                  <span className="font-bold text-sm text-[#480c0c]">{group.formId || group.id}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-gray-500 font-medium">Kode Penerbangan / Kloter</span>
                  <span className="font-semibold text-xs text-gray-800 font-mono bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                    {group.kloter || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-gray-500 font-medium">Status Pengoperasian</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border shadow-2xs ${
                    group.status === 'Active' || group.status === 'Aktif'
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                      : group.status === 'Draft'
                      ? 'text-gray-700 bg-gray-100 border-gray-300'
                      : 'text-amber-800 bg-amber-50 border-amber-300'
                  }`}>
                    {group.status === 'Active' || group.status === 'Aktif' ? 'Aktif' : group.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-gray-500 font-medium">Tour Leader (TL)</span>
                  <span className="font-bold text-sm text-gray-900">{group.tourLeader || 'Belum Ditugaskan'}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-gray-500 font-medium">Muthawwif Lokal KSA</span>
                  <span className="font-bold text-sm text-gray-900">{group.mutawif || 'Belum Ditugaskan'}</span>
                </div>
              </div>
            </Card>

            {/* Card 2: Akomodasi Hotel */}
            <Card className="border-gray-200/80 shadow-2xs rounded-2xl p-6 bg-white">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <MapPin className="w-4 h-4 text-emerald-700" /> 
                <span>Akomodasi Hotel Rombongan</span>
              </h3>
              <div className="space-y-3.5 mt-4">
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">HOTEL MAKKAH</p>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {allKloterRooms.filter(r => r.hotelLocation === 'Makkah').length} Kamar
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm mt-1.5">
                    {groupPilgrims[0]?.hotelMakkah || groupPilgrims[0]?.hotel || makkahHotelName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {allKloterRooms.filter(r => r.hotelLocation === 'Makkah').reduce((s, r) => s + r.occupants.length, 0)} Jamaah Telah Dialokasikan
                  </p>
                </div>

                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">HOTEL MADINAH</p>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {allKloterRooms.filter(r => r.hotelLocation === 'Madinah').length} Kamar
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm mt-1.5">
                    {groupPilgrims[0]?.hotelMadinah || madinahHotelName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {allKloterRooms.filter(r => r.hotelLocation === 'Madinah').reduce((s, r) => s + r.occupants.length, 0)} Jamaah Telah Dialokasikan
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Demografi & Paket Breakdown */}
          <Card className="border-gray-200/80 shadow-2xs rounded-2xl p-6 bg-white">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 pb-4 border-b border-gray-100">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Komposisi Jamaah & Paket</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">LAKI-LAKI</p>
                <p className="text-2xl font-bold text-blue-950 mt-1">{totalLaki} <span className="text-xs font-normal text-blue-700">Orang</span></p>
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  {groupPilgrims.length > 0 ? Math.round((totalLaki / groupPilgrims.length) * 100) : 0}% dari total
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
                <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">PEREMPUAN</p>
                <p className="text-2xl font-bold text-rose-950 mt-1">{totalPerempuan} <span className="text-xs font-normal text-rose-700">Orang</span></p>
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {groupPilgrims.length > 0 ? Math.round((totalPerempuan / groupPilgrims.length) * 100) : 0}% dari total
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">LANSIA (&ge; 60 TAHUN)</p>
                <p className="text-2xl font-bold text-amber-950 mt-1">{totalLansia} <span className="text-xs font-normal text-amber-700">Orang</span></p>
                <p className="text-xs text-amber-600 mt-1 font-medium">Perlu perhatian & pendampingan khusus</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: DAFTAR JAMAAH */}
      {activeTab === 'jamaah' && (
        <Card className="border-gray-200/80 shadow-2xs rounded-2xl bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Cari nama, paspor, ID jamaah..." 
                  className="pl-9.5 pr-8 bg-white border-gray-200 text-xs sm:text-sm h-9.5 rounded-xl focus:border-emerald-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              {/* Filter Pills */}
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5 h-9.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setGenderFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    genderFilter === 'all' ? 'bg-[#740A03] text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Semua ({groupPilgrims.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('L')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    genderFilter === 'L' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  L ({totalLaki})
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('P')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    genderFilter === 'P' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  P ({totalPerempuan})
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('lansia')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    genderFilter === 'lansia' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lansia ({totalLansia})
                </button>
              </div>
            </div>

            <Button 
              onClick={() => {
                setPilgrimSearchTerm('');
                setIsAddPilgrimModalOpen(true);
              }} 
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-9.5 px-4 rounded-xl shadow-2xs shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Tambah Jamaah ke Kloter
            </Button>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table className="w-full min-w-[850px]">
                <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                  <TableRow className="border-b-gray-200 hover:bg-transparent">
                    <TableHead className="w-12 text-center text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap">#</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[200px]">NAMA JAMAAH</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[130px]">NO. PASPOR</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[130px]">NO. VISA</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[80px]">GENDER</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[80px]">USIA</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[140px]">NO. TELEPON</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[160px]">PAKET UMRAH</TableHead>
                    <TableHead className="text-right pr-6 text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[90px]">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {filteredGroupPilgrims.map((p, idx) => (
                    <TableRow key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell className="text-center font-bold text-xs text-gray-400 py-4 whitespace-nowrap">{idx + 1}</TableCell>
                      <TableCell className="py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900">{p.name}</span>
                          <span className="text-xs font-bold text-[#480c0c] mt-0.5">{p.formId || p.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-xs text-gray-800">{p.passport}</span>
                      </TableCell>
                      <TableCell className="py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-600">{p.visaNumber || '-'}</span>
                      </TableCell>
                      <TableCell className="py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.gender === 'L' || p.gender === 'Laki-laki' 
                            ? 'text-blue-800 bg-blue-50 border border-blue-200' 
                            : 'text-rose-800 bg-rose-50 border border-rose-200'
                        }`}>
                          {p.gender === 'L' || p.gender === 'Laki-laki' ? 'L' : 'P'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">{p.age} th</span>
                      </TableCell>
                      <TableCell className="py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-600 font-medium">{p.phone}</span>
                      </TableCell>
                      <TableCell className="py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-800">{p.umrahPackage || '-'}</span>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => {
                            updatePilgrim(p.id, { group: '' });
                            toast(`${p.name} berhasil dikeluarkan dari kloter`, 'success');
                          }}
                          title="Keluarkan dari kloter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredGroupPilgrims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-200">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="font-bold text-gray-900 text-sm">Tidak ada jamaah ditemukan</p>
                          <p className="text-xs text-gray-500 mt-1">Gunakan filter lain atau tambahkan jamaah baru ke kloter ini.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT: ROOM MEET (FULL ROOM MEET MATCHING MENU) */}
      {activeTab === 'kamar' && (
        <div className="space-y-4">
          {/* Header & Controls Toolbar */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              
              {/* Location & Hotel Inputs */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Location Toggle */}
                <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100/70 p-0.5 h-9.5">
                  <button
                    type="button"
                    onClick={() => setSelectedHotelLocation('Makkah')}
                    className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedHotelLocation === 'Makkah' 
                        ? 'bg-white text-emerald-800 shadow-2xs' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Makkah
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedHotelLocation('Madinah')}
                    className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedHotelLocation === 'Madinah' 
                        ? 'bg-white text-emerald-800 shadow-2xs' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Madinah
                  </button>
                </div>

                {/* Hotel Name Input */}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-9.5 max-w-xs">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input 
                    value={currentHotelName}
                    onChange={(e) => setCurrentHotelName(e.target.value)}
                    className="h-7 text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus-visible:ring-0"
                    placeholder="Nama Hotel"
                  />
                </div>

                {/* Periode */}
                <Input 
                  value={periodTitle}
                  onChange={(e) => setPeriodTitle(e.target.value)}
                  className="h-9.5 w-32 bg-gray-50/80 border-gray-200 text-xs font-bold rounded-xl"
                  placeholder="JULI 2026"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/room-allocation?kloter=${encodeURIComponent(group.name)}`)}
                  className="border-purple-200 text-purple-700 bg-purple-50/70 hover:bg-purple-100 font-semibold text-xs h-9.5 px-3.5 rounded-xl shadow-2xs cursor-pointer"
                  title="Buka di Menu Room Meet Lengkap"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                  Buka di Room Meet Full
                </Button>
                <Button 
                  onClick={() => setIsAddRoomOpen(true)} 
                  className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-9.5 px-4 rounded-xl shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Tambah Kamar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportRoomListPdf}
                  className="border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs h-9.5 px-3 rounded-xl cursor-pointer"
                  title="Cetak Dokumen PDF Room List"
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-red-600" />
                  PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportRoomListExcel}
                  className="border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs h-9.5 px-3 rounded-xl cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Excel
                </Button>
              </div>
            </div>

            {/* Room Categories Counter */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Tipe Kamar:</span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
                  <span>Double:</span>
                  <span>{roomCategoryCounts.DOUBLE}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900">
                  <span>Triple:</span>
                  <span>{roomCategoryCounts.TRIPLE}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                  <span>Quad:</span>
                  <span>{roomCategoryCounts.QUAD}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                  <span>Quint:</span>
                  <span>{roomCategoryCounts.QUINT}</span>
                </div>
              </div>

              <div className="text-xs font-medium text-gray-600">
                Terisi: <span className="font-bold text-gray-900">{totalOccupantsCount}</span> / {totalCapacity} Bed &bull; Belum Ditempatkan: <span className="font-bold text-amber-700">{unassignedPilgrimsLocation.length}</span> Jamaah
              </div>
            </div>
          </div>

          {/* Unassigned Pilgrims Alert Banner */}
          {unassignedPilgrimsLocation.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {unassignedPilgrimsLocation.length} Jamaah Belum Punya Kamar di {selectedHotelLocation}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5 line-clamp-1">
                    {unassignedPilgrimsLocation.map(p => p.name).join(', ')}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => {
                  if (kloterRooms.length > 0) {
                    setTargetRoomId(kloterRooms[0].id);
                    setIsAddOccupantOpen(true);
                  } else {
                    setIsAddRoomOpen(true);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8.5 px-3.5 rounded-xl shrink-0 cursor-pointer"
              >
                + Alokasikan Kamar
              </Button>
            </div>
          )}

          {/* Main Room Meet Table */}
          <div className="bg-white border border-gray-200/80 shadow-2xs rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Daftar Kamar Hotel &bull; {currentHotelName} ({selectedHotelLocation})
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{group.name} &bull; {periodTitle}</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border shadow-2xs text-emerald-800 bg-emerald-50 border-emerald-300">
                {kloterRooms.length} Kamar Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3.5 w-[160px] whitespace-nowrap">TIPE KAMAR</th>
                    <th className="px-4 py-3.5 w-[130px] whitespace-nowrap">NO. KAMAR</th>
                    <th className="px-3 py-3.5 text-center w-[50px] whitespace-nowrap">NO</th>
                    <th className="px-3 py-3.5 text-center w-[75px] whitespace-nowrap">TITLE</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">NAMA JAMAAH</th>
                    <th className="px-3 py-3.5 text-center w-[70px] whitespace-nowrap">USIA</th>
                    <th className="px-4 py-3.5 text-right w-[110px] whitespace-nowrap pr-6">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kloterRooms.map((room) => {
                    const occupants = room.occupants.length > 0 ? room.occupants : [
                      { id: `empty-${room.id}`, no: 0, title: '' as any, name: '', age: '' }
                    ];
                    const rowSpan = occupants.length;
                    const maxCap = room.category === 'DOUBLE' ? 2 : room.category === 'TRIPLE' ? 3 : room.category === 'QUAD' ? 4 : 5;
                    const isFull = room.occupants.length >= maxCap;

                    return occupants.map((occ, idx) => (
                      <tr key={`${room.id}-${occ.id || idx}`} className="hover:bg-gray-50/60 transition-colors">
                        {/* ROOM Name (RowSpan) */}
                        {idx === 0 && (
                          <td rowSpan={rowSpan} className="px-4 py-3.5 font-semibold text-gray-900 align-top bg-white border-r border-gray-100">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-xs text-gray-900 uppercase">{room.roomLabel}</span>
                              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md w-max ${
                                isFull ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {room.occupants.length}/{maxCap} Bed
                              </span>
                              {!isFull && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetRoomId(room.id);
                                    setIsAddOccupantOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold transition-colors mt-1 cursor-pointer"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  + Jamaah
                                </button>
                              )}
                            </div>
                          </td>
                        )}

                        {/* NO ROOM (RowSpan) */}
                        {idx === 0 && (
                          <td rowSpan={rowSpan} className="px-4 py-3.5 align-top bg-white border-r border-gray-100">
                            <div className="flex items-center justify-between gap-1 group">
                              <span className="font-bold text-gray-900 text-xs font-mono">
                                {room.roomNumber || <span className="text-gray-400 italic font-normal font-sans">Belum set</span>}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoomNoId(room.id);
                                  setEditingRoomNoVal(room.roomNumber || '');
                                  setIsEditRoomNoOpen(true);
                                }}
                                className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
                                title="Edit Nomor Kamar"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        )}

                        {/* OCCUPANT DETAILS */}
                        <td className="px-3 py-3 text-center font-bold text-xs text-gray-400">
                          {occ.no > 0 ? occ.no : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-xs text-emerald-800">
                          {occ.title || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {occ.name ? (
                            <span className="font-bold text-sm text-gray-900">{occ.name}</span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">(Kamar Kosong / Belum Ada Penghuni)</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-xs text-gray-800">
                          {occ.age ? `${occ.age} th` : '-'}
                        </td>

                        {/* ACTIONS PER OCCUPANT OR ROOM */}
                        <td className="px-4 py-3 text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            {occ.name ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRoomId(room.id);
                                    setEditingOccupant(occ);
                                    setIsEditOccupantOpen(true);
                                  }}
                                  className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                                  title="Edit Penghuni"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <ConfirmDeleteButton
                                  variant="ghost"
                                  iconOnly
                                  onConfirm={() => {
                                    removeOccupantFromRoom(room.id, occ.id);
                                    toast(`Penghuni ${occ.name} dikeluarkan dari kamar.`, "success");
                                  }}
                                  className="text-gray-400 hover:text-red-600 p-1.5 h-auto rounded-lg hover:bg-red-50 cursor-pointer"
                                  title="Hapus Penghuni"
                                />
                              </>
                            ) : (
                              <ConfirmDeleteButton
                                variant="ghost"
                                onConfirm={() => {
                                  deleteRoom(room.id);
                                  toast(`Kamar ${room.roomLabel} dihapus.`, "success");
                                }}
                                className="text-red-600 hover:text-red-700 p-1 h-auto rounded-md hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                Hapus Kamar
                              </ConfirmDeleteButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })}

                  {kloterRooms.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        <BedDouble className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="font-bold text-gray-900 text-sm">Belum Ada Kamar Terdaftar di {selectedHotelLocation}</p>
                        <p className="text-xs text-gray-500 mt-1">Klik tombol "+ Tambah Kamar" di atas untuk membuat Room Meet baru.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PETUGAS & PEMBIMBING */}
      {activeTab === 'petugas' && (
        <Card className="border-gray-200/80 shadow-2xs rounded-2xl bg-white p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-700" />
            <span>Tim Pendamping & Pembimbing Kloter</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                TL
              </div>
              <div className="space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200">
                  Tour Leader (TL)
                </span>
                <p className="font-bold text-gray-900 text-sm">{group.tourLeader || 'Belum ditugaskan'}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Penanggung Jawab Rombongan
                </p>
              </div>
            </div>

            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-800 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                MW
              </div>
              <div className="space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold text-blue-800 bg-white border border-blue-200">
                  Muthawwif Lokal
                </span>
                <p className="font-bold text-gray-900 text-sm">{group.mutawif || 'Belum ditugaskan'}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Pembimbing Ibadah & Ziyarah KSA
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: JADWAL PERJALANAN */}
      {activeTab === 'jadwal' && (
        <Card className="border-gray-200/80 shadow-2xs rounded-2xl bg-white p-6 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Agenda Itinerary Perjalanan</span>
            </h3>
            <Link to="/journey">
              <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl h-8.5 px-3 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Kelola Perjalanan
              </Button>
            </Link>
          </div>
          <div className="relative border-l-2 border-emerald-100 ml-4 space-y-6 pb-2 pt-2">
            {schedules.map((sched) => (
              <div key={sched.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-600" />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Hari ke-{sched.dayNumber || 1} &bull; {sched.date}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">{sched.time}</span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{sched.title}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> {sched.location}</p>
                {sched.keterangan && <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl mt-1.5 border border-gray-100">{sched.keterangan}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB CONTENT: LOG DARURAT */}
      {activeTab === 'darurat' && (
        <Card className="border-gray-200/80 shadow-2xs rounded-2xl bg-white p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" /> 
            <span>Riwayat Laporan Darurat SOS</span>
          </h3>
          {groupEmergencies.length > 0 ? (
            <div className="space-y-3">
              {groupEmergencies.map(e => (
                <div key={e.id} className="p-4 rounded-xl border border-red-100 bg-red-50/30 flex justify-between items-center">
                  <div>
                    <Badge variant={e.status === 'Active' ? 'destructive' : 'secondary'} className="text-[10px] mb-1 font-bold">
                      {e.type}
                    </Badge>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{e.pilgrim}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{e.location} &bull; {e.date} {e.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">{e.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <ShieldAlert className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <p className="font-bold text-gray-900 text-sm">Tidak ada insiden darurat</p>
              <p className="text-xs text-gray-500 mt-1">Seluruh jamaah di kloter ini dalam kondisi aman dan sehat.</p>
            </div>
          )}
        </Card>
      )}

      {/* MODAL: TAMBAH JAMAAH KE KLOTER */}
      <Dialog open={isAddPilgrimModalOpen} onOpenChange={setIsAddPilgrimModalOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Tambah Jamaah ke {group.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Cari nama atau no. paspor jamaah..." 
                className="pl-9.5 text-xs sm:text-sm h-9.5 rounded-xl border-gray-200"
                value={pilgrimSearchTerm}
                onChange={(e) => setPilgrimSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-xl">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3 whitespace-nowrap">NAMA JAMAAH</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3 whitespace-nowrap">NO. PASPOR</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3 whitespace-nowrap">KLOTER SAAT INI</TableHead>
                    <TableHead className="text-right text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3 whitespace-nowrap pr-4">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {pilgrims
                    .filter(p => p.group !== group.name && 
                      (p.name.toLowerCase().includes(pilgrimSearchTerm.toLowerCase()) || 
                       p.passport.toLowerCase().includes(pilgrimSearchTerm.toLowerCase())))
                    .map(p => (
                      <TableRow key={p.id} className="text-xs hover:bg-gray-50/60">
                        <TableCell className="font-bold text-sm text-gray-900 py-3">{p.name}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-gray-700 py-3">{p.passport}</TableCell>
                        <TableCell className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700">
                            {p.group || 'Tanpa Kloter'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-4 py-3">
                          <Button 
                            size="sm" 
                            className="bg-[#740A03] hover:bg-[#580802] text-white text-xs font-semibold h-8 px-3 rounded-lg cursor-pointer"
                            onClick={() => {
                              updatePilgrim(p.id, { group: group.name });
                              toast(`${p.name} dimasukkan ke ${group.name}`, 'success');
                            }}
                          >
                            + Masukkan
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddPilgrimModalOpen(false)} className="rounded-xl h-9 text-xs font-semibold cursor-pointer">
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT KLOTER */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">Edit Informasi Kloter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            <div>
              <label className="font-semibold text-gray-700 mb-1.5 block">Nama Kloter</label>
              <Input 
                value={editFormData.name || ''} 
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} 
                className="h-9.5 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 mb-1.5 block">ID / Kode Flight</label>
              <Input 
                value={editFormData.kloter || ''} 
                onChange={(e) => setEditFormData({...editFormData, kloter: e.target.value})} 
                className="h-9.5 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-gray-700 mb-1.5 block">Tour Leader</label>
                <Input 
                  value={editFormData.tourLeader || ''} 
                  onChange={(e) => setEditFormData({...editFormData, tourLeader: e.target.value})} 
                  className="h-9.5 text-xs sm:text-sm rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 mb-1.5 block">Muthawwif</label>
                <Input 
                  value={editFormData.mutawif || ''} 
                  onChange={(e) => setEditFormData({...editFormData, mutawif: e.target.value})} 
                  className="h-9.5 text-xs sm:text-sm rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)} className="rounded-xl h-9 text-xs font-semibold cursor-pointer">Batal</Button>
            <Button size="sm" onClick={handleSaveEditGroup} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer">Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROOM MODALS: TAMBAH KAMAR */}
      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">Tambah Kamar Baru ({selectedHotelLocation})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            <div>
              <label className="font-semibold text-gray-700 mb-1.5 block">Tipe / Kategori Kamar</label>
              <div className="grid grid-cols-2 gap-2">
                {(['DOUBLE', 'TRIPLE', 'QUAD', 'QUINT'] as RoomCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewRoomCategory(cat)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      newRoomCategory === cat 
                        ? 'bg-[#740A03] text-white border-[#740A03] shadow-2xs' 
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat} ({cat === 'DOUBLE' ? '2 Bed' : cat === 'TRIPLE' ? '3 Bed' : cat === 'QUAD' ? '4 Bed' : '5 Bed'})
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700 mb-1.5 block">Nomor Kamar Hotel (Opsional)</label>
              <Input 
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                placeholder="Contoh: 402, 512, B-10"
                className="h-9.5 text-xs sm:text-sm rounded-xl font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddRoomOpen(false)} className="rounded-xl h-9 text-xs font-semibold cursor-pointer">Batal</Button>
            <Button size="sm" onClick={handleCreateRoom} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer">+ Tambah Kamar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROOM MODALS: TAMBAH PENGHUNI */}
      <Dialog open={isAddOccupantOpen} onOpenChange={setIsAddOccupantOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">Tambah Penghuni Kamar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            {unassignedPilgrimsLocation.length > 0 && (
              <div>
                <label className="font-semibold text-gray-700 mb-1.5 block">Pilih dari Jamaah Kloter {group.name}</label>
                <select
                  value={selectedPilgrimId}
                  onChange={(e) => {
                    setSelectedPilgrimId(e.target.value);
                    if (e.target.value) {
                      const p = pilgrims.find(item => item.id === e.target.value);
                      if (p) {
                        setCustomTitle((p.gender === 'L' || p.gender === 'Laki-laki') ? 'MR' : 'MRS');
                        setCustomName(p.name);
                        setCustomAge(String(p.age || ''));
                      }
                    }
                  }}
                  className="w-full h-9.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-800 focus:outline-emerald-600"
                >
                  <option value="">-- Pilih Jamaah --</option>
                  {unassignedPilgrimsLocation.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.gender === 'L' || p.gender === 'Laki-laki' ? 'L' : 'P'}, {p.age || '?'} th)</option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <label className="font-semibold text-gray-700 mb-1.5 block">Atau Input Nama Penghuni Manual</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Title</label>
                  <select
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value as any)}
                    className="w-full h-9.5 rounded-xl border border-gray-200 bg-gray-50 px-2 text-xs font-bold"
                  >
                    <option value="MR">MR</option>
                    <option value="MRS">MRS</option>
                    <option value="MISS">MISS</option>
                    <option value="MSTR">MSTR</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Nama Lengkap</label>
                  <Input 
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="NAMA PENGIKUT / JAMAAH"
                    className="h-9.5 text-xs rounded-xl uppercase font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Usia (Tahun)</label>
                <Input 
                  value={customAge}
                  onChange={(e) => setCustomAge(e.target.value)}
                  placeholder="Contoh: 45"
                  className="h-9.5 text-xs rounded-xl font-bold"
                  type="number"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddOccupantOpen(false)} className="rounded-xl h-9 text-xs font-semibold cursor-pointer">Batal</Button>
            <Button size="sm" onClick={handleAddOccupant} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer">Simpan Penghuni</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROOM MODALS: EDIT NO KAMAR */}
      <Dialog open={isEditRoomNoOpen} onOpenChange={setIsEditRoomNoOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">Ubah Nomor Kamar Hotel</DialogTitle>
          </DialogHeader>
          <div className="py-3 text-xs">
            <label className="font-semibold text-gray-700 mb-1.5 block">Nomor Kamar Hotel</label>
            <Input 
              value={editingRoomNoVal}
              onChange={(e) => setEditingRoomNoVal(e.target.value)}
              placeholder="Contoh: 402"
              className="h-9.5 text-xs rounded-xl font-mono font-bold"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsEditRoomNoOpen(false)} className="rounded-xl h-9 text-xs font-semibold cursor-pointer">Batal</Button>
            <Button size="sm" onClick={handleSaveRoomNo} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROOM MODALS: EDIT PENGHUNI */}
      <Dialog open={isEditOccupantOpen} onOpenChange={setIsEditOccupantOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">Edit Data Penghuni</DialogTitle>
          </DialogHeader>
          {editingOccupant && (
            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Title</label>
                  <select
                    value={editingOccupant.title}
                    onChange={(e) => setEditingOccupant({ ...editingOccupant, title: e.target.value as any })}
                    className="w-full h-9.5 rounded-xl border border-gray-200 bg-gray-50 px-2 text-xs font-bold"
                  >
                    <option value="MR">MR</option>
                    <option value="MRS">MRS</option>
                    <option value="MISS">MISS</option>
                    <option value="MSTR">MSTR</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Nama Lengkap</label>
                  <Input 
                    value={editingOccupant.name}
                    onChange={(e) => setEditingOccupant({ ...editingOccupant, name: e.target.value.toUpperCase() })}
                    className="h-9.5 text-xs rounded-xl uppercase font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Usia (Tahun)</label>
                <Input 
                  value={editingOccupant.age || ''}
                  onChange={(e) => setEditingOccupant({ ...editingOccupant, age: e.target.value })}
                  className="h-9.5 text-xs rounded-xl font-bold"
                  type="number"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsEditOccupantOpen(false)} className="rounded-xl h-9 text-xs font-semibold cursor-pointer">Batal</Button>
            <Button size="sm" onClick={handleSaveEditOccupant} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer">Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
