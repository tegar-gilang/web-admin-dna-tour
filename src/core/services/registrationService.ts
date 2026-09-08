import { apiClient } from './apiClient';
import { Pilgrim } from '../store';

export interface BackendRegistration {
  id: string;
  registration_number: string;
  full_name: string;
  passport_number: string | null;
  nik: string;
  phone: string;
  birth_date: string;
  gender: string;
  registration_date: string;
  departure_date: string | null;
  package_id: string;
  kloter_id: string | null;
  meningitis_vaccine_status: string;
  photo_status: string;
  total_package_cost: string | number;
  status: string;
  total_paid: number;
  remaining_cost: number;
  package?: { name: string } | null;
  kloter?: { name: string } | null;
  payments: any[];
  equipments: { equipment_name: string; is_received: boolean; size: string | null }[];
  pilgrim_id: string | null;
}

export interface RegistrationOption {
  registration_id: string;
  full_name: string;
  registration_number: string;
}

export const registrationService = {
  async getRegistrations(params?: { q?: string; status?: string; package_id?: string; kloter_id?: string }): Promise<Pilgrim[]> {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.package_id) queryParams.append('package_id', params.package_id);
    if (params?.kloter_id) queryParams.append('kloter_id', params.kloter_id);

    const queryString = queryParams.toString();
    const url = queryString ? `/registrations?${queryString}` : '/registrations';

    const response = await apiClient<{ data: BackendRegistration[] }>(url);

    return response.data.map(mapBackendToPilgrim);
  },

  // Ditambahkan dari branch finance — dipakai untuk dropdown pilih pendaftar
  async getRegistrationOptions(): Promise<RegistrationOption[]> {
    try {
      const response = await apiClient<any>('/registrations', { method: 'GET' });
      let list: any[] = [];
      if (response.data && Array.isArray(response.data.data)) {
        list = response.data.data;
      } else if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response)) {
        list = response;
      }

      return list.map((item: any) => ({
        registration_id: item.id ? String(item.id) : (item.registration_id ? String(item.registration_id) : ''),
        full_name: item.full_name || '',
        registration_number: item.registration_number || '',
      }));
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      throw error;
    }
  },

  async getRegistration(id: string): Promise<Pilgrim> {
    const response = await apiClient<{ data: BackendRegistration }>(`/registrations/${id}`);
    return mapBackendToPilgrim(response.data);
  },

  async createRegistration(pilgrim: Partial<Pilgrim>, packages: any[], groups: any[]): Promise<Pilgrim> {
    const payload = mapPilgrimToBackend(pilgrim, packages, groups);
    const response = await apiClient<{ data: BackendRegistration }>('/registrations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    console.log('Response dari POST /registrations:', response.data);
    return mapBackendToPilgrim(response.data);
  },

  async updateRegistration(id: string, pilgrim: Partial<Pilgrim>, packages: any[], groups: any[]): Promise<Pilgrim> {
    const payload = mapPilgrimToBackend(pilgrim, packages, groups);
    const response = await apiClient<{ data: BackendRegistration }>(`/registrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return mapBackendToPilgrim(response.data);
  },

  async cancelRegistration(id: string): Promise<void> {
    await apiClient(`/registrations/${id}/cancel`, {
      method: 'POST'
    });
  },

  async deleteRegistration(id: string): Promise<void> {
    await apiClient(`/registrations/${id}`, {
      method: 'DELETE'
    });
  }
};

function mapPilgrimToBackend(p: Partial<Pilgrim>, packages: any[], groups: any[]): any {
  const computeBirthDate = (age?: number) => {
    if (!age) return '1990-01-01';
    const year = new Date().getFullYear() - age;
    return `${year}-01-01`;
  };

  const mapStatus = (opt?: string) => {
    if (opt === 'Bayar Lunas') return 'fully_paid';
    if (opt === 'DP') return 'dp_paid';
    return 'unpaid';
  };

  const pkg = packages.find(x => x.name === p.umrahPackage);
  const grp = groups.find(x => x.name === p.group || x.kloter === p.group);

  const payload: any = {
    registration_number: p.formId,
    full_name: p.name || 'Hamba Allah',
    passport_number: p.passport && p.passport !== '-' ? p.passport : null,
    nik: p.ktp || '0000000000000000',
    phone: p.phone || '08000000000',
    birth_date: computeBirthDate(p.age),
    gender: p.gender === 'Perempuan' ? 'P' : 'L',
    registration_date: p.registrationDate || new Date().toISOString().split('T')[0],
    departure_date: p.departureDate || null,
    package_id: pkg?.id,
    kloter_id: grp?.id || null,
    pilgrim_id: p.pilgrimId || null,
    meningitis_vaccine_status: p.meningitis ? 'sudah_vaksin' : 'belum_vaksin',
    photo_status: p.photo ? 'sudah_menyerahkan' : 'belum_ada',
    total_package_cost: Number(p.totalAmount) || 30000000,
    status: mapStatus(p.paymentOption),
    equipments: [
      { equipment_name: 'Koper Besar', is_received: !!p.koperBesar, size: null },
      { equipment_name: 'Koper Kabin', is_received: !!p.koperKabin, size: null },
      { equipment_name: 'Seragam Batik', is_received: !!p.batik, size: null },
      { equipment_name: 'Buku Panduan', is_received: !!p.bukuDomisili, size: null },
      { equipment_name: 'Kain Ihram', is_received: !!p.kainIhram, size: null },
      { equipment_name: 'Sabuk', is_received: !!p.sabuk, size: p.sabuk || null },
      { equipment_name: 'Kerudung Merah', is_received: !!p.kerudungMerah, size: null },
      { equipment_name: 'Kerudung Putih', is_received: !!p.kerudungPutih, size: null },
      { equipment_name: 'Tas Selempang', is_received: !!p.tasSelempang, size: null },
      { equipment_name: 'Tas Sandal', is_received: !!p.tasSandal, size: null },
      { equipment_name: 'Syall', is_received: !!p.syall, size: null }
    ]
  };

  if (p.paidAmount && p.paidAmount > 0) {
    payload.initial_payment = {
      amount: Number(p.paidAmount),
      payment_type: p.paymentOption === 'Bayar Lunas' ? 'full_payment' : 'down_payment',
      payment_method: 'bca_transfer',
      payment_date: p.paymentDate || payload.registration_date
    };
  }

  return payload;
}

function mapBackendToPilgrim(backend: BackendRegistration): Pilgrim {
  const calculateAge = (dob: string) => {
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const mapStatus = (status: string) => {
    if (status === 'fully_paid') return 'Bayar Lunas';
    if (status === 'dp_paid') return 'DP';
    return 'Belum Bayar';
  };

  const hasEquipment = (name: string) => {
    const eq = backend.equipments?.find(e => e.equipment_name === name);
    return eq ? eq.is_received : false;
  };

  return {
    id: backend.id,
    formId: backend.registration_number,
    name: backend.full_name,
    passport: backend.passport_number || '-',
    group: backend.kloter?.name || 'Belum Ada',
    gender: backend.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    age: backend.birth_date ? calculateAge(backend.birth_date) : 0,
    pilgrimId: backend.pilgrim_id || '',
    phone: backend.phone,
    birthDate: backend.birth_date,
    registrationDate: backend.registration_date,
    departureDate: backend.departure_date || '',
    umrahPackage: backend.package?.name || '-',
    ktp: backend.nik,
    meningitis: backend.meningitis_vaccine_status === 'sudah_vaksin',
    photo: backend.photo_status === 'sudah_menyerahkan',
    koperBesar: hasEquipment('Koper Besar'),
    koperKabin: hasEquipment('Koper Kabin'),
    batik: hasEquipment('Seragam Batik'),
    bukuDomisili: hasEquipment('Buku Panduan'),
    kainIhram: hasEquipment('Kain Ihram'),
    sabuk: backend.equipments?.find(e => e.equipment_name === 'Sabuk')?.size || '',
    kerudungMerah: hasEquipment('Kerudung Merah'),
    kerudungPutih: hasEquipment('Kerudung Putih'),
    tasSelempang: hasEquipment('Tas Selempang'),
    tasSandal: hasEquipment('Tas Sandal'),
    syall: hasEquipment('Syall'),
    paymentOption: mapStatus(backend.status),
    totalAmount: Number(backend.total_package_cost),
    paidAmount: Number(backend.total_paid),
    paymentMethod: backend.payments?.[0]?.payment_method || '-',
    paymentDate: backend.payments?.[0]?.payment_date || '',
    paymentNotes: backend.payments?.[0]?.notes || '',
  };
}