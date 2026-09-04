import { create } from 'zustand';
import { User } from '@/types/auth';

const getInitialAuth = () => {
  try {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (token && user) {
      return { isAuthenticated: true, token, user };
    }
  } catch (e) {
    console.error('Failed to rehydrate auth state:', e);
  }
  return { isAuthenticated: false, token: null, user: null };
};


export type Pilgrim = {
  id: string;
  formId?: string;
  name: string;
  passport: string;
  group: string;
  gender: string;
  age: number;
  phone: string;
  
  // Detail Informasi Pribadi & Rincian Perjalanan
  visaNumber?: string;
  nationality?: string;
  birthDate?: string;
  emergencyContact?: string;
  tourLeader?: string;
  mutawifLocal?: string;
  hotel?: string;
  hotelMakkah?: string;
  hotelMadinah?: string;
  returnDate?: string;

  // Dokumen & Administrasi
  registrationDate?: string;
  departureDate?: string;
  umrahPackage?: string;
  ktp?: string;
  documentInfo?: string; // akte lahir / buku nikah / ijazah
  meningitis?: boolean;
  photo?: boolean;

  // Perlengkapan
  koperBesar?: boolean;
  koperKabin?: boolean;
  batik?: boolean;
  bukuDomisili?: boolean;
  kainIhram?: boolean;
  sabuk?: string; // m/l/xl/xxl
  kerudungMerah?: boolean;
  kerudungPutih?: boolean;
  tasSelempang?: boolean;
  tasSandal?: boolean;
  syall?: boolean;

  // Pembayaran (Point 4)
  paymentOption?: 'DP' | 'Bayar Lunas' | 'Belum Bayar';
  totalAmount?: number;
  paidAmount?: number;
  paymentMethod?: string;
  paymentDate?: string;
  paymentNotes?: string;
};

export type FinanceTransaction = {
  id: string;

  pilgrimId?: string;
  pilgrimName: string;
  type: 'Pemasukan (DP)' | 'Pemasukan (Pelunasan)' | 'Pemasukan (Lunas)' | 'Pengeluaran' | 'Pemasukan Lain';
  category: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: 'Berhasil' | 'Pending' | 'Batal';
  notes?: string;
  referenceNo?: string;
};

export type Group = {
  id: string;
  formId?: string;
  name: string;
  kloter: string;
  pilgrims: number;
  tourLeader: string;
  mutawif: string;
  status: string;
};

export type Family = {
  id: string;

  name: string;
  head: string;
  members: number;
  group: string;
  status: string;
};

export type TourLeader = {
  id: string;

  name: string;
  phone: string;
  group: string;
  experience?: string;
  performance?: string;
  status: string;
};

export type Mutawif = {
  id: string;

  name: string;
  language: string;
  experience: string;
  group: string;
  status: string;
};

export type ScheduleCategory = string;

export type Schedule = {
  id: string;

  date: string;
  time: string;
  title: string;
  location: string;
  keterangan: string;
  category?: ScheduleCategory;
  statusOverride?: 'completed' | 'in_progress' | 'upcoming';
  pic?: string;
  dayNumber?: number;
};

export type Emergency = {
  id: string;

  pilgrim: string;
  group: string;
  location: string;
  date: string;
  time: string;
  type: string;
  status: 'Active' | 'Resolved';
};

export type BroadcastItem = {
  id: number;
  title: string;
  message: string;
  target: string;
  time: string;
  date?: string;
  originalTime?: string;
  originalDate?: string;
  isEdited?: boolean;
  updatedAt?: string;
  updatedTime?: string;
  updatedDate?: string;
};

export type RoomCategory = 'DOUBLE' | 'TRIPLE' | 'QUAD' | 'QUINT';

export type RoomOccupant = {
  id: string;

  no: number;
  title: 'MR' | 'MRS' | 'MISS' | 'MSTR';
  name: string;
  age?: number | string;
};

export type RoomItem = {
  id: string;

  category: RoomCategory;
  roomLabel: string;
  roomNumber?: string;
  kloter: string;
  hotelLocation: 'Makkah' | 'Madinah';
  hotelName: string;
  occupants: RoomOccupant[];
};

export type StaffStockItem = {
  id: string;

  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location?: string;
  lastUpdated?: string;
  notes?: string;
};


export type TrashItem = {
  id: string;

  originalId: string;
  type: string;
  name: string;
  deletedAt: string;
  data: any;
  reason?: string;
};

