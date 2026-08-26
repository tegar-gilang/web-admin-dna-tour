import React, { useState, useMemo } from 'react';
import { useStore, Group, Pilgrim } from '@/core/store';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { 
  MapPin, Users, Phone, CheckCircle2, AlertTriangle, Search, 
  Compass, MessageSquare, ArrowRight, Target, 
  Send, Check, Navigation, ZoomIn, ZoomOut,
  ShieldCheck, Radio, Sparkles, Layers, Eye, RefreshCw, AlertCircle
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { toast } from '@/lib/toast';

interface GroupTelemetry {
  lat: number;
  lng: number;
  locationName: string;
  activityName: string;
  radiusMeter: number;
  maxDistanceMeter: number;
  outsideRadiusCount: number;
  lastPing: string;
  alertStatus: 'Normal' | 'Peringatan' | 'SOS';
}

const DUMMY_TELEMETRY: Record<string, GroupTelemetry> = {
  'G-000': {
    lat: 21.4225,
    lng: 39.8262,
    locationName: 'Masjidil Haram - Pelataran Mataf',
    activityName: 'Tawaf Umrah / Wada',
    radiusMeter: 25,
    maxDistanceMeter: 18,
    outsideRadiusCount: 0,
    lastPing: '2s lalu',
    alertStatus: 'Normal',
  },
  'G-001': {
    lat: 21.4133,
    lng: 39.8200,
    locationName: 'Swissôtel Al Maqam Makkah',
    activityName: 'Persiapan Manasik & Persiapan Keluar',
    radiusMeter: 15,
    maxDistanceMeter: 12,
    outsideRadiusCount: 0,
    lastPing: '5s lalu',
    alertStatus: 'Normal',
  },
  'G-002': {
    lat: 21.4210,
    lng: 39.8285,
    locationName: 'Bukit Safa & Marwah (Area Sa\'i)',
    activityName: 'Pelaksanaan Sa\'i Putaran ke-4',
    radiusMeter: 50,
    maxDistanceMeter: 48,
    outsideRadiusCount: 2,
    lastPing: '12s lalu',
    alertStatus: 'Peringatan',
  },
  'G-003': {
    lat: 24.4672,
    lng: 39.6112,
    locationName: 'Masjid Nabawi Madinah (Pintu 338)',
    activityName: 'Ziarah Raudhah & Solat Berjamaah',
    radiusMeter: 30,
    maxDistanceMeter: 22,
    outsideRadiusCount: 0,
    lastPing: '1s lalu',
    alertStatus: 'Normal',
  },
};

export default function LiveMonitoring() {
  const { groups, pilgrims, tourLeaders, mutawifs, addBroadcast } = useStore();
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'normal' | 'warning' | 'table'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pilgrimSearch, setPilgrimSearch] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [showRadiusZone, setShowRadiusZone] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(15);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');

  // @ts-ignore
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Stats calculation
  const totalGroups = groups.length;
  const safeCount = groups.filter(g => {
    const t = DUMMY_TELEMETRY[g.id] || DUMMY_TELEMETRY['G-000'];
    return t.alertStatus === 'Normal' && t.outsideRadiusCount === 0;
  }).length;
  const warningCount = totalGroups - safeCount;
  
  const outsidePilgrimsTotal = useMemo(() => {
    return groups.reduce((acc, g) => {
      const t = DUMMY_TELEMETRY[g.id] || DUMMY_TELEMETRY['G-000'];
      return acc + (t.outsideRadiusCount || 0);
    }, 0);
  }, [groups]);

  const selectedGroup = useMemo(() => {
    if (selectedGroupId === 'ALL') return null;
    return groups.find(g => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const currentTelemetry = useMemo(() => {
    if (!selectedGroupId || selectedGroupId === 'ALL') return null;
    return DUMMY_TELEMETRY[selectedGroupId] || {
      lat: 21.4225,
      lng: 39.8262,
      locationName: 'Sektor Utama Makkah',
      activityName: 'Kegiatan Terjadwal Rombongan',
      radiusMeter: 25,
      maxDistanceMeter: 15,
      outsideRadiusCount: 0,
      lastPing: '3s lalu',
      alertStatus: 'Normal',
    };
  }, [selectedGroupId]);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const telem = DUMMY_TELEMETRY[g.id] || DUMMY_TELEMETRY['G-000'];
      
      // Tab filter
      if (activeTab === 'normal' && (telem.alertStatus !== 'Normal' || telem.outsideRadiusCount > 0)) return false;
      if (activeTab === 'warning' && telem.alertStatus === 'Normal' && telem.outsideRadiusCount === 0) return false;

      // Search matching
      const matchesSearch = 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        g.kloter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.tourLeader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.mutawif.toLowerCase().includes(searchTerm.toLowerCase()) ||
        telem.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        telem.activityName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLoc = filterLocation 
        ? telem.locationName.toLowerCase().includes(filterLocation.toLowerCase())
        : true;

      return matchesSearch && matchesLoc;
    });
  }, [groups, activeTab, searchTerm, filterLocation]);

  const groupPilgrims = useMemo(() => {
    if (!selectedGroup) return [];
    const matches = pilgrims.filter(p => {
      const gName = (p.group || '').toLowerCase();
      const selName = (selectedGroup.name || '').toLowerCase();
      const selKloter = (selectedGroup.kloter || '').toLowerCase();
      return gName.includes(selName) || gName.includes(selKloter) || selName.includes(gName);
    });
    if (matches.length > 0) return matches;
    return pilgrims.slice(0, Math.min(pilgrims.length, selectedGroup.pilgrims || 12));
  }, [pilgrims, selectedGroup]);

  const filteredPilgrims = useMemo(() => {
    if (!pilgrimSearch.trim()) return groupPilgrims;
    const query = pilgrimSearch.toLowerCase();
    return groupPilgrims.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.passport && p.passport.toLowerCase().includes(query)) ||
      (p.phone && p.phone.toLowerCase().includes(query))
    );
  }, [groupPilgrims, pilgrimSearch]);

  const leaderInfo = useMemo(() => {
    if (!selectedGroup) return null;
    return tourLeaders.find(tl => tl.name.toLowerCase().includes(selectedGroup.tourLeader.toLowerCase()) || tl.group === selectedGroup.name) || {
      name: selectedGroup.tourLeader || 'Ustadz Pendamping',
      phone: '+62 812-8899-0011',
    };
  }, [selectedGroup, tourLeaders]);

  const mutawifInfo = useMemo(() => {
    if (!selectedGroup) return null;
    return mutawifs.find(m => m.name.toLowerCase().includes(selectedGroup.mutawif.toLowerCase()) || m.group === selectedGroup.name) || {
      name: selectedGroup.mutawif || 'Syeikh Mutawif',
      language: 'Arab, Indonesia',
    };
  }, [selectedGroup, mutawifs]);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setSentNotice(true);

    const targetLabel = selectedGroup ? `${selectedGroup.name} (${selectedGroup.kloter})` : 'Semua Jamaah';
    addBroadcast({
      id: Date.now(),
      title: `Siaran Lapangan - ${selectedGroup ? selectedGroup.name : 'Semua Rombongan'}`,
      message: broadcastMessage.trim(),
      target: targetLabel,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });

    setTimeout(() => {
      setSentNotice(false);
      setShowBroadcastModal(false);
      setBroadcastMessage('');
      toast(`Pesan siaran telah dipancarkan ke ${targetLabel}`, "success");
    }, 900);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner Container - Clean & Consistent with Registration */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Pantau Langsung
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Monitoring posisi real-time, status geofencing radius, dan telemetri lokasi jamaah per rombongan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              onClick={() => {
                if (selectedGroupId === 'ALL') {
                  setSelectedGroupId(groups[0]?.id || 'ALL');
                }
                setShowBroadcastModal(true);
              }}
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-2xs w-full sm:w-auto justify-center cursor-pointer"
            >
              <Radio className="w-4 h-4 mr-1.5" /> 
              Pancarkan Siaran
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid Container - 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Rombongan */}
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
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL ROMBONGAN</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalGroups} Kloter
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{pilgrims.length} Jamaah Tersebar di Tanah Suci</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Status Aman / Normal */}
        <Card 
          onClick={() => { setActiveTab('normal'); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'normal' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">DALAM RADIUS AMAN</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-emerald-800">
                  {safeCount} Kloter
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Seluruh Jamaah di Dalam Geofencing</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Peringatan Radius */}
        <Card 
          onClick={() => { setActiveTab('warning'); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'warning' 
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PERINGATAN RADIUS</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-amber-800">
                  {warningCount} Kloter
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fdf6e7] text-[#c27803] flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#b45309]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{outsidePilgrimsTotal} Jamaah di Luar Jangkauan Rombongan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Jamaah Terpantau */}
        <Card 
          onClick={() => { setActiveTab('table'); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'table' 
              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TABEL TELEMETRI</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-blue-900">
                  {pilgrims.length} Jamaah
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <Radio className="w-3.5 h-3.5 shrink-0" />
              <span>Lihat Detail Koordinat & Log Status</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Container Card with Integrated Tabs Header */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-2xs">
        {/* Navigation Tabs Header */}
        <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-2.5 pb-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-0">
            <button 
              onClick={() => { setActiveTab('all'); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'all' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Peta Monitoring (Semua)</span>
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
              onClick={() => { setActiveTab('normal'); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'normal' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Radius Aman</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'normal' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {safeCount}
              </span>
              {activeTab === 'normal' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('warning'); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'warning' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Peringatan Keluar Radius</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'warning' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {warningCount}
              </span>
              {activeTab === 'warning' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('table'); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'table' 
                  ? 'font-bold text-blue-900' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Tabel Rincian Telemetri</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'table' 
                  ? 'bg-blue-100 text-blue-900 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {groups.length} Kloter
              </span>
              {activeTab === 'table' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-tab-indicator" />
              )}
            </button>
          </div>
        </div>

        {/* Filter & Search Bar Section */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/40">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama rombongan, kloter, pembimbing, atau lokasi kegiatan..."
                className="pl-9 h-10 text-xs sm:text-sm bg-white border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            {/* Quick Filter Selectors & Map Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="h-10 text-xs font-semibold px-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer"
              >
                <option value="ALL">🌐 Semua Rombongan ({groups.length})</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.kloter})
                  </option>
                ))}
              </select>

              {activeTab !== 'table' && (
                <>
                  <div className="bg-gray-100 rounded-xl p-0.5 border border-gray-200 flex items-center text-xs">
                    <button
                      onClick={() => setMapType('roadmap')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        mapType === 'roadmap' 
                          ? 'bg-white text-gray-900 shadow-2xs border border-gray-200/60' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Peta Jalan
                    </button>
                    <button
                      onClick={() => setMapType('satellite')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        mapType === 'satellite' 
                          ? 'bg-slate-900 text-white shadow-2xs' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Satelit
                    </button>
                  </div>

                  <button
                    onClick={() => setShowRadiusZone(!showRadiusZone)}
                    className={`h-10 text-xs px-3.5 rounded-xl font-semibold border transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                      showRadiusZone
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>{showRadiusZone ? 'Radius Geofence: Aktif' : 'Radius Geofence'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Body: Map View or Table View */}
        {activeTab === 'table' ? (
          /* Table View Mode */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/75 border-b border-gray-200/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-xs text-gray-700 py-3.5">Rombongan & Kloter</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 py-3.5">Lokasi & Agenda Saat Ini</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 py-3.5 text-center">Radius Keamanan</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 py-3.5 text-center">Jarak Terjauh</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 py-3.5 text-center">Di Luar Radius</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 py-3.5">Petugas Lapangan</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 py-3.5 text-center">Status GPS</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 py-3.5 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <MapPin className="w-8 h-8 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-600">Tidak ada data rombongan yang cocok dengan pencarian.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => {
                    const telem = DUMMY_TELEMETRY[group.id] || DUMMY_TELEMETRY['G-000'];
                    const isNormal = telem.alertStatus === 'Normal' && telem.outsideRadiusCount === 0;

                    return (
                      <TableRow key={group.id} className="hover:bg-gray-50/60 transition-colors">
                        <TableCell className="py-3.5">
                          <div className="font-bold text-xs sm:text-sm text-gray-900">{group.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-500 font-mono font-medium">{group.kloter}</span>
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                              {group.pilgrims} Jamaah
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>{telem.locationName}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 pl-5">
                            {telem.activityName}
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <Target className="w-3.5 h-3.5 text-slate-500" />
                            {telem.radiusMeter} m
                          </span>
                        </TableCell>

                        <TableCell className="py-3.5 text-center">
                          <span className={`text-xs font-bold ${
                            telem.maxDistanceMeter > telem.radiusMeter ? 'text-amber-700 font-semibold' : 'text-slate-700'
                          }`}>
                            {telem.maxDistanceMeter} m
                          </span>
                        </TableCell>

                        <TableCell className="py-3.5 text-center">
                          {telem.outsideRadiusCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              {telem.outsideRadiusCount} Orang
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              0 (Aman)
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="text-xs font-semibold text-gray-900">{group.tourLeader}</div>
                          <div className="text-[11px] text-gray-500">Mutawif: {group.mutawif}</div>
                        </TableCell>

                        <TableCell className="py-3.5 text-center">
                          {isNormal ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Normal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 shadow-2xs whitespace-nowrap">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Peringatan
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="py-3.5 text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedGroupId(group.id);
                              setActiveTab('all');
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs h-8 px-3 rounded-lg cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-gray-600" />
                            Lihat di Peta
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Map View Mode with Integrated Telemetry Inspector */
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
              
              {/* Left/Main Column: Google Maps Container */}
              <div className="lg:col-span-8 xl:col-span-8 bg-slate-950 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative flex flex-col h-[580px]">
                
                {/* Top Toolbar Overlay on Map */}
                <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-gray-200 z-10">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
                    <Compass className="w-4 h-4 text-emerald-700" />
                    <span>{selectedGroup ? `Fokus: ${selectedGroup.name} (${selectedGroup.kloter})` : 'Peta Interaktif Seluruh Kloter'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedGroupId !== 'ALL' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedGroupId('ALL')}
                        className="h-7 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg px-2.5"
                      >
                        Reset Tampilan
                      </Button>
                    )}
                    <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
                      {selectedGroup ? '1 Kloter Aktif' : `${groups.length} Kloter Terpetakan`}
                    </span>
                  </div>
                </div>

                {/* Google Maps / Vector Map Canvas */}
                <div className="flex-1 relative bg-slate-950 overflow-hidden">
                  {apiKey ? (
                    <APIProvider apiKey={apiKey}>
                      <Map
                        defaultZoom={selectedGroup ? 16 : 14}
                        zoom={zoomLevel}
                        mapTypeId={mapType}
                        defaultCenter={
                          currentTelemetry 
                            ? { lat: currentTelemetry.lat, lng: currentTelemetry.lng } 
                            : { lat: 21.4225, lng: 39.8262 }
                        }
                        mapId="LIVE_GOOGLE_MAPS_ID"
                        disableDefaultUI={true}
                        className="w-full h-full"
                      >
                        {groups.map((g) => {
                          const telem = DUMMY_TELEMETRY[g.id] || DUMMY_TELEMETRY['G-000'];
                          if (selectedGroup && selectedGroupId !== g.id) return null;

                          return (
                            <AdvancedMarker
                              key={g.id}
                              position={{ lat: telem.lat, lng: telem.lng }}
                              onClick={() => setSelectedGroupId(g.id)}
                            >
                              <Pin 
                                background={telem.alertStatus === 'Peringatan' ? '#f59e0b' : '#10b981'} 
                                borderColor="#047857" 
                                glyphColor="#fff" 
                              />
                            </AdvancedMarker>
                          );
                        })}
                      </Map>
                    </APIProvider>
                  ) : (
                    /* Sleek Vector Map Fallback Simulation */
                    <div className={`w-full h-full relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-500 ${
                      mapType === 'satellite' ? 'bg-slate-900' : 'bg-[#f4efe6]'
                    }`}>
                      {/* Grid Lines Pattern */}
                      <div className={`absolute inset-0 bg-[size:60px_60px] ${
                        mapType === 'satellite'
                          ? 'bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] opacity-30'
                          : 'bg-[linear-gradient(to_right,#ffffff_2px,transparent_2px),linear-gradient(to_bottom,#ffffff_2px,transparent_2px)] opacity-60'
                      }`}></div>

                      {/* Ka'bah Landmark Center Box */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                        <div className="w-11 h-11 bg-slate-950 border-2 border-amber-400 rounded-md shadow-2xl flex items-center justify-center text-sm">
                          🕋
                        </div>
                        <span className="text-[10px] font-bold text-amber-950 bg-amber-100/95 px-2.5 py-0.5 rounded-md mt-1.5 border border-amber-300 shadow-2xs backdrop-blur-sm">
                          Ka'bah (Mataf)
                        </span>
                      </div>

                      {/* Interactive Group Pins & Radius Circles */}
                      <div className="relative w-full h-full max-w-2xl max-h-[480px] flex items-center justify-center">
                        {groups.map((group, index) => {
                          const isSelected = selectedGroupId === group.id;
                          if (selectedGroup && !isSelected) return null;

                          const positions = [
                            { top: '36%', left: '42%' },
                            { top: '22%', left: '72%' },
                            { top: '65%', left: '58%' },
                            { top: '76%', left: '24%' },
                          ];
                          const pos = positions[index % positions.length];
                          const telem = DUMMY_TELEMETRY[group.id] || DUMMY_TELEMETRY['G-000'];
                          const radiusPx = telem.radiusMeter * (selectedGroup ? 5.8 : 4.2);

                          return (
                            <div
                              key={group.id}
                              style={{ top: pos.top, left: pos.left }}
                              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 ${
                                isSelected ? 'z-30' : 'hover:z-25'
                              }`}
                            >
                              {/* Radius Zone Overlay Circle */}
                              {showRadiusZone && (
                                <div 
                                  style={{ width: `${radiusPx * 2}px`, height: `${radiusPx * 2}px` }}
                                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-300 border-2 ${
                                    telem.alertStatus === 'Peringatan'
                                      ? 'bg-amber-500/15 border-amber-500 border-dashed animate-pulse'
                                      : mapType === 'satellite' 
                                        ? 'bg-emerald-500/15 border-emerald-400 border-dashed'
                                        : 'bg-emerald-600/10 border-emerald-600 border-dashed'
                                  }`}
                                >
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap shadow-xs">
                                    Radius: {telem.radiusMeter}m
                                  </div>

                                  {/* Pilgrim Scatter Dots */}
                                  {[
                                    { top: '35%', left: '38%' },
                                    { top: '62%', left: '68%' },
                                    { top: '25%', left: '70%' },
                                    { top: '68%', left: '32%' },
                                  ].map((pPos, pIdx) => (
                                    <div
                                      key={pIdx}
                                      style={{ top: pPos.top, left: pPos.left }}
                                      className="absolute w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs"
                                    />
                                  ))}

                                  {telem.outsideRadiusCount > 0 && (
                                    <div
                                      style={{ top: '-10%', left: '85%' }}
                                      className="absolute w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping ring-2 ring-white shadow-xs"
                                      title="Jamaah terpisah luar radius"
                                    />
                                  )}
                                </div>
                              )}

                              {/* Pin Marker */}
                              <div 
                                onClick={() => setSelectedGroupId(group.id)}
                                className={`cursor-pointer px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-md transition-all ${
                                  isSelected
                                    ? 'bg-[#740A03] border-[#580802] text-white font-bold scale-110 shadow-lg ring-2 ring-red-300/40'
                                    : 'bg-white border-gray-200 text-gray-800 hover:border-emerald-500 hover:shadow-emerald-500/20'
                                }`}
                              >
                                <MapPin className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-[#740A03]'}`} />
                                <div className="text-left">
                                  <span className="text-xs font-bold block whitespace-nowrap">{group.name}</span>
                                  <span className="text-[10px] opacity-80 block whitespace-nowrap -mt-0.5">{group.kloter}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Zoom Controls Overlay */}
                  <div className="absolute right-4 bottom-20 flex flex-col gap-1.5 z-20">
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(prev + 1, 18))}
                      className="w-8 h-8 rounded-xl bg-white text-gray-700 border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:text-gray-900 text-xs shadow-2xs transition-colors cursor-pointer"
                      title="Perbesar Peta"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(prev - 1, 10))}
                      className="w-8 h-8 rounded-xl bg-white text-gray-700 border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:text-gray-900 text-xs shadow-2xs transition-colors cursor-pointer"
                      title="Perkecil Peta"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Floating Telemetry Card on Map */}
                  {selectedGroup && currentTelemetry && (
                    <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-md p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 z-20">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                          <MapPin className="w-3.5 h-3.5 text-[#740A03]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block">Lokasi Saat Ini</span>
                          <span className="font-bold text-gray-900 text-xs truncate block">{currentTelemetry.locationName}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 sm:border-l sm:border-gray-200 sm:pl-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                          <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block">Kegiatan Rombongan</span>
                          <span className="font-bold text-gray-900 text-xs truncate block">{currentTelemetry.activityName}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 sm:border-l sm:border-gray-200 sm:pl-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                          <Target className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block">Radius Keamanan</span>
                          <span className="font-bold text-gray-900 text-xs flex items-center gap-1">
                            {currentTelemetry.radiusMeter}m (Maks {currentTelemetry.maxDistanceMeter}m)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Group Inspector & Pilgrim List */}
              <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col h-[580px] overflow-hidden">
                {selectedGroup ? (
                  /* Selected Group Details Card */
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-white">
                      <button
                        onClick={() => setSelectedGroupId('ALL')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-2.5 group cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5 rotate-180 text-gray-400 group-hover:text-gray-700 transition-transform group-hover:-translate-x-0.5" /> 
                        Kembali ke Daftar Kloter
                      </button>

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">{selectedGroup.name}</h2>
                            <span className="text-[11px] font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/80">
                              {selectedGroup.kloter}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mt-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span>{selectedGroup.pilgrims} Jamaah Terdaftar</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contacts & Telemetry Section */}
                    <div className="p-4 space-y-3 border-b border-gray-100 bg-gray-50/30">
                      {/* Tour Leader & Mutawif Cards */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tour Leader</span>
                          <div className="font-bold text-gray-900 text-xs truncate mt-0.5">{leaderInfo?.name || selectedGroup.tourLeader}</div>
                          <div className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1 mt-1 font-mono">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{leaderInfo?.phone || '+62 812-3456-7890'}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mutawif</span>
                          <div className="font-bold text-gray-900 text-xs truncate mt-0.5">{mutawifInfo?.name || selectedGroup.mutawif}</div>
                          <div className="text-gray-500 text-[11px] font-medium truncate mt-1">
                            {mutawifInfo?.language || 'Arab, Indo'}
                          </div>
                        </div>
                      </div>

                      {/* Clean Telemetry Stat Strip (Light Modern Aesthetic) */}
                      <div className="p-3 rounded-xl border border-gray-200/80 bg-white shadow-2xs grid grid-cols-3 divide-x divide-gray-100">
                        <div className="text-center px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Radius</span>
                          <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                            {currentTelemetry?.radiusMeter}m
                          </span>
                        </div>
                        <div className="text-center px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Terjauh</span>
                          <span className="font-bold text-amber-700 text-sm mt-0.5 block">
                            {currentTelemetry?.maxDistanceMeter}m
                          </span>
                        </div>
                        <div className="text-center px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Luar Radius</span>
                          <span className={`font-bold text-sm mt-0.5 block ${
                            currentTelemetry?.outsideRadiusCount ? 'text-rose-700' : 'text-emerald-700'
                          }`}>
                            {currentTelemetry?.outsideRadiusCount || 0} org
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setShowBroadcastModal(true)}
                          className="flex-1 bg-[#740A03] hover:bg-[#580802] text-white text-xs font-semibold rounded-xl shadow-2xs h-9.5 cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5 mr-1.5" />
                          Siaran Rombongan
                        </Button>
                        <a
                          href={`https://wa.me/${(leaderInfo?.phone || '+6281234567890').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-9.5 h-9.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all shrink-0 shadow-2xs cursor-pointer"
                          title="Hubungi Tour Leader via WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                        </a>
                      </div>
                    </div>

                    {/* Members List Section */}
                    <div className="flex flex-col flex-1 min-h-0 bg-white">
                      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider shrink-0">
                          Daftar Jamaah ({filteredPilgrims.length})
                        </h3>
                        <div className="relative flex-1 max-w-[170px]">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <Input
                            value={pilgrimSearch}
                            onChange={(e) => setPilgrimSearch(e.target.value)}
                            placeholder="Cari jamaah..."
                            className="pl-8 h-8 text-xs bg-gray-50/80 border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {filteredPilgrims.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-xs">
                            Tidak ada jamaah ditemukan.
                          </div>
                        ) : (
                          filteredPilgrims.map((pilgrim, idx) => {
                            const distance = 3 + (idx * 4) % 35;
                            const inRadius = distance <= (currentTelemetry?.radiusMeter || 25);
                            return (
                              <div 
                                key={pilgrim.id} 
                                className="p-2.5 px-3 rounded-xl border border-gray-200/70 bg-white hover:bg-gray-50/80 flex items-center justify-between transition-colors shadow-2xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-bold text-gray-900 text-xs truncate">{pilgrim.name}</div>
                                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                    Paspor: {pilgrim.passport || '-'}
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {inRadius ? (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono shadow-2xs">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {distance}m
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono shadow-2xs">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      {distance}m
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* All Groups List */
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Daftar Rombongan</h2>
                        <p className="text-[11px] text-gray-500">Klik rombongan untuk fokus telemetri</p>
                      </div>
                      <Badge variant="outline" className="bg-white text-gray-700 font-mono text-xs">{groups.length} Kloter</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                      {groups.map(group => {
                        const telem = DUMMY_TELEMETRY[group.id] || DUMMY_TELEMETRY['G-000'];
                        const isWarning = telem.alertStatus === 'Peringatan' || telem.outsideRadiusCount > 0;

                        return (
                          <div 
                            key={group.id} 
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`cursor-pointer p-3.5 rounded-xl border bg-white hover:border-[#740A03] hover:shadow-xs transition-all space-y-2.5 shadow-2xs group ${
                              isWarning ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-[#740A03] transition-colors block leading-tight mb-1">
                                  {group.name}
                                </span>
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md">
                                  {group.kloter}
                                </span>
                              </div>
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold shrink-0 border border-emerald-200">
                                {group.pilgrims} Jamaah
                              </span>
                            </div>

                            <div className="text-xs space-y-1 pt-2 border-t border-gray-100">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#740A03] mt-0.5 shrink-0" />
                                <span className="text-gray-700 line-clamp-1 text-[11px] font-medium">{telem.locationName}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-gray-600 pt-0.5">
                                <span>Radius: <strong className="text-gray-900">{telem.radiusMeter}m</strong></span>
                                {isWarning ? (
                                  <span className="text-rose-700 font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    {telem.outsideRadiusCount} di luar
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Aman
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Broadcast Message Modal */}
      <Dialog open={showBroadcastModal} onOpenChange={setShowBroadcastModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#740A03]" />
              Pancarkan Siaran Rombongan
            </DialogTitle>
          </DialogHeader>

          {sentNotice ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Siaran Terkirim</h4>
                <p className="text-xs text-gray-500 mt-1">Notifikasi pesan telah dipancarkan ke seluruh aplikasi jamaah {selectedGroup?.name || 'Rombongan'}.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Target Rombongan</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="ALL">📢 Seluruh Kloter ({groups.length} Rombongan)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.kloter})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5 uppercase tracking-wider">Isi Pesan / Instruksi</label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Contoh: Seluruh jamaah Kloter 1 dimohon berkumpul di depan Gate 338 Masjid Nabawi dalam 15 menit..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowBroadcastModal(false)} 
                  className="text-xs font-bold h-10 rounded-xl px-4 border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#740A03] hover:bg-[#580802] text-white text-xs font-bold h-10 rounded-xl px-5 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Pancarkan Sekarang
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

