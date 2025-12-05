// Room availability summary by type
export interface RoomTypeSummary {
  type: string;
  total: number;
  available: number;
  occupied: number;
}

export interface BuildingData {
  id: string;
  name: string;
  areaId: string;
  code: string;
  totalRooms: number;
  totalBeds: number;
  availableBeds: number;
  roomTypes: RoomTypeSummary[];
}

export interface AreaData {
  id: string;
  name: string;
  code: string;
  totalBuildings: number;
  totalRooms: number;
  availableBeds: number;
}

export const MOCK_AREAS: AreaData[] = [
  { id: "area-1", name: "Area Utara", code: "AU", totalBuildings: 2, totalRooms: 24, availableBeds: 45 },
  { id: "area-2", name: "Area Selatan", code: "AS", totalBuildings: 2, totalRooms: 18, availableBeds: 32 },
  { id: "area-3", name: "Area Timur", code: "AT", totalBuildings: 1, totalRooms: 12, availableBeds: 18 },
];

export const MOCK_BUILDINGS: BuildingData[] = [
  { 
    id: "bld-1", 
    name: "Mess LQ 1", 
    areaId: "area-1", 
    code: "LQ1",
    totalRooms: 12,
    totalBeds: 36,
    availableBeds: 24,
    roomTypes: [
      { type: "Standard", total: 8, available: 5, occupied: 3 },
      { type: "VIP", total: 3, available: 2, occupied: 1 },
      { type: "VVIP", total: 1, available: 1, occupied: 0 },
    ]
  },
  { 
    id: "bld-2", 
    name: "Mess LQ 2", 
    areaId: "area-1", 
    code: "LQ2",
    totalRooms: 12,
    totalBeds: 32,
    availableBeds: 21,
    roomTypes: [
      { type: "Standard", total: 10, available: 6, occupied: 4 },
      { type: "VIP", total: 2, available: 1, occupied: 1 },
    ]
  },
  { 
    id: "bld-3", 
    name: "Mess Selatan A", 
    areaId: "area-2", 
    code: "SA",
    totalRooms: 10,
    totalBeds: 28,
    availableBeds: 18,
    roomTypes: [
      { type: "Standard", total: 8, available: 5, occupied: 3 },
      { type: "VIP", total: 2, available: 1, occupied: 1 },
    ]
  },
  { 
    id: "bld-4", 
    name: "Mess Selatan B", 
    areaId: "area-2", 
    code: "SB",
    totalRooms: 8,
    totalBeds: 24,
    availableBeds: 14,
    roomTypes: [
      { type: "Standard", total: 6, available: 4, occupied: 2 },
      { type: "VIP", total: 2, available: 1, occupied: 1 },
    ]
  },
  { 
    id: "bld-5", 
    name: "Mess Timur", 
    areaId: "area-3", 
    code: "MT",
    totalRooms: 12,
    totalBeds: 30,
    availableBeds: 18,
    roomTypes: [
      { type: "Standard", total: 8, available: 5, occupied: 3 },
      { type: "VIP", total: 3, available: 2, occupied: 1 },
      { type: "Suite", total: 1, available: 0, occupied: 1 },
    ]
  },
];

export const MOCK_EMPLOYEES = [
  {
    nik: "D0525000109",
    name: "Gandi Purna Jen",
    company: "PT. Dharma Cipta Mulia",
    department: "Information and Technology",
    phone: "081234567890",
    email: "gandipurnajen@gmail.com",
    gender: "L",
  },
  {
    nik: "D0525000110",
    name: "Budi Santoso",
    company: "PT. Dharma Cipta Mulia",
    department: "Operations",
    phone: "081234567891",
    email: "budisantoso@gmail.com",
    gender: "L",
  },
  {
    nik: "H0525000201",
    name: "Rina Melati",
    company: "PT. Halmahera Persada Lygend",
    department: "HR & GA",
    phone: "081234567892",
    email: "rinamelati@gmail.com",
    gender: "P",
  },
  {
    nik: "H0525000202",
    name: "Siti Aminah",
    company: "PT. Halmahera Persada Lygend",
    department: "Finance",
    phone: "081234567893",
    email: "sitiaminah@gmail.com",
    gender: "P",
  },
];
