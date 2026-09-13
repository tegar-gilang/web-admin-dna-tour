import { apiClient } from './apiClient';
import { Pilgrim } from '@/core/store';

export type BackendJamaah = {
  id: string;
  login_id: string;
  nik: string;
  full_name: string;
  passport_number?: string | null;
  visa_number?: string | null;
  nationality?: string | null;
  gender?: 'L' | 'P' | null;
  birth_date?: string | null;
  phone?: string | null;
  emergency_contact?: string | null;

  package_id?: string | null;
  kloter_id?: string | null;

  hotel_makkah?: string | null;
  hotel_madinah?: string | null;
  departure_date?: string | null;
  return_date?: string | null;
  tour_leader?: string | null;
  mutawif_local?: string | null;

  status: 'active' | 'archived';
  archived_at?: string | null;

  created_by?: string | null;
  created_at?: string;
  updated_at?: string;

  package?: {
    id: string;
    name: string;
  } | null;

  kloter?: {
    id: string;
    name: string;
  } | null;
};

export type JamaahPayload = {
  login_id: string;
  nik: string;
  full_name: string;
  passport_number?: string | null;
  visa_number?: string | null;
  nationality?: string | null;
  gender?: 'L' | 'P' | null;
  birth_date?: string | null;
  phone?: string | null;
  emergency_contact?: string | null;

  package_id?: string | null;
  kloter_id?: string | null;

  hotel_makkah?: string | null;
  hotel_madinah?: string | null;
  departure_date?: string | null;
  return_date?: string | null;
  tour_leader?: string | null;
  mutawif_local?: string | null;
};

export const formatDateForInput = (
  dateStr?: string | null
): string => {
  if (!dateStr) return '';
  const match = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateAge = (birthDate?: string | null): number => {
  if (!birthDate) return 0;

  const birth = new Date(birthDate);

  if (Number.isNaN(birth.getTime())) return 0;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return Math.max(age, 0);
};

const mapGenderToUI = (
  gender?: 'L' | 'P' | null
): string => {
  switch (gender) {
    case 'L':
      return 'Laki-laki';
    case 'P':
      return 'Perempuan';
    default:
      return '';
  }
};

export const mapJamaahToPilgrim = (
  jamaah: BackendJamaah
): Pilgrim => {
  return {
    id: jamaah.login_id,
    backendId: jamaah.id,
    pilgrimId: jamaah.login_id,

    name: jamaah.full_name,
    ktp: jamaah.nik,

    passport: jamaah.passport_number ?? '',
    visaNumber: jamaah.visa_number ?? '',
    nationality: jamaah.nationality ?? 'Indonesia',

    gender: mapGenderToUI(jamaah.gender),
    birthDate: formatDateForInput(jamaah.birth_date),
    age: calculateAge(jamaah.birth_date),

    phone: jamaah.phone ?? '',
    emergencyContact: jamaah.emergency_contact ?? '',

    group: jamaah.kloter?.name ?? '',
    umrahPackage: jamaah.package?.name ?? '',

    tourLeader: jamaah.tour_leader ?? '',
    mutawifLocal: jamaah.mutawif_local ?? '',

    hotelMakkah: jamaah.hotel_makkah ?? '',
    hotelMadinah: jamaah.hotel_madinah ?? '',
    hotel: jamaah.hotel_makkah ?? '',

    departureDate: formatDateForInput(jamaah.departure_date),
    returnDate: formatDateForInput(jamaah.return_date),

    // Field berikut memang BUKAN bagian dari entity Jamaah.
    formId: undefined,
    registrationDate: undefined,

    meningitis: undefined,
    photo: undefined,

    equipments: undefined,

    paymentOption: undefined,
    totalAmount: undefined,
    paidAmount: undefined,
    paymentMethod: undefined,
    paymentDate: undefined,
    paymentNotes: undefined,
  };
};

export const mapGenderToBackend = (
  gender?: string
): 'L' | 'P' | null => {
  if (!gender) return null;

  switch (gender) {
    case 'L':
    case 'Laki-laki':
    case 'Pria':
    case 'Pria (Male)':
      return 'L';

    case 'P':
    case 'Perempuan':
    case 'Wanita':
    case 'Wanita (Female)':
      return 'P';

    default:
      return null;
  }
};

export const jamaahService = {
  getJamaahs: async (): Promise<Pilgrim[]> => {
    const response = await apiClient<any>('/jamaah');

    const payload = response?.data ?? response;

    const jamaahs: BackendJamaah[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return jamaahs.map(mapJamaahToPilgrim);
  },

  getJamaah: async (
    id: string
  ): Promise<Pilgrim> => {
    const response = await apiClient<any>(
      `/jamaah/${id}`
    );

    const jamaah: BackendJamaah =
      response?.data?.jamaah ??
      response?.data ??
      response;

    return mapJamaahToPilgrim(jamaah);
  },

  createJamaah: async (
    payload: JamaahPayload
  ): Promise<Pilgrim> => {
    const response = await apiClient<any>(
      '/jamaah',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    const jamaah: BackendJamaah =
      response?.data?.jamaah ??
      response?.data ??
      response;

    return mapJamaahToPilgrim(jamaah);
  },

  updateJamaah: async (
    id: string,
    payload: Partial<JamaahPayload>
  ): Promise<Pilgrim> => {
    const response = await apiClient<any>(
      `/jamaah/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );

    const jamaah: BackendJamaah =
      response?.data?.jamaah ??
      response?.data ??
      response;

    return mapJamaahToPilgrim(jamaah);
  },

  deleteJamaah: async (
    id: string
  ): Promise<void> => {
    await apiClient(
      `/jamaah/${id}`,
      {
        method: 'DELETE',
      }
    );
  },
};