import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore, RoomItem, RoomCategory, RoomOccupant, Pilgrim } from '@/core/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDeleteButton';
import { toast } from '@/lib/toast';
import { exportToExcel } from '@/lib/export';
import { exportRoomListToPdf } from '@/lib/exportPdf';
import { 
  BedDouble, Plus, Download, Trash2, Edit2, 
  Building2, Users, UserPlus, AlertCircle, X, Search, FileText,
  CheckCircle2, Hotel, ArrowRight, UserCheck, Check, Sparkles, Filter,
  Phone, Calendar, ChevronRight, Layers, Eye
} from 'lucide-react';

export default function RoomAllocation() {
  const { 
    rooms, addRoom, updateRoom, deleteRoom, 
    addOccupantToRoom, removeOccupantFromRoom, updateOccupantInRoom,
    groups, pilgrims 
  } = useStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlKloter = searchParams.get('kloter');
  const navigate = useNavigate();

  // Filters & State
  const [selectedKloter, setSelectedKloter] = useState<string>(() => {
    if (urlKloter) return urlKloter;
    if (groups.length > 0) return groups[0].name;
    return "Kloter 4 Al-Barakah";
  });

  useEffect(() => {
    if (urlKloter && urlKloter !== selectedKloter) {
      setSelectedKloter(urlKloter);
    }
  }, [urlKloter]);

  const handleKloterChange = (kloterName: string) => {
    setSelectedKloter(kloterName);
    setSearchParams({ kloter: kloterName });
  };

  const [selectedHotelLocation, setSelectedHotelLocation] = useState<'Makkah' | 'Madinah'>("Makkah");
  const [makkahHotelName, setMakkahHotelName] = useState<string>("Swissôtel Al Maqam Makkah");
  const [madinahHotelName, setMadinahHotelName] = useState<string>("Anwar Al Madinah Movenpick");
  const [periodTitle, setPeriodTitle] = useState<string>("JULI 2026");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | RoomCategory | 'EMPTY'>('ALL');

  const currentHotelName = selectedHotelLocation === 'Makkah' ? makkahHotelName : madinahHotelName;
  const setCurrentHotelName = (val: string) => {
    if (selectedHotelLocation === 'Makkah') {
      setMakkahHotelName(val);
    } else {
      setMadinahHotelName(val);
    }
  };

  // Modal States
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

  // Matched Kloter Names for seamless connection
  const selectedGroupObj = groups.find(g => g.name === selectedKloter || g.kloter === selectedKloter || g.id === selectedKloter);
  const matchedKloterNames = useMemo(() => {
    return new Set([selectedKloter, selectedGroupObj?.name, selectedGroupObj?.kloter].filter(Boolean) as string[]);
  }, [selectedKloter, selectedGroupObj]);

  // Rooms in current location
  const kloterLocationRooms = useMemo(() => {
    return rooms.filter(r => 
      matchedKloterNames.has(r.kloter) && r.hotelLocation === selectedHotelLocation
    );
  }, [rooms, matchedKloterNames, selectedHotelLocation]);

  // Filtered Rooms based on search and category filter
  const filteredRooms = useMemo(() => {
    return kloterLocationRooms.filter(r => {
      // Category filter
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'EMPTY') {
          if (r.occupants.length > 0) return false;
        } else if (r.category !== categoryFilter) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRoomLabel = r.roomLabel.toLowerCase().includes(query);
        const matchesRoomNumber = (r.roomNumber || '').toLowerCase().includes(query);
        const matchesOccupant = r.occupants.some(o => 
          o.name.toLowerCase().includes(query) || 
          (o.title && o.title.toLowerCase().includes(query)) ||
          String(o.age || '').includes(query)
        );
        return matchesRoomLabel || matchesRoomNumber || matchesOccupant;
      }

      return true;
    });
  }, [kloterLocationRooms, categoryFilter, searchTerm]);

  // Unassigned pilgrims in selected group
  const groupPilgrims = useMemo(() => {
    return pilgrims.filter(p => matchedKloterNames.has(p.group));
  }, [pilgrims, matchedKloterNames]);

  const assignedNames = useMemo(() => {
    return new Set(
      kloterLocationRooms.flatMap(r => r.occupants.map(o => o.name.toLowerCase().trim()))
    );
  }, [kloterLocationRooms]);

  const unassignedPilgrims = useMemo(() => {
    return groupPilgrims.filter(
      p => !assignedNames.has(p.name.toLowerCase().trim())
    );
  }, [groupPilgrims, assignedNames]);

  // Count summary by category
  const roomCategoryCounts = useMemo(() => {
    return {
      DOUBLE: kloterLocationRooms.filter(r => r.category === 'DOUBLE').length,
      TRIPLE: kloterLocationRooms.filter(r => r.category === 'TRIPLE').length,
      QUAD: kloterLocationRooms.filter(r => r.category === 'QUAD').length,
      QUINT: kloterLocationRooms.filter(r => r.category === 'QUINT').length,
    };
  }, [kloterLocationRooms]);

  // Capacity calculations
  const totalOccupantsCount = useMemo(() => {
    return kloterLocationRooms.reduce((acc, r) => acc + r.occupants.length, 0);
  }, [kloterLocationRooms]);

  const totalCapacity = useMemo(() => {
    return kloterLocationRooms.reduce((acc, r) => {
      const cap = r.category === 'DOUBLE' ? 2 : r.category === 'TRIPLE' ? 3 : r.category === 'QUAD' ? 4 : 5;
      return acc + cap;
    }, 0);
  }, [kloterLocationRooms]);

  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupantsCount / totalCapacity) * 100) : 0;

  // Auto calculate total next sequential number
  const getNextSequentialNo = () => {
    let count = 0;
    kloterLocationRooms.forEach(r => {
      count += r.occupants.length;
    });
    return count + 1;
  };

  // Handle Add Room
  const handleCreateRoom = () => {
    const existingCount = kloterLocationRooms.filter(r => r.category === newRoomCategory).length;
    const roomLabel = `${newRoomCategory} ${existingCount + 1}`;

    const newRoom: RoomItem = {
      id: `RM-${Date.now()}`,
      category: newRoomCategory,
      roomLabel,
      roomNumber: newRoomNumber.trim(),
      kloter: selectedKloter,
      hotelLocation: selectedHotelLocation,
      hotelName: currentHotelName,
      occupants: []
    };

    addRoom(newRoom);
    setIsAddRoomOpen(false);
    setNewRoomNumber('');
    toast(`Kamar ${roomLabel} berhasil dibuat.`, "success");
  };

  // Handle Add Occupant
  const handleAddOccupant = () => {
    if (!targetRoomId) return;

    let title: 'MR' | 'MRS' | 'MISS' | 'MSTR' = customTitle;
    let name = customName.trim().toUpperCase();
    let age: number | string = customAge;

    if (selectedPilgrimId) {
      const p = pilgrims.find(item => item.id === selectedPilgrimId);
      if (p) {
        title = p.gender === 'Laki-laki' || p.gender === 'L' ? 'MR' : 'MRS';
        name = p.name.toUpperCase();
        age = p.age;
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

  // Handle Save Edit Occupant
  const handleSaveEditOccupant = () => {
    if (!editingRoomId || !editingOccupant) return;
    updateOccupantInRoom(editingRoomId, editingOccupant.id, editingOccupant);
    setIsEditOccupantOpen(false);
    setEditingOccupant(null);
    toast("Data penghuni berhasil diperbarui.", "success");
  };

  // Handle Save Room Number
  const handleSaveRoomNo = () => {
    if (!editingRoomNoId) return;
    updateRoom(editingRoomNoId, { roomNumber: editingRoomNoVal });
    setIsEditRoomNoOpen(false);
    toast("Nomor kamar hotel berhasil diperbarui.", "success");
  };

  // Export to Excel matching the exact layout
  const handleExportExcel = () => {
    const excelRows: any[] = [];
    
    kloterLocationRooms.forEach((room) => {
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

    const filename = `Roomlist_${selectedKloter.replace(/\s+/g, '_')}_Hotel_${selectedHotelLocation}_${periodTitle.replace(/\s+/g, '_')}`;
    const headerTitle = `Room List ${periodTitle} - ${currentHotelName.toUpperCase()} (${selectedKloter.toUpperCase()})`;
    
    exportToExcel(excelRows, filename, headerTitle);
    toast("Data Room List berhasil diexport ke Excel.", "success");
  };

  // Export to PDF
  const handleExportPdf = () => {
    try {
      exportRoomListToPdf({
        kloterName: selectedKloter,
        hotelLocation: selectedHotelLocation,
        hotelName: currentHotelName,
        periodTitle: periodTitle,
        rooms: kloterLocationRooms
      });
      toast("Dokumen PDF Room List berhasil diunduh!", "success");
    } catch (err) {
      console.error(err);
      toast("Gagal mengunduh dokumen PDF.", "error");
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Banner - Matching Registration, Pilgrims, Finance, Groups */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                Room Meet
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedHotelLocation}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Alokasi dan tata kelola penempatan kamar hotel jamaah di Makkah & Madinah
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleExportPdf}
              className="text-xs h-10 font-semibold text-red-700 border-red-200 bg-red-50/50 hover:bg-red-50 flex-1 sm:flex-none justify-center px-4 rounded-xl cursor-pointer shadow-2xs"
              title="Cetak & Download Dokumen PDF Room List"
            >
              <FileText className="w-4 h-4 mr-1.5 text-red-600" />
              Cetak PDF
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              className="text-xs h-10 font-semibold text-gray-700 border-gray-200 bg-white hover:bg-gray-50 flex-1 sm:flex-none justify-center px-4 rounded-xl cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 mr-1.5 text-emerald-600" />
              Export Excel
            </Button>

            <Button 
              onClick={() => setIsAddRoomOpen(true)} 
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-2xs flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Kamar
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards - Exact Design Tokens matching other modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Card 1: Total Kamar */}
        <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL KAMAR ({selectedHotelLocation})</p>
                <h3 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight mt-1">
                  {kloterLocationRooms.length} <span className="text-sm font-normal text-gray-500">Kamar</span>
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <BedDouble className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span>{totalCapacity} Total Kapasitas Bed Hotel</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Terisi & Okupansi */}
        <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">BED TERISI</p>
                <h3 className="text-2xl sm:text-[26px] font-bold text-emerald-700 tracking-tight mt-1">
                  {totalOccupantsCount} <span className="text-sm font-normal text-gray-500">/ {totalCapacity} Bed</span>
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
              <span className="font-bold">{occupancyRate}% Okupansi Terisi</span>
              <span className="text-gray-400">&bull;</span>
              <span className="text-gray-600">{totalCapacity - totalOccupantsCount} Bed Kosong</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Belum Ditempatkan */}
        <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">BELUM DITEMPATKAN</p>
                <h3 className={`text-2xl sm:text-[26px] font-bold tracking-tight mt-1 ${
                  unassignedPilgrims.length > 0 ? 'text-amber-600' : 'text-gray-900'
                }`}>
                  {unassignedPilgrims.length} <span className="text-sm font-normal text-gray-500">Jamaah</span>
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span>Dari total {groupPilgrims.length} jamaah di {selectedKloter}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Hotel Aktif */}
        <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">HOTEL {selectedHotelLocation.toUpperCase()}</p>
                <h3 className="text-base font-bold text-gray-900 tracking-tight mt-1 truncate" title={currentHotelName}>
                  {currentHotelName}
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span>Periode: <strong className="text-gray-900">{periodTitle}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Controls & Filters Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4 print:hidden">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          
          {/* Kloter, Location, Hotel & Period Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Kloter Select */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 min-w-[200px] flex-1 sm:flex-none">
              <Users className="w-4 h-4 text-gray-400 shrink-0" />
              <select 
                value={selectedKloter}
                onChange={(e) => handleKloterChange(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name} ({g.kloter || g.id})</option>
                ))}
                {!groups.some(g => g.name === selectedKloter) && (
                  <option value={selectedKloter}>{selectedKloter}</option>
                )}
              </select>
            </div>

            {/* Location Toggle Button Group */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100/70 p-0.5 h-10">
              <button
                type="button"
                onClick={() => setSelectedHotelLocation('Makkah')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
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
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 min-w-[220px] flex-1 sm:flex-none">
              <Hotel className="w-4 h-4 text-gray-400 shrink-0" />
              <Input 
                value={currentHotelName}
                onChange={(e) => setCurrentHotelName(e.target.value)}
                className="h-8 text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus-visible:ring-0"
                placeholder="Nama Hotel"
                title="Edit Nama Hotel"
              />
            </div>

            {/* Period Input */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 w-32 shrink-0">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <Input 
                value={periodTitle}
                onChange={(e) => setPeriodTitle(e.target.value)}
                className="h-8 text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus-visible:ring-0"
                placeholder="JULI 2026"
                title="Edit Periode Bulan/Tahun"
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Cari penghuni atau no. kamar..." 
              className="pl-9.5 pr-8 bg-white border-gray-200 text-xs sm:text-sm h-10 rounded-xl focus:border-emerald-500"
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
        </div>

        {/* Room Category Tabs / Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Filter Tipe:</span>
            
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({kloterLocationRooms.length})
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('DOUBLE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'DOUBLE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100'
              }`}
            >
              <span>Double (2 Bed):</span>
              <span>{roomCategoryCounts.DOUBLE}</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('TRIPLE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'TRIPLE'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-purple-50 border border-purple-200 text-purple-900 hover:bg-purple-100'
              }`}
            >
              <span>Triple (3 Bed):</span>
              <span>{roomCategoryCounts.TRIPLE}</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('QUAD')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'QUAD'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <span>Quad (4 Bed):</span>
              <span>{roomCategoryCounts.QUAD}</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('QUINT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'QUINT'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <span>Quint (5 Bed):</span>
              <span>{roomCategoryCounts.QUINT}</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('EMPTY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                categoryFilter === 'EMPTY'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Kamar Kosong ({kloterLocationRooms.filter(r => r.occupants.length === 0).length})
            </button>
          </div>

          <div className="text-xs font-medium text-gray-500">
            Kloter: <strong className="text-gray-900">{selectedKloter}</strong> &bull; Terdaftar: <strong className="text-gray-900">{groupPilgrims.length} Jamaah</strong>
          </div>
        </div>
      </div>

      {/* Unassigned Pilgrims Alert Card (if any) */}
      {unassignedPilgrims.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Ada {unassignedPilgrims.length} Jamaah Belum Dialokasikan ke Kamar {selectedHotelLocation}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {unassignedPilgrims.slice(0, 3).map(p => p.name).join(', ')}
                {unassignedPilgrims.length > 3 ? ` dan ${unassignedPilgrims.length - 3} lainnya` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              size="sm"
              onClick={() => {
                const emptyRoom = kloterLocationRooms.find(r => {
                  const max = r.category === 'DOUBLE' ? 2 : r.category === 'TRIPLE' ? 3 : r.category === 'QUAD' ? 4 : 5;
                  return r.occupants.length < max;
                });
                if (emptyRoom) {
                  setTargetRoomId(emptyRoom.id);
                  setIsAddOccupantOpen(true);
                } else {
                  setIsAddRoomOpen(true);
                }
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 px-4 rounded-xl shrink-0 cursor-pointer shadow-2xs flex-1 sm:flex-none justify-center"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Alokasikan Sekarang
            </Button>
          </div>
        </div>
      )}

      {/* Main Room Meet Table */}
      <Card className="border-gray-200/80 shadow-2xs rounded-2xl bg-white overflow-hidden print:border-none print:shadow-none print:rounded-none">
        
        {/* Table Header Area */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                Daftar Kamar Hotel &bull; {currentHotelName} ({selectedHotelLocation})
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {selectedKloter} &bull; Periode: {periodTitle} &bull; Total {filteredRooms.length} Kamar Ditampilkan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border shadow-2xs text-emerald-800 bg-emerald-50 border-emerald-300">
              {kloterLocationRooms.length} Kamar Terdaftar
            </span>
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3.5 w-[160px] whitespace-nowrap">TIPE KAMAR</th>
                <th className="px-4 py-3.5 w-[140px] whitespace-nowrap">NO. KAMAR</th>
                <th className="px-3 py-3.5 text-center w-[50px] whitespace-nowrap">NO</th>
                <th className="px-3 py-3.5 text-center w-[75px] whitespace-nowrap">TITLE</th>
                <th className="px-4 py-3.5 whitespace-nowrap">NAMA JAMAAH</th>
                <th className="px-3 py-3.5 text-center w-[70px] whitespace-nowrap">USIA</th>
                <th className="px-4 py-3.5 text-right w-[120px] whitespace-nowrap pr-6 print:hidden">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRooms.map((room) => {
                const occupants = room.occupants.length > 0 ? room.occupants : [
                  { id: `empty-${room.id}`, no: 0, title: '' as any, name: '', age: '' }
                ];
                const rowSpan = occupants.length;
                const maxCap = room.category === 'DOUBLE' ? 2 : room.category === 'TRIPLE' ? 3 : room.category === 'QUAD' ? 4 : 5;
                const isFull = room.occupants.length >= maxCap;

                return occupants.map((occ, idx) => (
                  <tr 
                    key={`${room.id}-${occ.id || idx}`}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* ROOM Name (RowSpan for first occupant) */}
                    {idx === 0 && (
                      <td 
                        rowSpan={rowSpan} 
                        className="px-4 py-3.5 font-semibold text-gray-900 align-top bg-white border-r border-gray-100"
                      >
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-xs text-gray-900 uppercase tracking-tight">{room.roomLabel}</span>
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
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold transition-colors mt-1 print:hidden cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              + Jamaah
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* NO.ROOM Hotel (RowSpan for first occupant) */}
                    {idx === 0 && (
                      <td 
                        rowSpan={rowSpan} 
                        className="px-4 py-3.5 align-top bg-white border-r border-gray-100"
                      >
                        <div className="flex items-center justify-between gap-1 group/room">
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
                            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 print:hidden cursor-pointer"
                            title="Edit Nomor Kamar Hotel"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    )}

                    {/* NO (Sequential Number) */}
                    <td className="px-3 py-3 text-center font-bold text-xs text-gray-400">
                      {occ.no > 0 ? occ.no : '-'}
                    </td>

                    {/* TITLE (MR, MRS, MISS, MSTR) */}
                    <td className="px-3 py-3 text-center">
                      {occ.title ? (
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          occ.title === 'MR' || occ.title === 'MSTR'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {occ.title}
                        </span>
                      ) : '-'}
                    </td>

                    {/* NAMA (Occupant Name) */}
                    <td className="px-4 py-3">
                      {occ.name ? (
                        <span className="font-bold text-sm text-gray-900 uppercase">{occ.name}</span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">(Kamar Kosong / Belum Ada Penghuni)</span>
                      )}
                    </td>

                    {/* AGE */}
                    <td className="px-3 py-3 text-center font-bold text-xs text-gray-800">
                      {occ.age ? `${occ.age} th` : '-'}
                    </td>

                    {/* AKSI (Actions) */}
                    <td className="px-4 py-3 text-right pr-6 print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        {occ.name ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRoomId(room.id);
                                setEditingOccupant({ ...occ });
                                setIsEditOccupantOpen(true);
                              }}
                              className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
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
                              className="text-gray-400 hover:text-red-600 p-1.5 h-auto rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                              title="Keluarkan dari Kamar"
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

              {filteredRooms.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <BedDouble className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-gray-900 text-sm">Tidak ada kamar ditemukan</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {searchTerm ? 'Coba ubah kata kunci pencarian.' : `Belum ada kamar dibuat untuk ${selectedKloter} di ${selectedHotelLocation}.`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Notes for Print */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 bg-gray-50/50">
          <span>* Format Resmi Rooming List DNA Tour Management System</span>
          <span className="font-semibold">{kloterLocationRooms.length} Kamar &bull; {totalOccupantsCount} / {totalCapacity} Bed Terisi</span>
        </div>
      </Card>

      {/* Modal 1: Tambah Kamar Baru */}
      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Tambah Kamar Baru ({selectedHotelLocation})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="font-semibold text-gray-700 mb-1.5 block text-xs">Tipe / Kategori Kamar</label>
              <div className="grid grid-cols-2 gap-2">
                {(['DOUBLE', 'TRIPLE', 'QUAD', 'QUINT'] as RoomCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewRoomCategory(cat)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      newRoomCategory === cat 
                        ? 'bg-[#740A03] text-white border-[#740A03] shadow-2xs' 
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div>{cat}</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">
                      {cat === 'DOUBLE' ? '2 Bed' : cat === 'TRIPLE' ? '3 Bed' : cat === 'QUAD' ? '4 Bed' : '5 Bed'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700 mb-1.5 block text-xs">Nomor Kamar Hotel (Opsional)</label>
              <Input 
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                placeholder="Contoh: 501, 1204"
                className="h-9.5 text-xs sm:text-sm rounded-xl font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">Nomor fisik kamar dari pihak hotel (bisa diisi nanti).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddRoomOpen(false)} className="rounded-xl h-9.5 text-xs font-semibold cursor-pointer">
              Batal
            </Button>
            <Button size="sm" onClick={handleCreateRoom} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9.5 text-xs font-semibold px-4 cursor-pointer">
              + Tambah Kamar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Tambah Penghuni */}
      <Dialog open={isAddOccupantOpen} onOpenChange={setIsAddOccupantOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Tambah Penghuni Kamar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {unassignedPilgrims.length > 0 && (
              <div>
                <label className="font-semibold text-gray-700 mb-1.5 block text-xs">
                  Pilih dari Jamaah Kloter {selectedKloter} ({unassignedPilgrims.length} Belum Ditempatkan)
                </label>
                <select
                  value={selectedPilgrimId}
                  onChange={(e) => {
                    setSelectedPilgrimId(e.target.value);
                    if (e.target.value) {
                      const p = pilgrims.find(item => item.id === e.target.value);
                      if (p) {
                        setCustomTitle(p.gender === 'Laki-laki' || p.gender === 'L' ? 'MR' : 'MRS');
                        setCustomName(p.name);
                        setCustomAge(String(p.age || ''));
                      }
                    }
                  }}
                  className="w-full h-9.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-800 focus:outline-emerald-600"
                >
                  <option value="">-- Pilih Jamaah Kloter --</option>
                  {unassignedPilgrims.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender === 'Laki-laki' || p.gender === 'L' ? 'L' : 'P'}, {p.age} th) - {p.passport}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <label className="font-semibold text-gray-700 mb-1.5 block text-xs">Atau Input Manual</label>
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
                    placeholder="NAMA LENGKAP"
                    className="h-9.5 text-xs rounded-xl uppercase font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Usia (Tahun)</label>
                <Input 
                  value={customAge}
                  onChange={(e) => setCustomAge(e.target.value)}
                  placeholder="Contoh: 48"
                  className="h-9.5 text-xs rounded-xl font-bold"
                  type="number"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddOccupantOpen(false)} className="rounded-xl h-9.5 text-xs font-semibold cursor-pointer">
              Batal
            </Button>
            <Button size="sm" onClick={handleAddOccupant} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9.5 text-xs font-semibold px-4 cursor-pointer">
              Simpan Penghuni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Edit Penghuni */}
      <Dialog open={isEditOccupantOpen} onOpenChange={setIsEditOccupantOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Edit Data Penghuni
            </DialogTitle>
          </DialogHeader>
          {editingOccupant && (
            <div className="space-y-4 py-3">
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
            <Button variant="outline" size="sm" onClick={() => setIsEditOccupantOpen(false)} className="rounded-xl h-9.5 text-xs font-semibold cursor-pointer">
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveEditOccupant} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9.5 text-xs font-semibold px-4 cursor-pointer">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Edit Nomor Kamar Hotel */}
      <Dialog open={isEditRoomNoOpen} onOpenChange={setIsEditRoomNoOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Ubah Nomor Kamar Hotel
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <label className="font-semibold text-gray-700 mb-1.5 block text-xs">Nomor Kamar Hotel</label>
            <Input 
              value={editingRoomNoVal}
              onChange={(e) => setEditingRoomNoVal(e.target.value)}
              placeholder="Contoh: 501, 1204"
              className="h-9.5 text-xs sm:text-sm rounded-xl font-mono"
              autoFocus
            />
            <p className="text-[11px] text-gray-400 mt-1">Nomor fisik kamar hotel dari pihak hotel.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsEditRoomNoOpen(false)} className="rounded-xl h-9.5 text-xs font-semibold cursor-pointer">
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveRoomNo} className="bg-[#740A03] hover:bg-[#580802] text-white rounded-xl h-9.5 text-xs font-semibold px-4 cursor-pointer">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
