import { apiClient } from './apiClient';
import { RoomItem, RoomOccupant, RoomCategory } from '../store';

/**
 * =========================
 * Backend Types
 * =========================
 */

type BackendRoomMember = {
  id: string;
  room_id: string;
  registration_id?: string | null;
  jamaah_id?: string | null;

  title?: 'MR' | 'MRS' | 'MISS' | 'MSTR' | null;
  occupant_name?: string | null;
  age?: number | null;

  jamaah?: {
    id?: string;
    login_id?: string;
    full_name?: string;
    gender?: string;
    birth_date?: string;
  } | null;
};

type BackendRoom = {
  id: string;
  kloter_id: string;
  hotel_id?: string | null;

  room_number?: string | null;
  room_type: 'single' | 'double' | 'triple' | 'quad' | 'quint';

  capacity: number;
  gender: 'L' | 'P';

  notes?: string | null;

  occupancy?: number;
  is_full?: boolean;

  hotel?: {
    id?: string;
    name?: string;
    city?: string;
  } | null;

  members?: BackendRoomMember[];
};

type BackendRoomsResponse = {
  message: string;

  kloter: {
    id: string;
    package_id?: string | null;
    code: string;

    departure_date?: string | null;
    return_date?: string | null;

    hotel_makkah_id?: string | null;
    hotel_madinah_id?: string | null;

    status: string;
    name: string;
    flight_code?: string | null;

    tour_leader?: string | null;
    mutawif_local?: string | null;

    package?: unknown | null;
  };

  data: {
    rooms: BackendRoom[];
  };
};

/**
 * =========================
 * Payload Types
 * =========================
 */

export interface RoomPayload {
  kloter_id: string;
  hotel_id?: string | null;

  room_number?: string | null;

  room_type:
    | 'single'
    | 'double'
    | 'triple'
    | 'quad'
    | 'quint';

  capacity?: number | null;

  gender: 'L' | 'P';

  notes?: string | null;
}

export interface RoomMemberPayload {
  jamaah_id?: string | null;

  title?: 'MR' | 'MRS' | 'MISS' | 'MSTR' | null;

  occupant_name?: string | null;

  age?: number | null;
}

/**
 * =========================
 * Room Service
 * =========================
 */

export const roomService = {
  /**
   * Ambil seluruh room berdasarkan Kloter
   */
  async getRooms(kloterId: string): Promise<RoomItem[]> {
    const response = await apiClient<BackendRoomsResponse>(
      `/kloters/${kloterId}/rooms`
    );

    return response.data.rooms.map((room) =>
      mapBackendRoomToFrontend(
        room,
        response.kloter.name
      )
    );
  },

  /**
   * Ambil detail satu room
   */
  async getRoom(roomId: string): Promise<RoomItem> {
    const response = await apiClient<{ data: BackendRoom }>(
      `/rooms/${roomId}`
    );

    return mapBackendRoomToFrontend(response.data);
  },

  /**
   * Buat room baru
   */
  async createRoom(
    payload: RoomPayload
  ): Promise<RoomItem> {
    const response = await apiClient<{ data: BackendRoom }>(
      '/rooms',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return mapBackendRoomToFrontend(response.data);
  },

  /**
   * Update room
   */
  async updateRoom(
    roomId: string,
    payload: Partial<RoomPayload>
  ): Promise<RoomItem> {
    const response = await apiClient<{ data: BackendRoom }>(
      `/rooms/${roomId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );

    return mapBackendRoomToFrontend(response.data);
  },

  /**
   * Hapus room
   */
  async deleteRoom(roomId: string): Promise<void> {
    await apiClient(`/rooms/${roomId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Tambah penghuni ke room
   */
  async addOccupant(
    roomId: string,
    payload: RoomMemberPayload
  ): Promise<RoomOccupant> {
    const response = await apiClient<{
      data: BackendRoomMember;
    }>(
      `/rooms/${roomId}/members`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return mapBackendMemberToFrontend(response.data);
  },

  /**
   * Update penghuni room
   */
  async updateOccupant(
    roomId: string,
    memberId: string,
    payload: Partial<RoomMemberPayload>
  ): Promise<RoomOccupant> {
    const response = await apiClient<{
      data: BackendRoomMember;
    }>(
      `/rooms/${roomId}/members/${memberId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );

    return mapBackendMemberToFrontend(response.data);
  },

  /**
   * Hapus penghuni dari room
   */
  async removeOccupant(
    roomId: string,
    memberId: string
  ): Promise<void> {
    await apiClient(
      `/rooms/${roomId}/members/${memberId}`,
      {
        method: 'DELETE',
      }
    );
  },
};

/**
 * =========================
 * Mapper
 * =========================
 */

/**
 * Backend Room -> Frontend RoomItem
 */
function mapBackendRoomToFrontend(
  room: BackendRoom,
  kloterName?: string
): RoomItem {
  const category = mapRoomTypeToCategory(
    room.room_type
  );

  return {
    id: room.id,
    backendId: room.id,

    category,

    roomLabel: buildRoomLabel(
      category,
      room.room_number
    ),

    roomNumber: room.room_number ?? '',

    kloter: kloterName ?? room.kloter_id,

    hotelLocation: mapHotelLocation(
      room.hotel?.city
    ),

    hotelName: room.hotel?.name ?? '',

    occupants: (room.members ?? []).map(
      mapBackendMemberToFrontend
    ),
  };
}

/**
 * Backend RoomMember -> Frontend RoomOccupant
 */
function mapBackendMemberToFrontend(
  member: BackendRoomMember
): RoomOccupant {
  return {
    id: member.id,
    backendId: member.id,

    jamaahId:
      member.jamaah_id ?? undefined,

    // Nomor urut akan ditentukan oleh frontend
    no: 0,

    title: member.title ?? 'MR',

    name:
      member.occupant_name ??
      member.jamaah?.full_name ??
      '',

    age: member.age ?? '',
  };
}

/**
 * Backend room_type -> Frontend RoomCategory
 */
function mapRoomTypeToCategory(
  roomType: BackendRoom['room_type']
): RoomCategory {
  switch (roomType) {
    case 'double':
      return 'DOUBLE';

    case 'triple':
      return 'TRIPLE';

    case 'quad':
      return 'QUAD';

    case 'quint':
      return 'QUINT';

    /**
     * Frontend saat ini belum memiliki kategori SINGLE.
     * Jangan mengubahnya menjadi DOUBLE secara diam-diam.
     */
    case 'single':
    default:
      return 'DOUBLE';
  }
}

/**
 * Backend hotel.city -> Frontend hotelLocation
 *
 * Hotel hanya menjadi informasi/keterangan
 * untuk lokasi Makkah/Madinah.
 */
function mapHotelLocation(
  city?: string | null
): 'Makkah' | 'Madinah' {
  if (
    city?.trim().toLowerCase() === 'madinah'
  ) {
    return 'Madinah';
  }

  return 'Makkah';
}

/**
 * Membuat label room untuk UI
 */
function buildRoomLabel(
  category: RoomCategory,
  roomNumber?: string | null
): string {
  if (roomNumber) {
    return `${category} ${roomNumber}`;
  }

  return category;
}