type StoreState = {
  trashItems: TrashItem[];
  emptyTrash: () => void;
  restoreFromTrash: (trashId: string) => void;
  deletePermanently: (trashId: string) => void;
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token?: string, user?: User) => void;
  logout: () => void;

  pilgrims: Pilgrim[];
  groups: Group[];
  families: Family[];
  tourLeaders: TourLeader[];
  mutawifs: Mutawif[];
  schedules: Schedule[];
  emergencies: Emergency[];
  rooms: RoomItem[];
  staffStocks: StaffStockItem[];
  financeTransactions: FinanceTransaction[];
  broadcasts: BroadcastItem[];
  readNotificationIds: string[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  addPilgrim: (p: Pilgrim) => void;
  updatePilgrim: (id: string, p: Partial<Pilgrim>) => void;
  deletePilgrim: (id: string) => void;
  deletePilgrims: (ids: string[]) => void;

  addGroup: (g: Group) => void;
  updateGroup: (id: string, g: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  deleteGroups: (ids: string[]) => void;

  addFamily: (f: Family) => void;
  updateFamily: (id: string, f: Partial<Family>) => void;
  deleteFamily: (id: string) => void;
  deleteFamilies: (ids: string[]) => void;

  addTourLeader: (t: TourLeader) => void;
  updateTourLeader: (id: string, t: Partial<TourLeader>) => void;
  deleteTourLeader: (id: string) => void;
  deleteTourLeaders: (ids: string[]) => void;

  addMutawif: (m: Mutawif) => void;
  updateMutawif: (id: string, m: Partial<Mutawif>) => void;
  deleteMutawif: (id: string) => void;
  deleteMutawifs: (ids: string[]) => void;

  addSchedule: (s: Schedule) => void;
  updateSchedule: (id: string, s: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  deleteSchedules: (ids: string[]) => void;
  
  resolveEmergency: (id: string) => void;
  addEmergency: (e: Emergency) => void;
  updateEmergency: (id: string, e: Partial<Emergency>) => void;
  deleteEmergency: (id: string) => void;
  deleteEmergencies: (ids: string[]) => void;

  // Room actions
  addRoom: (room: RoomItem) => void;
  updateRoom: (id: string, updates: Partial<RoomItem>) => void;
  deleteRoom: (id: string) => void;
  addOccupantToRoom: (roomId: string, occupant: RoomOccupant) => void;
  removeOccupantFromRoom: (roomId: string, occupantId: string) => void;
  updateOccupantInRoom: (roomId: string, occupantId: string, updates: Partial<RoomOccupant>) => void;

  // Staff Stock actions
  addStaffStock: (item: StaffStockItem) => void;
  updateStaffStock: (id: string, updates: Partial<StaffStockItem>) => void;
  deleteStaffStock: (id: string) => void;
  deleteStaffStocks: (ids: string[]) => void;
  adjustStockQuantity: (id: string, delta: number) => void;

  // Finance actions
  addTransaction: (tx: FinanceTransaction) => void;
  updateTransaction: (id: string, updates: Partial<FinanceTransaction>) => void;
  deleteTransaction: (id: string) => void;

  // Broadcast actions
  addBroadcast: (b: BroadcastItem) => void;
  updateBroadcast: (id: number, updates: Partial<BroadcastItem>) => void;
  deleteBroadcasts: (ids: number[]) => void;
};

export const useStore = create<StoreState>((set) => ({
  trashItems: [],
  emptyTrash: () => set({ trashItems: [] }),
  restoreFromTrash: (trashId) => set((state) => {
    const item = state.trashItems.find(t => t.id === trashId);
    if (!item) return state;
    const newTrash = state.trashItems.filter(t => t.id !== trashId);
    if (item.type === 'Jamaah') return { trashItems: newTrash, pilgrims: [item.data, ...state.pilgrims] };
    if (item.type === 'Kloter') return { trashItems: newTrash, groups: [item.data, ...state.groups] };
    if (item.type === 'Keluarga') return { trashItems: newTrash, families: [item.data, ...state.families] };
    if (item.type === 'Tour Leader') return { trashItems: newTrash, tourLeaders: [item.data, ...state.tourLeaders] };
    if (item.type === 'Mutawif') return { trashItems: newTrash, mutawifs: [item.data, ...state.mutawifs] };
    if (item.type === 'Jadwal') return { trashItems: newTrash, schedules: [item.data, ...state.schedules] };
    if (item.type === 'Kamar') return { trashItems: newTrash, rooms: [item.data, ...state.rooms] };
    if (item.type === 'Penghuni Kamar') {
      return { 
        trashItems: newTrash, 
        rooms: state.rooms.map(r => r.id === item.data.roomId ? { ...r, occupants: [item.data.occupant, ...r.occupants] } : r)
      };
    }
    if (item.type === 'Stok Barang') return { trashItems: newTrash, staffStocks: [item.data, ...state.staffStocks] };
    if (item.type === 'Transaksi') return { trashItems: newTrash, financeTransactions: [item.data, ...state.financeTransactions] };
    if (item.type === 'Siaran') {
      return { trashItems: newTrash, broadcasts: [item.data, ...state.broadcasts] };
    }
    if (item.type === 'Darurat') {
      return { trashItems: newTrash, emergencies: [item.data, ...state.emergencies] };
    }
    return { trashItems: newTrash };
  }),
  deletePermanently: (trashId) => set((state) => ({ trashItems: state.trashItems.filter(t => t.id !== trashId) })),
  ...getInitialAuth(),
  login: (token, user) => {
    const validToken = token || localStorage.getItem('auth_token');
    const validUser = user || (localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user')!) : null);
    if (validToken) localStorage.setItem('auth_token', validToken);
    if (validUser) localStorage.setItem('auth_user', JSON.stringify(validUser));
    set({
      isAuthenticated: true,
      token: validToken,
      user: validUser,
    });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ isAuthenticated: false, token: null, user: null });
  },

  broadcasts: [
    { id: 4, title: "Cuaca Ekstrem Terik", message: "Cuaca hari ini diperkirakan sangat terik. Seluruh jamaah diwajibkan membawa payung dan botol air minum.", target: "Semua Jamaah", time: "05.00", date: "2026-07-28", originalTime: "05.00", originalDate: "2026-07-28" },
    { id: 3, title: "Perubahan Jadwal Ziarah", message: "Ziarah Madinah diundur menjadi pukul 10.00 karena kepadatan lalu lintas.", target: "Group A-1", time: "06.15", date: "2026-07-28", originalTime: "06.15", originalDate: "2026-07-28" },
    { id: 2, title: "Pembagian Koper Tambahan", message: "Tour leader harap mengambil tag koper tambahan di ruang administrasi.", target: "Semua Tour Leader", time: "09.30", date: "2026-07-27", originalTime: "09.30", originalDate: "2026-07-27" },
    { id: 1, title: "Persiapan Keberangkatan Makkah", message: "Jamaah mohon mempersiapkan diri di lobi hotel 1 jam sebelum keberangkatan menuju Makkah.", target: "Kloter KLT-01", time: "08.00", date: "2026-07-26", originalTime: "08.00", originalDate: "2026-07-26" },
  ],

  pilgrims: [
    { 
      id: "PL-88210", 
      formId: "FRM-001",
      name: "H. Ahmad Zaki Al-Farizi", 
      passport: "X-99821014", 
      group: "Kloter 4 Al-Barakah", 
      umrahPackage: "Multazam", 
      gender: "Laki-laki", 
      age: 48, 
      phone: "+62 812-3456-7890",
      visaNumber: "VSA-2026-99210-SA",
      nationality: "Indonesia",
      birthDate: "14 Mei 1978",
      emergencyContact: "Keluarga Jamaah (+62 811-9988-7766)",
      tourLeader: "Ust. H. Muhammad Ridwan (TL)",
      mutawifLocal: "Ust. Ibrahim Al-Madani",
      hotel: "Swissôtel Al Maqam Makkah",
      hotelMakkah: "Swissôtel Al Maqam Makkah",
      hotelMadinah: "Anwar Al Madinah Movenpick",
      departureDate: "10 Juli 2026",
      returnDate: "22 Juli 2026",
      registrationDate: "2026-05-10",
      ktp: "3271041405780001",
      meningitis: true,
      photo: true,
      koperBesar: true,
      koperKabin: true,
      batik: true,
      bukuDomisili: true,
      kainIhram: true,
      sabuk: "L",
      kerudungMerah: false,
      kerudungPutih: false,
      tasSelempang: true,
      tasSandal: true,
      syall: true,
      paymentOption: "Bayar Lunas",
      totalAmount: 35000000,
      paidAmount: 35000000,
      paymentMethod: "Transfer BCA",
      paymentDate: "2026-05-10",
      paymentNotes: "Pembayaran lunas Paket Multazam"
    },
    { 
      id: "P-1001", 
      formId: "FRM-002",
      name: "Ahmad Abdullah", 
      passport: "A1234567", 
      group: "Group A-1", 
      umrahPackage: "Yamani", 
      gender: "Laki-laki", 
      age: 45, 
      phone: "+966 50 123 4567",
      visaNumber: "VSA-2026-10010-SA",
      nationality: "Indonesia",
      birthDate: "12 Ags 1981",
      emergencyContact: "Istri (+62 812-1111-2222)",
      tourLeader: "Ust. Khalid Basalamah",
      mutawifLocal: "Syeikh Ammar",
      hotel: "Pullman Zamzam Makkah",
      hotelMakkah: "Pullman Zamzam Makkah",
      hotelMadinah: "Anwar Al Madinah Movenpick",
      departureDate: "15 Agustus 2026",
      returnDate: "24 Agustus 2026",
      registrationDate: "2026-06-01",
      ktp: "3172011208810003",
      meningitis: true,
      photo: true,
      koperBesar: true,
      koperKabin: true,
      batik: true,
      bukuDomisili: true,
      kainIhram: true,
      sabuk: "M",
      kerudungMerah: false,
      kerudungPutih: false,
      tasSelempang: true,
      tasSandal: true,
      syall: true,
      paymentOption: "DP",
      totalAmount: 30000000,
      paidAmount: 10000000,
      paymentMethod: "Transfer Mandiri",
      paymentDate: "2026-06-01",
      paymentNotes: "DP Uang Muka Paket Yamani"
    },
    { 
      id: "P-1002", 
      formId: "FRM-003",
      name: "Fatima Zahra", 
      passport: "B7654321", 
      group: "Group A-1", 
      umrahPackage: "Yamani", 
      gender: "Perempuan", 
      age: 42, 
      phone: "+966 50 123 4568",
      visaNumber: "VSA-2026-10020-SA",
      nationality: "Indonesia",
      birthDate: "03 Nov 1984",
      emergencyContact: "Suami (+62 812-3333-4444)",
      tourLeader: "Ust. Khalid Basalamah",
      mutawifLocal: "Syeikh Ammar",
      hotel: "Pullman Zamzam Makkah",
      hotelMakkah: "Pullman Zamzam Makkah",
      hotelMadinah: "Anwar Al Madinah Movenpick",
      departureDate: "15 Agustus 2026",
      returnDate: "24 Agustus 2026",
      registrationDate: "2026-06-01",
      ktp: "3172014311840005",
      meningitis: true,
      photo: true,
      koperBesar: true,
      koperKabin: true,
      batik: true,
      bukuDomisili: true,
      kainIhram: false,
      sabuk: "",
      kerudungMerah: true,
      kerudungPutih: true,
      tasSelempang: true,
      tasSandal: true,
      syall: true,
      paymentOption: "DP",
      totalAmount: 30000000,
      paidAmount: 10000000,
      paymentMethod: "Transfer Bank BCA",
      paymentDate: "2026-06-01",
      paymentNotes: "DP Uang Muka Paket Yamani"
    },
    { 
      id: "P-1003", 
      formId: "FRM-004",
      name: "Muhammad Ali", 
      passport: "C9876543", 
      group: "Group B-2", 
      umrahPackage: "Raudhah", 
      gender: "Laki-laki", 
      age: 65, 
      phone: "+966 50 987 6543",
      visaNumber: "VSA-2026-10030-SA",
      nationality: "Indonesia",
      birthDate: "20 Jan 1961",
      emergencyContact: "Anak (+62 813-5555-6666)",
      tourLeader: "Ust. Syafiq Riza",
      mutawifLocal: "Syeikh Bilal",
      hotel: "Clock Tower Makkah",
      hotelMakkah: "Clock Tower Makkah",
      hotelMadinah: "Anwar Al Madinah Movenpick",
      departureDate: "01 September 2026",
      returnDate: "13 September 2026",
      registrationDate: "2026-06-05",
      ktp: "3271052001610002",
      meningitis: true,
      photo: false,
      koperBesar: true,
      koperKabin: true,
      batik: true,
      bukuDomisili: true,
      kainIhram: true,
      sabuk: "XL",
      kerudungMerah: false,
      kerudungPutih: false,
      tasSelempang: true,
      tasSandal: true,
      syall: true,
      paymentOption: "Bayar Lunas",
      totalAmount: 32000000,
      paidAmount: 32000000,
      paymentMethod: "Transfer Mandiri",
      paymentDate: "2026-06-05",
      paymentNotes: "Pembayaran lunas Paket Raudhah"
    },
    { 
      id: "P-1004", 
      formId: "FRM-005",
      name: "Aisha Rahman", 
      passport: "D3456789", 
      group: "Group C-3", 
      umrahPackage: "Multazam", 
      gender: "Perempuan", 
      age: 38, 
      phone: "+966 50 345 6789",
      visaNumber: "VSA-2026-10040-SA",
      nationality: "Indonesia",
      birthDate: "15 Jul 1988",
      emergencyContact: "Keluarga (+62 815-7777-8888)",
      tourLeader: "Ust. Firanda",
      mutawifLocal: "Syeikh Tariq",
      hotel: "Anjum Hotel Makkah",
      hotelMakkah: "Anjum Hotel Makkah",
      hotelMadinah: "Anwar Al Madinah Movenpick",
      departureDate: "10 Oktober 2026",
      returnDate: "22 Oktober 2026",
      registrationDate: "2026-06-10",
      ktp: "3174025507880004",
      meningitis: false,
      photo: true,
      koperBesar: false,
      koperKabin: false,
      batik: false,
      bukuDomisili: true,
      kainIhram: false,
      sabuk: "",
      kerudungMerah: true,
      kerudungPutih: false,
      tasSelempang: false,
      tasSandal: false,
      syall: false,
      paymentOption: "Belum Bayar",
      totalAmount: 30000000,
      paidAmount: 0,
      paymentMethod: "",
      paymentDate: "",
      paymentNotes: "Belum Ada Pembayaran"
    },
  ],
  groups: [
    { id: "G-000", name: "Kloter 4 Al-Barakah", kloter: "SV-819", pilgrims: 48, tourLeader: "Ust. H. Muhammad Ridwan (TL)", mutawif: "Ust. Ibrahim Al-Madani", status: "Active" },
    { id: "G-001", name: "Group A-1", kloter: "KNO-01", pilgrims: 45, tourLeader: "Ust. Khalid Basalamah", mutawif: "Syeikh Ammar", status: "Active" },
    { id: "G-002", name: "Group A-2", kloter: "KNO-02", pilgrims: 44, tourLeader: "Ust. Syafiq Riza", mutawif: "Syeikh Bilal", status: "Active" },
    { id: "G-003", name: "Group B-1", kloter: "CGK-12", pilgrims: 40, tourLeader: "Ust. Firanda", mutawif: "Syeikh Tariq", status: "Draft" },
  ],
  families: [
    { id: "F-101", name: "Keluarga Ahmad", head: "Ahmad Abdullah", members: 4, group: "Group A-1", status: "Complete" },
    { id: "F-102", name: "Keluarga Rahman", head: "Abdul Rahman", members: 2, group: "Group A-1", status: "Incomplete" },
    { id: "F-103", name: "Keluarga Hasyim", head: "Hasyim Ashari", members: 5, group: "Group B-2", status: "Complete" },
  ],
  tourLeaders: [
    { id: "TL-001", name: "Ust. Khalid Basalamah", phone: "+62 812 3456 7890", group: "Group A-1", experience: "10 tahun", status: "Active" },
    { id: "TL-002", name: "Ust. Syafiq Riza", phone: "+62 813 4567 8901", group: "Group A-2", experience: "8 tahun", status: "Active" },
    { id: "TL-003", name: "Ust. Firanda", phone: "+62 814 5678 9012", group: "Group B-1", experience: "6 tahun", status: "Resting" },
  ],
  mutawifs: [
    { id: "M-001", name: "Syeikh Ammar", language: "Arabic, IND", experience: "8 years", group: "Group A-1", status: "Active" },
    { id: "M-002", name: "Syeikh Bilal", language: "Arabic, ENG", experience: "5 years", group: "Group A-2", status: "Active" },
    { id: "M-003", name: "Syeikh Tariq", language: "Arabic, IND, ENG", experience: "12 years", group: "Group B-1", status: "Standby" },
  ],
  schedules: [
    {
      id: "S-001",
      dayNumber: 1,
      date: "2026-07-26",
      time: "08:30",
      title: "Berkumpul di Bandara Soekarno-Hatta (CGK)",
      location: "Terminal 3 Bandara Soekarno Hatta",
      keterangan: "Pemeriksaan pasport, penyerahan koper, dan pengarahan singkat oleh Tour Leader",
      category: "transit",
      pic: "Ust. Khalid Basalamah",
    },
    {
      id: "S-002",
      dayNumber: 1,
      date: "2026-07-26",
      time: "12:45",
      title: "Penerbangan CGK - JED (Saudia Airlines SV-819)",
      location: "Pesawat Saudia Airlines",
      keterangan: "Takeoff menuju Jeddah, estimasi penerbangan 9 jam 30 menit",
      category: "transit",
      pic: "Ust. Khalid Basalamah",
    },
    {
      id: "S-003",
      dayNumber: 1,
      date: "2026-07-26",
      time: "18:20",
      title: "Tiba di Bandara King Abdulaziz Jeddah & Check-in Hotel Madinah",
      location: "Anwar Al Madinah Movenpick Hotel",
      keterangan: "Proses imigrasi, pengambilan bagasi koper, dan perjalanan bus AC menuju Madinah",
      category: "hotel",
      pic: "Syeikh Ammar (Mutawif)",
    },
    {
      id: "S-004",
      dayNumber: 2,
      date: "2026-07-27",
      time: "03:30",
      title: "Qiyamul Lail & Shalat Subuh Berjamaah",
      location: "Masjid Nabawi Madinah",
      keterangan: "Ibadah mandiri & keutamaan shalat di Masjid Nabawi",
      category: "ibadah",
      pic: "Ust. Khalid Basalamah",
    },
    {
      id: "S-005",
      dayNumber: 2,
      date: "2026-07-27",
      time: "07:00",
      title: "Sarapan Pagi di Restoran Hotel",
      location: "Restoran Utama Movenpick Madinah",
      keterangan: "Prasmanan masakan Indonesia & Internasional",
      category: "makan",
      pic: "Tim Konsumsi Hotel",
    },
    {
      id: "S-006",
      dayNumber: 2,
      date: "2026-07-27",
      time: "08:30",
      title: "Ziyarah Dalam & Ziarah Raudhah (Raudhah Sharif)",
      location: "Masjid Nabawi - Bab Al-Salam & Raudhah",
      keterangan: "Sesuai tasrih/izin Nusuk. Ziarah Makam Rasulullah SAW, Abu Bakar RA, dan Umar RA",
      category: "ziyarah",
      pic: "Syeikh Ammar (Mutawif)",
    },
    {
      id: "S-007",
      dayNumber: 2,
      date: "2026-07-27",
      time: "16:00",
      title: "Manasik Pemantapan & Persiapan Ihram Makkah",
      location: "Ballroom Hotel Movenpick Lt. 2",
      keterangan: "Pengarahan larangan ihram, rukun umrah, dan koordinasi keberangkatan besok ke Makkah",
      category: "manasik",
      pic: "Ust. Khalid Basalamah",
    },
    {
      id: "S-008",
      dayNumber: 3,
      date: "2026-07-28",
      time: "09:00",
      title: "Ziyarah Luar Kota Madinah (Masjid Quba & Jabal Uhud)",
      location: "Masjid Quba, Jabal Uhud, Pasar Kurma",
      keterangan: "Shalat 2 rakaat di Masjid Quba (Pahala Umrah), ziarah syuhada Uhud",
      category: "ziyarah",
      pic: "Syeikh Ammar (Mutawif)",
    },
    {
      id: "S-009",
      dayNumber: 3,
      date: "2026-07-28",
      time: "14:00",
      title: "Check-out Hotel & Ambil Miqat di Masjid Bir Ali",
      location: "Masjid Bir Ali (Dzulhulaifah)",
      keterangan: "Mandi ihram di hotel, niat Umrah di Bir Ali, berpakaian ihram full",
      category: "transit",
      pic: "Ust. Khalid Basalamah",
    },
    {
      id: "S-010",
      dayNumber: 3,
      date: "2026-07-28",
      time: "20:00",
      title: "Tiba di Makkah & Pelaksanaan Tawaf, Sa'i, Tahallul (Umrah Wajib)",
      location: "Masjidil Haram Makkah",
      keterangan: "Check-in Swissôtel Al Maqam, dilanjutkan Umrah Wajib dipimpin Mutawif secara berkelompok",
      category: "ibadah",
      pic: "Syeikh Ammar & Ust. Khalid",
    },
    {
      id: "S-011",
      dayNumber: 4,
      date: "2026-07-29",
      time: "08:00",
      title: "Ziyarah Makkah Al-Mukarramah",
      location: "Jabal Tsur, Padang Arafah, Jabal Rahmah, Muzdalifah, Mina",
      keterangan: "Mengenal situs-situs bersejarah pelaksanaan ibadah Hajj & Umrah",
      category: "ziyarah",
      pic: "Syeikh Ammar (Mutawif)",
    },
    {
      id: "S-012",
      dayNumber: 5,
      date: "2026-07-30",
      time: "16:00",
      title: "Tawaf Wada' (Tawaf Perpisahan) & Persiapan Pulang",
      location: "Masjidil Haram Makkah",
      keterangan: "Pelaksanaan Tawaf Perpisahan sebelum meninggalkan kota suci Makkah",
      category: "ibadah",
      pic: "Ust. Khalid Basalamah",
    }
  ],
  emergencies: [
    { id: "SOS-2991", pilgrim: "Ahmad Abdullah", group: "Group A-1", location: "Gate 1, Masjidil Haram", date: "2024-06-01", time: "14:30", type: "Medical Emergency", status: "Active" },
    { id: "SOS-2990", pilgrim: "Siti Aminah", group: "Group B-2", location: "Jabal Rahmah", date: "2024-06-02", time: "09:15", type: "Lost Person", status: "Resolved" },
  ],
  rooms: [
    {
      id: "RM-101",
      category: "DOUBLE",
      roomLabel: "DOUBLE 1",
      roomNumber: "",
      kloter: "Kloter 4 Al-Barakah",
      hotelLocation: "Makkah",
      hotelName: "Swissôtel Al Maqam Makkah",
      occupants: [
        { id: "OC-1", no: 1, title: "MR", name: "IWAN GUNAWAN", age: "" },
        { id: "OC-2", no: 2, title: "MRS", name: "DIAN MARDIANA", age: "" }
      ]
    },
    {
      id: "RM-102",
      category: "DOUBLE",
      roomLabel: "DOUBLE 2",
      roomNumber: "",
      kloter: "Kloter 4 Al-Barakah",
      hotelLocation: "Makkah",
      hotelName: "Swissôtel Al Maqam Makkah",
      occupants: [
        { id: "OC-3", no: 3, title: "MR", name: "DENI APRILIA RAMA CUJAYA", age: "" },
        { id: "OC-4", no: 4, title: "MRS", name: "MUTTOWIF", age: "" }
      ]
    },
    {
      id: "RM-103",
      category: "TRIPLE",
      roomLabel: "TRIPLE 1",
      roomNumber: "",
      kloter: "Kloter 4 Al-Barakah",
      hotelLocation: "Makkah",
      hotelName: "Swissôtel Al Maqam Makkah",
      occupants: [
        { id: "OC-5", no: 5, title: "MRS", name: "CUMIATI HARNO WIRYA WINATA", age: 48 },
        { id: "OC-6", no: 6, title: "MRS", name: "KARISA PUTRI ABD ROSYID", age: 18 },
        { id: "OC-7", no: 7, title: "MRS", name: "BELA APRILIA", age: 23 }
      ]
    },
    {
      id: "RM-104",
      category: "TRIPLE",
      roomLabel: "TRIPLE 2",
      roomNumber: "",
      kloter: "Kloter 4 Al-Barakah",
      hotelLocation: "Makkah",
      hotelName: "Swissôtel Al Maqam Makkah",
      occupants: [
        { id: "OC-8", no: 8, title: "MRS", name: "JENAB ESWI ADAM", age: 75 },
        { id: "OC-9", no: 9, title: "MRS", name: "IJAH SANI ADAM", age: 66 },
        { id: "OC-10", no: 10, title: "MRS", name: "RUMSIH SANI KARTA", age: 69 }
      ]
    },
    {
      id: "RM-105",
      category: "QUAD",
      roomLabel: "QUAD 1",
      roomNumber: "",
      kloter: "Kloter 4 Al-Barakah",
      hotelLocation: "Makkah",
      hotelName: "Swissôtel Al Maqam Makkah",
      occupants: [
        { id: "OC-11", no: 11, title: "MRS", name: "TASIH DASTA KERTA ATMAJA", age: 57 },
        { id: "OC-12", no: 12, title: "MRS", name: "NUNUNG NURYANAH", age: 45 },
        { id: "OC-13", no: 13, title: "MRS", name: "ENGKAN KANIA", age: 54 },
        { id: "OC-14", no: 14, title: "MRS", name: "NINA SITI HOERUN NISA", age: 32 }
      ]
    },
    {
      id: "RM-106",
      category: "QUAD",
      roomLabel: "QUAD 2",
      roomNumber: "",
      kloter: "Kloter 4 Al-Barakah",
      hotelLocation: "Makkah",
      hotelName: "Swissôtel Al Maqam Makkah",
      occupants: [
        { id: "OC-15", no: 15, title: "MRS", name: "SUHESTI WASNADI USTARA", age: 61 },
        { id: "OC-16", no: 16, title: "MRS", name: "SULASTRI JAMAD", age: 52 },
        { id: "OC-17", no: 17, title: "MRS", name: "RUSMINAH SANIRAH", age: 76 },
        { id: "OC-18", no: 18, title: "MRS", name: "NURHAENI RUSMINAH", age: 54 }
      ]
    },
    {
      id: "RM-107",
      category: "QUINT",
      roomLabel: "QUINT 1",
      roomNumber: "",
      kloter: "Kloter 4 Al-Barakah",
      hotelLocation: "Makkah",
      hotelName: "Swissôtel Al Maqam Makkah",
      occupants: [
        { id: "OC-19", no: 19, title: "MR", name: "KASIM JOHARI JAYA DISASTRA", age: 57 },
        { id: "OC-20", no: 20, title: "MR", name: "UDIN SAPRUDIN", age: 45 },
        { id: "OC-21", no: 21, title: "MR", name: "CARTONO SITI RUBAEAH", age: 54 },
        { id: "OC-22", no: 22, title: "MR", name: "SUHEDI SANTANI MUSTARI", age: 50 },
        { id: "OC-23", no: 23, title: "MR", name: "ANDI KUSWANDI", age: 48 }
      ]
    }
  ],
  staffStocks: [
    {
      id: "STK-101",
      name: "Kain Ihram Pria (Set)",
      category: "Perlengkapan Jamaah",
      quantity: 85,
      minStock: 50,
      unit: "Set",
      location: "Gudang Utama Jakarta",
      lastUpdated: "2026-07-28",
      notes: "Kualitas premium katun super"
    },
    {
      id: "STK-102",
      name: "Mukena & Kerudung Jamaah",
      category: "Perlengkapan Jamaah",
      quantity: 110,
      minStock: 60,
      unit: "Pcs",
      location: "Gudang Utama Jakarta",
      lastUpdated: "2026-07-28",
      notes: "Seragam wanita kloter juli"
    },
    {
      id: "STK-103",
      name: "Seragam Batik Jamaah",
      category: "Perlengkapan Jamaah",
      quantity: 140,
      minStock: 100,
      unit: "Pcs",
      location: "Gudang Utama Jakarta",
      lastUpdated: "2026-07-27",
      notes: "Ukuran campur M/L/XL/XXL"
    },
    {
      id: "STK-104",
      name: "Rompi Staf & Tour Leader",
      category: "Seragam Staf",
      quantity: 12,
      minStock: 15,
      unit: "Pcs",
      location: "Posko Makkah",
      lastUpdated: "2026-07-28",
      notes: "Stok menipis, perlu pengiriman tambahan dari Jakarta"
    },
    {
      id: "STK-105",
      name: "Walkie Talkie & Audio Set",
      category: "Peralatan Operasional",
      quantity: 18,
      minStock: 20,
      unit: "Unit",
      location: "Posko Madinah",
      lastUpdated: "2026-07-26",
      notes: "Transmitter & receiver panduan tawaf"
    },
    {
      id: "STK-106",
      name: "Tas Selempang Paspor Jamaah",
      category: "Dokumen & Identitas",
      quantity: 210,
      minStock: 100,
      unit: "Pcs",
      location: "Gudang Utama Jakarta",
      lastUpdated: "2026-07-25",
      notes: "Waterproof logo DNA Tour"
    },
    {
      id: "STK-107",
      name: "Tali Lanyard & Card Holder ID",
      category: "Dokumen & Identitas",
      quantity: 8,
      minStock: 50,
      unit: "Pcs",
      location: "Posko Makkah",
      lastUpdated: "2026-07-28",
      notes: "Stok hampir habis di Makkah"
    },
    {
      id: "STK-108",
      name: "Kit P3K & Obat Pertolongan Pertama",
      category: "Kesehatan",
      quantity: 9,
      minStock: 10,
      unit: "Box",
      location: "Tim Tour Leader",
      lastUpdated: "2026-07-27",
      notes: "Termasuk suplemen & masker"
    },
    {
      id: "STK-109",
      name: "Payung Lipat Umrah",
      category: "Perlengkapan Jamaah",
      quantity: 0,
      minStock: 30,
      unit: "Pcs",
      location: "Gudang Utama Jakarta",
      lastUpdated: "2026-07-20",
      notes: "Stok habis, menunggu pembongkaran vendor"
    },
    {
      id: "STK-110",
      name: "Sabuk Ihram Multi-Pocket",
      category: "Perlengkapan Jamaah",
      quantity: 95,
      minStock: 40,
      unit: "Pcs",
      location: "Gudang Utama Jakarta",
      lastUpdated: "2026-07-26",
      notes: "Sabuk tanpa jahitan"
    }
  ],

  financeTransactions: [
    {
      id: "TRX-2026-001",
      pilgrimId: "PL-88210",
      pilgrimName: "H. Ahmad Zaki Al-Farizi",
      type: "Pemasukan (Lunas)",
      category: "Pendaftaran Umrah",
      amount: 35000000,
      paymentMethod: "Transfer BCA",
      date: "2026-05-10",
      status: "Berhasil",
      notes: "Pembayaran lunas Paket Multazam",
      referenceNo: "BCA-9882104"
    },
    {
      id: "TRX-2026-002",
      pilgrimId: "P-1001",
      pilgrimName: "Ahmad Abdullah",
      type: "Pemasukan (DP)",
      category: "Pendaftaran Umrah",
      amount: 10000000,
      paymentMethod: "Transfer Mandiri",
      date: "2026-06-01",
      status: "Berhasil",
      notes: "DP Uang Muka Paket Yamani",
      referenceNo: "MDR-5541029"
    },
    {
      id: "TRX-2026-003",
      pilgrimId: "P-1002",
      pilgrimName: "Fatima Zahra",
      type: "Pemasukan (DP)",
      category: "Pendaftaran Umrah",
      amount: 10000000,
      paymentMethod: "Transfer Bank BCA",
      date: "2026-06-01",
      status: "Berhasil",
      notes: "DP Uang Muka Paket Yamani",
      referenceNo: "BCA-1029388"
    },
    {
      id: "TRX-2026-004",
      pilgrimId: "P-1003",
      pilgrimName: "Muhammad Ali",
      type: "Pemasukan (Lunas)",
      category: "Pendaftaran Umrah",
      amount: 32000000,
      paymentMethod: "Transfer Mandiri",
      date: "2026-06-05",
      status: "Berhasil",
      notes: "Pembayaran lunas Paket Raudhah",
      referenceNo: "MDR-8812003"
    },
    {
      id: "TRX-2026-005",
      pilgrimName: "PT Sinar Busana - Vendor Konveksi",
      type: "Pengeluaran",
      category: "Perlengkapan",
      amount: 12500000,
      paymentMethod: "Transfer BCA",
      date: "2026-07-15",
      status: "Berhasil",
      notes: "Pengadaan 50 unit Koper Besar, Batik Seragam & Ihram Kloter 4",
      referenceNo: "EXP-2026-012"
    },
    {
      id: "TRX-2026-006",
      pilgrimName: "Saudia Airlines - Tiket Group",
      type: "Pengeluaran",
      category: "Akomodasi & Tiket",
      amount: 45000000,
      paymentMethod: "Transfer Mandiri",
      date: "2026-07-18",
      status: "Berhasil",
      notes: "DP Blocking Seats Saudia Airlines CGK-JED PP (30 Pax)",
      referenceNo: "EXP-2026-015"
    },
    {
      id: "TRX-2026-007",
      pilgrimName: "Swissôtel Al Maqam Makkah",
      type: "Pengeluaran",
      category: "Akomodasi & Tiket",
      amount: 28000000,
      paymentMethod: "Transfer BSI",
      date: "2026-07-20",
      status: "Berhasil",
      notes: "Pelunasan DP Hotel Makkah Bintang 5 (10 Kamar Quad)",
      referenceNo: "EXP-2026-019"
    },
    {
      id: "TRX-2026-008",
      pilgrimName: "Ust. Ibrahim Al-Madani",
      type: "Pengeluaran",
      category: "Operasional",
      amount: 6500000,
      paymentMethod: "Tunai",
      date: "2026-07-22",
      status: "Berhasil",
      notes: "Honor & Bisyarah Muthawwif Lokal Kloter 4 Madinah-Makkah",
      referenceNo: "EXP-2026-022"
    },
    {
      id: "TRX-2026-009",
      pilgrimName: "SAPTCO Bus Transport KSA",
      type: "Pengeluaran",
      category: "Operasional",
      amount: 9800000,
      paymentMethod: "Transfer BCA",
      date: "2026-07-25",
      status: "Berhasil",
      notes: "Sewa 1 Unit Bus VIP SAPTCO Ziyarah Makkah & Madinah",
      referenceNo: "EXP-2026-025"
    }
  ],

  addPilgrim: (p) => set((state) => {
    // Find matching group to auto-inherit tour leader and mutawif if not specified
    const matchedGroup = state.groups.find(g => g.name === p.group || g.kloter === p.group);
    const enrichedPilgrim: Pilgrim = {
      ...p,
      tourLeader: p.tourLeader || matchedGroup?.tourLeader || '',
      mutawifLocal: p.mutawifLocal || matchedGroup?.mutawif || '',
      hotelMakkah: p.hotelMakkah || p.hotel || 'Swissôtel Al Maqam Makkah',
      hotelMadinah: p.hotelMadinah || 'Anwar Al Madinah Movenpick',
    };

    let newTxs = [...state.financeTransactions];
    // If pilgrim is registered with initial payment, auto-generate exactly ONE Finance Transaction
    if (enrichedPilgrim.paidAmount && enrichedPilgrim.paidAmount > 0 && enrichedPilgrim.paymentOption !== 'Belum Bayar') {
      const existingTx = newTxs.find(t => (t.pilgrimId && t.pilgrimId === enrichedPilgrim.id) || (t.referenceNo === `REG-${enrichedPilgrim.id}`));
      if (!existingTx) {
        const autoTx: FinanceTransaction = {
          id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          pilgrimId: enrichedPilgrim.id,
          pilgrimName: enrichedPilgrim.name,
          type: enrichedPilgrim.paymentOption === 'Bayar Lunas' ? 'Pemasukan (Lunas)' : 'Pemasukan (DP)',
          category: 'Pendaftaran Umrah',
          amount: Number(enrichedPilgrim.paidAmount) || 0,
          paymentMethod: enrichedPilgrim.paymentMethod || 'Transfer BCA',
          date: enrichedPilgrim.paymentDate || new Date().toISOString().split('T')[0],
          status: 'Berhasil',
          notes: enrichedPilgrim.paymentNotes || (enrichedPilgrim.paymentOption === 'Bayar Lunas' ? `Pembayaran Lunas Pendaftaran - ${enrichedPilgrim.name}` : `DP Pendaftaran Umrah - ${enrichedPilgrim.name}`),
          referenceNo: `REG-${enrichedPilgrim.id}`
        };
        newTxs = [autoTx, ...newTxs];
      }
    }

    const newPilgrims = [enrichedPilgrim, ...state.pilgrims];
    const syncedPilgrims = syncPilgrimPaymentsWithTxs(newPilgrims, newTxs);

    // Sync group pilgrim counts
    const updatedGroups = state.groups.map(g => {
      const count = syncedPilgrims.filter(x => x.group === g.name || x.group === g.kloter).length;
      return count > 0 ? { ...g, pilgrims: count } : g;
    });

    return {
      pilgrims: syncedPilgrims,
      financeTransactions: newTxs,
      groups: updatedGroups
    };
  }),

  updatePilgrim: (id, updates) => set((state) => {
    const prevPilgrim = state.pilgrims.find(p => p.id === id);
    if (!prevPilgrim) return state;

    const matchedGroup = updates.group 
      ? state.groups.find(g => g.name === updates.group || g.kloter === updates.group)
      : null;

    const updatedPilgrim: Pilgrim = {
      ...prevPilgrim,
      ...updates,
      tourLeader: updates.tourLeader ?? (matchedGroup ? matchedGroup.tourLeader : prevPilgrim.tourLeader),
      mutawifLocal: updates.mutawifLocal ?? (matchedGroup ? matchedGroup.mutawif : prevPilgrim.mutawifLocal),
    };

    let updatedTxs = [...state.financeTransactions];

    // If name changed, synchronize transactions and room occupants
    if (updates.name && updates.name !== prevPilgrim.name) {
      updatedTxs = updatedTxs.map(t => 
        (t.pilgrimId === id || t.pilgrimName.trim().toLowerCase() === prevPilgrim.name.trim().toLowerCase())
          ? { ...t, pilgrimName: updates.name! }
          : t
      );
    }

    // If paid amount changed manually on pilgrim
    if (updates.paidAmount !== undefined && updates.paidAmount !== prevPilgrim.paidAmount) {
      const pilgrimTxIndex = updatedTxs.findIndex(t => t.pilgrimId === id || t.referenceNo === `REG-${id}`);
      if (pilgrimTxIndex >= 0) {
        updatedTxs[pilgrimTxIndex] = {
          ...updatedTxs[pilgrimTxIndex],
          amount: Number(updates.paidAmount) || 0,
          type: updates.paymentOption === 'Bayar Lunas' ? 'Pemasukan (Lunas)' : 'Pemasukan (DP)',
          paymentMethod: updates.paymentMethod || updatedTxs[pilgrimTxIndex].paymentMethod,
          date: updates.paymentDate || updatedTxs[pilgrimTxIndex].date,
          status: 'Berhasil'
        };
      } else if (Number(updates.paidAmount) > 0) {
        const autoTx: FinanceTransaction = {
          id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          pilgrimId: id,
          pilgrimName: updatedPilgrim.name,
          type: updatedPilgrim.paymentOption === 'Bayar Lunas' ? 'Pemasukan (Lunas)' : 'Pemasukan (DP)',
          category: 'Pendaftaran Umrah',
          amount: Number(updates.paidAmount) || 0,
          paymentMethod: updatedPilgrim.paymentMethod || 'Transfer BCA',
          date: updatedPilgrim.paymentDate || new Date().toISOString().split('T')[0],
          status: 'Berhasil',
          notes: updatedPilgrim.paymentNotes || `Penyesuaian pembayaran ${updatedPilgrim.name}`,
          referenceNo: `REG-${id}`
        };
        updatedTxs = [autoTx, ...updatedTxs];
      }
    }

    // Sync room occupants if name changed
    let updatedRooms = state.rooms;
    if (updates.name && updates.name !== prevPilgrim.name) {
      updatedRooms = state.rooms.map(r => ({
        ...r,
        occupants: r.occupants.map(o => 
          o.name.trim().toLowerCase() === prevPilgrim.name.trim().toLowerCase()
            ? { ...o, name: updates.name! }
            : o
        )
      }));
    }

    const updatedPilgrimsList = state.pilgrims.map(p => p.id === id ? updatedPilgrim : p);
    const syncedPilgrims = syncPilgrimPaymentsWithTxs(updatedPilgrimsList, updatedTxs);

    // Sync group pilgrim counts
    const updatedGroups = state.groups.map(g => {
      const count = syncedPilgrims.filter(x => x.group === g.name || x.group === g.kloter).length;
      return count > 0 ? { ...g, pilgrims: count } : g;
    });

    return {
      pilgrims: syncedPilgrims,
      financeTransactions: updatedTxs,
      rooms: updatedRooms,
      groups: updatedGroups
    };
  }),
  deletePilgrim: (id) => set((state) => {
    const item = state.pilgrims.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Jamaah',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      pilgrims: state.pilgrims.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  deletePilgrims: (ids) => set((state) => {
    const itemsToDelete = state.pilgrims.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id,
      type: 'Jamaah',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      pilgrims: state.pilgrims.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),

  addGroup: (g) => set((state) => ({ groups: [g, ...state.groups] })),
  updateGroup: (id, updates) => set((state) => {
    const prevGroup = state.groups.find(g => g.id === id);
    if (!prevGroup) return state;

    const updatedGroups = state.groups.map(g => g.id === id ? { ...g, ...updates } : g);
    const updatedGroupName = updates.name || prevGroup.name;

    // Sync pilgrims in this group
    let updatedPilgrims = state.pilgrims.map(p => {
      if (p.group === prevGroup.name || p.group === prevGroup.kloter) {
        return {
          ...p,
          group: updatedGroupName,
          tourLeader: updates.tourLeader ?? p.tourLeader,
          mutawifLocal: updates.mutawif ?? p.mutawifLocal,
        };
      }
      return p;
    });

    // Sync tour leaders
    let updatedTourLeaders = state.tourLeaders;
    if (updates.tourLeader && updates.tourLeader !== prevGroup.tourLeader) {
      updatedTourLeaders = state.tourLeaders.map(tl => {
        if (tl.name.trim().toLowerCase() === updates.tourLeader!.trim().toLowerCase()) {
          return { ...tl, group: updatedGroupName, status: 'Active' };
        }
        if (tl.group === prevGroup.name && tl.name !== updates.tourLeader) {
          return { ...tl, group: 'Unassigned' };
        }
        return tl;
      });
    }

    // Sync mutawifs
    let updatedMutawifs = state.mutawifs;
    if (updates.mutawif && updates.mutawif !== prevGroup.mutawif) {
      updatedMutawifs = state.mutawifs.map(m => {
        if (m.name.trim().toLowerCase() === updates.mutawif!.trim().toLowerCase()) {
          return { ...m, group: updatedGroupName, status: 'Active' };
        }
        if (m.group === prevGroup.name && m.name !== updates.mutawif) {
          return { ...m, group: 'Unassigned' };
        }
        return m;
      });
    }

    return {
      groups: updatedGroups,
      pilgrims: updatedPilgrims,
      tourLeaders: updatedTourLeaders,
      mutawifs: updatedMutawifs,
    };
  }),
  deleteGroup: (id) => set((state) => {
    const item = state.groups.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Kloter',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      groups: state.groups.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  deleteGroups: (ids) => set((state) => {
    const itemsToDelete = state.groups.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id,
      type: 'Kloter',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      groups: state.groups.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),

  addFamily: (f) => set((state) => ({ families: [f, ...state.families] })),
  updateFamily: (id, updates) => set((state) => ({ families: state.families.map(f => f.id === id ? { ...f, ...updates } : f) })),
  deleteFamily: (id) => set((state) => {
    const item = state.families.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Keluarga',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      families: state.families.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  deleteFamilies: (ids) => set((state) => {
    const itemsToDelete = state.families.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id,
      type: 'Keluarga',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      families: state.families.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),

  addTourLeader: (t) => set((state) => ({ tourLeaders: [t, ...state.tourLeaders] })),
  updateTourLeader: (id, updates) => set((state) => {
    const prevLeader = state.tourLeaders.find(t => t.id === id);
    if (!prevLeader) return state;

    const updatedLeader = { ...prevLeader, ...updates };
    const updatedTourLeaders = state.tourLeaders.map(t => t.id === id ? updatedLeader : t);

    // Sync with group if group is assigned
    let updatedGroups = state.groups;
    if (updates.group && updates.group !== 'Unassigned' && updates.group !== '-') {
      updatedGroups = state.groups.map(g => 
        (g.name === updates.group || g.kloter === updates.group)
          ? { ...g, tourLeader: updatedLeader.name }
          : g
      );
    }

    // Sync pilgrims tourLeader
    let updatedPilgrims = state.pilgrims;
    if (updates.name && updates.name !== prevLeader.name) {
      updatedPilgrims = state.pilgrims.map(p => 
        p.tourLeader === prevLeader.name ? { ...p, tourLeader: updates.name! } : p
      );
    } else if (updates.group && updates.group !== 'Unassigned') {
      updatedPilgrims = state.pilgrims.map(p => 
        (p.group === updates.group) ? { ...p, tourLeader: updatedLeader.name } : p
      );
    }

    return {
      tourLeaders: updatedTourLeaders,
      groups: updatedGroups,
      pilgrims: updatedPilgrims
    };
  }),
  deleteTourLeader: (id) => set((state) => {
    const item = state.tourLeaders.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Tour Leader',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      tourLeaders: state.tourLeaders.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  deleteTourLeaders: (ids) => set((state) => {
    const itemsToDelete = state.tourLeaders.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id,
      type: 'Tour Leader',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      tourLeaders: state.tourLeaders.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),

  addMutawif: (m) => set((state) => ({ mutawifs: [m, ...state.mutawifs] })),
  updateMutawif: (id, updates) => set((state) => {
    const prevMutawif = state.mutawifs.find(m => m.id === id);
    if (!prevMutawif) return state;

    const updatedMutawif = { ...prevMutawif, ...updates };
    const updatedMutawifs = state.mutawifs.map(m => m.id === id ? updatedMutawif : m);

    // Sync with group if group is assigned
    let updatedGroups = state.groups;
    if (updates.group && updates.group !== 'Unassigned' && updates.group !== '-') {
      updatedGroups = state.groups.map(g => 
        (g.name === updates.group || g.kloter === updates.group)
          ? { ...g, mutawif: updatedMutawif.name }
          : g
      );
    }

    // Sync pilgrims mutawifLocal
    let updatedPilgrims = state.pilgrims;
    if (updates.name && updates.name !== prevMutawif.name) {
      updatedPilgrims = state.pilgrims.map(p => 
        p.mutawifLocal === prevMutawif.name ? { ...p, mutawifLocal: updates.name! } : p
      );
    } else if (updates.group && updates.group !== 'Unassigned') {
      updatedPilgrims = state.pilgrims.map(p => 
        (p.group === updates.group) ? { ...p, mutawifLocal: updatedMutawif.name } : p
      );
    }

    return {
      mutawifs: updatedMutawifs,
      groups: updatedGroups,
      pilgrims: updatedPilgrims
    };
  }),
  deleteMutawif: (id) => set((state) => {
    const item = state.mutawifs.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Mutawif',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      mutawifs: state.mutawifs.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  deleteMutawifs: (ids) => set((state) => {
    const itemsToDelete = state.mutawifs.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id,
      type: 'Mutawif',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      mutawifs: state.mutawifs.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),

  addSchedule: (s) => set((state) => ({ schedules: [s, ...state.schedules] })),
  updateSchedule: (id, updates) => set((state) => ({ schedules: state.schedules.map(s => s.id === id ? { ...s, ...updates } : s) })),
  deleteSchedule: (id) => set((state) => {
    const item = state.schedules.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Jadwal',
      name: item.title || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      schedules: state.schedules.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  deleteSchedules: (ids) => set((state) => {
    const itemsToDelete = state.schedules.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id,
      type: 'Jadwal',
      name: item.title || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      schedules: state.schedules.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),
  
  resolveEmergency: (id) => set((state) => ({ emergencies: state.emergencies.map(e => e.id === id ? { ...e, status: 'Resolved' } : e) })),
  addEmergency: (e) => set((state) => ({ emergencies: [e, ...state.emergencies] })),
  updateEmergency: (id, updates) => set((state) => ({
    emergencies: state.emergencies.map(e => e.id === id ? { ...e, ...updates } : e)
  })),
  deleteEmergency: (id) => set((state) => {
    const item = state.emergencies.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Darurat',
      name: `${item.id} - ${item.pilgrim} (${item.type})`,
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      emergencies: state.emergencies.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  deleteEmergencies: (ids) => set((state) => {
    const itemsToDelete = state.emergencies.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id,
      type: 'Darurat',
      name: `${item.id} - ${item.pilgrim} (${item.type})`,
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      emergencies: state.emergencies.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),

  addRoom: (room) => set((state) => ({ rooms: [room, ...state.rooms] })),
  updateRoom: (id, updates) => set((state) => ({
    rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  deleteRoom: (id) => set((state) => {
    const item = state.rooms.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Kamar',
      name: item.roomNumber || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      rooms: state.rooms.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  addOccupantToRoom: (roomId, occupant) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    const updatedRooms = state.rooms.map(r => r.id === roomId ? { ...r, occupants: [occupant, ...r.occupants] } : r);

    // Sync pilgrim hotel info if matched
    let updatedPilgrims = state.pilgrims;
    if (room && occupant.name) {
      updatedPilgrims = state.pilgrims.map(p => {
        if (p.name.trim().toLowerCase() === occupant.name.trim().toLowerCase()) {
          return {
            ...p,
            hotelMakkah: room.hotelLocation === 'Makkah' ? room.hotelName : p.hotelMakkah,
            hotelMadinah: room.hotelLocation === 'Madinah' ? room.hotelName : p.hotelMadinah,
            hotel: room.hotelName,
          };
        }
        return p;
      });
    }

    return {
      rooms: updatedRooms,
      pilgrims: updatedPilgrims
    };
  }),
  removeOccupantFromRoom: (roomId, occupantId) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return state;
    const occupant = room.occupants.find(o => o.id === occupantId);
    if (!occupant) return state;
    
    const trash = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: occupantId,
      type: 'Penghuni Kamar',
      name: `${occupant.name} (dari ${room.roomLabel})`,
      deletedAt: new Date().toLocaleString('id-ID'),
      data: { roomId, occupant }
    };
    
    return {
      rooms: state.rooms.map(r => r.id === roomId ? { ...r, occupants: r.occupants.filter(o => o.id !== occupantId) } : r),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  updateOccupantInRoom: (roomId, occupantId, updates) => set((state) => {
    const prevRoom = state.rooms.find(r => r.id === roomId);
    const prevOccupant = prevRoom?.occupants.find(o => o.id === occupantId);

    const updatedRooms = state.rooms.map(r => r.id === roomId ? {
      ...r,
      occupants: r.occupants.map(o => o.id === occupantId ? { ...o, ...updates } : o)
    } : r);

    // Sync pilgrim name if updated
    let updatedPilgrims = state.pilgrims;
    if (prevOccupant && updates.name && updates.name !== prevOccupant.name) {
      updatedPilgrims = state.pilgrims.map(p => 
        p.name.trim().toLowerCase() === prevOccupant.name.trim().toLowerCase()
          ? { ...p, name: updates.name! }
          : p
      );
    }

    return {
      rooms: updatedRooms,
      pilgrims: updatedPilgrims
    };
  }),

  // Staff Stock handlers
  addStaffStock: (item) => set((state) => ({
    staffStocks: [item, ...state.staffStocks]
  })),
  updateStaffStock: (id, updates) => set((state) => ({
    staffStocks: state.staffStocks.map(item => item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : item)
  })),
  deleteStaffStock: (id) => set((state) => {
    const item = state.staffStocks.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Stok Barang',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      staffStocks: state.staffStocks.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),
  deleteStaffStocks: (ids) => set((state) => {
    const itemsToDelete = state.staffStocks.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id,
      type: 'Stok Barang',
      name: item.name || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      staffStocks: state.staffStocks.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),
  adjustStockQuantity: (id, delta) => set((state) => ({
    staffStocks: state.staffStocks.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    })
  })),

  // Finance actions
  addTransaction: (tx) => set((state) => {
    const updatedTxs = [tx, ...state.financeTransactions];
    return {
      financeTransactions: updatedTxs,
      pilgrims: syncPilgrimPaymentsWithTxs(state.pilgrims, updatedTxs)
    };
  }),
  updateTransaction: (id, updates) => set((state) => {
    const updatedTxs = state.financeTransactions.map(tx => tx.id === id ? { ...tx, ...updates } : tx);
    return {
      financeTransactions: updatedTxs,
      pilgrims: syncPilgrimPaymentsWithTxs(state.pilgrims, updatedTxs)
    };
  }),
  deleteTransaction: (id) => set((state) => {
    const item = state.financeTransactions.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: `trash-${Date.now()}-${Math.random()}`,
      originalId: item.id,
      type: 'Transaksi',
      name: item.pilgrimName || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    const updatedTxs = state.financeTransactions.filter(tx => tx.id !== id);
    return {
      financeTransactions: updatedTxs,
      pilgrims: syncPilgrimPaymentsWithTxs(state.pilgrims, updatedTxs),
      trashItems: [trash, ...state.trashItems]
    };
  }),

  // Broadcast actions
  addBroadcast: (b) => set((state) => {
    const item: BroadcastItem = {
      ...b,
      originalTime: b.originalTime || b.time,
      originalDate: b.originalDate || b.date || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };
    return { broadcasts: [item, ...state.broadcasts] };
  }),
  updateBroadcast: (id, updates) => set((state) => {
    const existing = state.broadcasts.find(b => b.id === id);
    if (!existing) return state;
    const updatedItem: BroadcastItem = {
      ...existing,
      ...updates,
      originalTime: existing.originalTime || existing.time,
      originalDate: existing.originalDate || existing.date || '2026-07-28',
      isEdited: true,
      updatedAt: new Date().toISOString()
    };
    return {
      broadcasts: [updatedItem, ...state.broadcasts.filter(b => b.id !== id)]
    };
  }),
  deleteBroadcasts: (ids) => set((state) => {
    let itemsToDelete = [];
    if (ids.length === 0) {
      itemsToDelete = [...state.broadcasts];
    } else {
      itemsToDelete = state.broadcasts.filter(b => ids.includes(b.id));
    }
    
    const newTrashItems = itemsToDelete.map(item => ({
      id: `trash-${Date.now()}-${Math.random()}-${item.id}`,
      originalId: item.id.toString(),
      type: 'Siaran',
      name: item.title || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    
    return {
      broadcasts: ids.length === 0 ? [] : state.broadcasts.filter(b => !ids.includes(b.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),

  readNotificationIds: [],
  markNotificationAsRead: (id) => set((state) => ({
    readNotificationIds: state.readNotificationIds.includes(id) 
      ? state.readNotificationIds 
      : [...state.readNotificationIds, id]
  })),
  markAllNotificationsAsRead: () => set((state) => {
    const allIds = [
      ...state.broadcasts.map(b => `bc-${b.id}`),
      ...state.emergencies.map(e => `em-${e.id}`)
    ];
    return { readNotificationIds: allIds };
  })
}));

export const syncPilgrimPaymentsWithTxs = (pilgrims: Pilgrim[], financeTransactions: FinanceTransaction[]): Pilgrim[] => {
  return pilgrims.map(p => {
    const pilgrimTxs = financeTransactions.filter(t => 
      t.type.startsWith('Pemasukan') &&
      t.status !== 'Batal' &&
      ((t.pilgrimId && t.pilgrimId === p.id) || 
       (t.pilgrimName && t.pilgrimName.trim().toLowerCase() === p.name.trim().toLowerCase()))
    );

    if (pilgrimTxs.length === 0) {
      const totalPkg = p.totalAmount || 30000000;
      const currentPaid = p.paidAmount || 0;
      let opt = p.paymentOption;
      if (!opt) {
        if (currentPaid >= totalPkg && totalPkg > 0) opt = 'Bayar Lunas';
        else if (currentPaid > 0) opt = 'DP';
        else opt = 'Belum Bayar';
      }
      return { ...p, paymentOption: opt };
    }

    const totalPaidFromTxs = pilgrimTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalPkg = p.totalAmount || 30000000;

    let option: 'DP' | 'Bayar Lunas' | 'Belum Bayar' = 'Belum Bayar';
    if (totalPaidFromTxs >= totalPkg && totalPkg > 0) {
      option = 'Bayar Lunas';
    } else if (totalPaidFromTxs > 0) {
      option = 'DP';
    } else {
      option = 'Belum Bayar';
    }

    return {
      ...p,
      totalAmount: totalPkg,
      paidAmount: totalPaidFromTxs,
      paymentOption: option
    };
  });
};
