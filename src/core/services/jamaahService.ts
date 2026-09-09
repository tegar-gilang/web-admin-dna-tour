import { apiClient } from './apiClient';
import { Pilgrim } from '../store';

export interface BackendJamaah {
  id: string;             // UUID internal backend (Primary Key)
  login_id: string;       // Kode Login/ID Jamaah Tampilan (maks 10 karakter)
  nik?: string;
  full_name: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  emergency_contact?: string;
  passport_number?: string;
  visa_number?: string;
  nationality?: string;
  package_id?: string;
  kloter_id?: string;
  hotel_makkah?: string;
  hotel_madinah?: string;
  departure_date?: string;
  return_date?: string;
  tour_leader?: string;
  mutawif_local?: string;
  status?: string;
  created_by?: any;
  package?: {
    id: string;
    name: string;
    category?: string;
  } | null;
  kloter?: {
    id: string;
    name: string;
    code?: string;
  } | null;
}

export interface JamaahPayload {
  login_id?: string;
  nik?: string;
  full_name?: string;
  birth_date?: string | null;
  gender?: 'L' | 'P' | null;
  phone?: string | null;
  emergency_contact?: string | null;
  passport_number?: string | null;
  visa_number?: string | null;
  nationality?: string | null;
  package_id?: string | null;
  kloter_id?: string | null;
  hotel_makkah?: string | null;
  hotel_madinah?: string | null;
  departure_date?: string | null;
  return_date?: string | null;
  tour_leader?: string | null;
  mutawif_local?: string | null;
  status?: 'active' | 'archived' | null;
}

export function mapBackendJamaahToPilgrim(b: BackendJamaah): Pilgrim {
  let calculatedAge: number | undefined = undefined;
  if (b.birth_date) {
    try {
      const birth = new Date(b.birth_date);
      if (!isNaN(birth.getTime())) {
        const diffYears = Math.floor((new Date().getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (diffYears >= 0 && diffYears < 120) {
          calculatedAge = diffYears;
        }
      }
    } catch {}
  }

  let genderDisplay = '-';
  if (b.gender === 'L') genderDisplay = 'Laki-laki';
  else if (b.gender === 'P') genderDisplay = 'Perempuan';
  else if (b.gender) genderDisplay = b.gender;

  return {
    id: b.id, // UUID internal untuk rute API (/api/jamaah/{id})
    pilgrimId: b.login_id || b.id, // login_id backend untuk kode tampilan
    formId: undefined, // Jangan isi formId dari login_id
    name: b.full_name || '',
    passport: b.passport_number || '',
    visaNumber: b.visa_number || '',
    nationality: b.nationality || 'Indonesia',
    gender: genderDisplay,
    age: calculatedAge as any,
    birthDate: b.birth_date || '',
    phone: b.phone || '',
    emergencyContact: b.emergency_contact || '',
    group: b.kloter?.name || b.kloter?.code || '-',
    tourLeader: b.tour_leader || '-',
    mutawifLocal: b.mutawif_local || '-',
    umrahPackage: b.package?.name || '-',
    hotel: b.hotel_makkah || '-',
    hotelMakkah: b.hotel_makkah || '',
    hotelMadinah: b.hotel_madinah || '',
    departureDate: b.departure_date || '',
    returnDate: b.return_date || '',
    ktp: b.nik || '',
    registrationDate: undefined, // Jangan isi registrationDate dari departure_date
    packageId: b.package_id || b.package?.id || undefined,
    kloterId: b.kloter_id || b.kloter?.id || undefined,
    status: b.status || 'active',
    paymentOption: undefined,
    totalAmount: undefined,
    paidAmount: undefined,
  };
}

export function buildJamaahPayload(p: Partial<Pilgrim> & { loginId?: string }): JamaahPayload {
  const cleanStr = (val?: string | null): string | null => {
    if (val === null || val === undefined) return null;
    const trimmed = String(val).trim();
    if (trimmed === '' || trimmed === '-') return null;
    return trimmed;
  };

  let genderVal: 'L' | 'P' | null = null;
  if (p.gender) {
    const g = String(p.gender).toLowerCase().trim();
    if (g === 'l' || g.includes('laki') || g.includes('pria')) {
      genderVal = 'L';
    } else if (g === 'p' || g.includes('perempuan') || g.includes('wanita')) {
      genderVal = 'P';
    }
  }

  const payload: JamaahPayload = {};

  const loginIdVal = (p.pilgrimId || p.loginId || '').trim();
  if (loginIdVal) payload.login_id = loginIdVal;

  const nikVal = (p.ktp || '').trim();
  if (nikVal) payload.nik = nikVal;

  const nameVal = (p.name || '').trim();
  if (nameVal) payload.full_name = nameVal;

  payload.birth_date = cleanStr(p.birthDate);
  payload.gender = genderVal;
  payload.phone = cleanStr(p.phone);
  payload.emergency_contact = cleanStr(p.emergencyContact);
  payload.passport_number = cleanStr(p.passport);
  payload.visa_number = cleanStr(p.visaNumber);
  payload.nationality = cleanStr(p.nationality);
  payload.package_id = cleanStr(p.packageId);
  payload.kloter_id = cleanStr(p.kloterId);
  payload.hotel_makkah = cleanStr(p.hotelMakkah);
  payload.hotel_madinah = cleanStr(p.hotelMadinah);
  payload.departure_date = cleanStr(p.departureDate);
  payload.return_date = cleanStr(p.returnDate);
  payload.tour_leader = cleanStr(p.tourLeader);
  payload.mutawif_local = cleanStr(p.mutawifLocal);
  payload.status = p.status ? (p.status as any) : null;

  return payload;
}

export const jamaahService = {
  buildJamaahPayload,

  /**
   * Mengambil seluruh data master Jamaah dari backend Laravel (/api/jamaah)
   */
  async getJamaahList(params?: { q?: string; status?: string; kloter_id?: string; package_id?: string }): Promise<Pilgrim[]> {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.kloter_id) queryParams.append('kloter_id', params.kloter_id);
    if (params?.package_id) queryParams.append('package_id', params.package_id);

    const queryString = queryParams.toString();
    const url = queryString ? `/jamaah?${queryString}` : '/jamaah';

    const response = await apiClient<{ data: BackendJamaah[] | { data: BackendJamaah[] } }>(url);
    
    let rawList: BackendJamaah[] = [];
    if (Array.isArray(response.data)) {
      rawList = response.data;
    } else if (response.data && Array.isArray((response.data as any).data)) {
      rawList = (response.data as any).data;
    }

    return rawList.map(mapBackendJamaahToPilgrim);
  },

  /**
   * Mengambil detail 1 data Jamaah berdasarkan UUID internal backend (/api/jamaah/{id})
   */
  async getJamaahDetail(id: string): Promise<Pilgrim> {
    const response = await apiClient<{ data: BackendJamaah }>(`/jamaah/${id}`);
    return mapBackendJamaahToPilgrim(response.data);
  },

  /**
   * Membuat data Master Jamaah baru di backend (POST /api/jamaah)
   */
  async createJamaah(payload: JamaahPayload): Promise<Pilgrim> {
    const response = await apiClient<{ message: string; data: BackendJamaah }>('/jamaah', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBackendJamaahToPilgrim(response.data);
  },

  /**
   * Memperbarui data Master Jamaah di backend (PUT /api/jamaah/{id})
   */
  async updateJamaah(id: string, payload: Partial<JamaahPayload>): Promise<Pilgrim> {
    const response = await apiClient<{ message: string; data: BackendJamaah }>(`/jamaah/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapBackendJamaahToPilgrim(response.data);
  },

  /**
   * Menghapus data Master Jamaah di backend (DELETE /api/jamaah/{id})
   */
  async deleteJamaah(id: string): Promise<void> {
    await apiClient<{ message: string }>(`/jamaah/${id}`, {
      method: 'DELETE',
    });
  },
};
