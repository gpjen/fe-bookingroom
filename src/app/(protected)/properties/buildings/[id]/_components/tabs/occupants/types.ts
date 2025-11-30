export interface Occupant {
  id: string;
  name: string;
  identifier: string; // NIK or ID
  type: "employee" | "guest" | "other";
  gender: "Male" | "Female";
  checkInDate: string;
  checkOutDate?: string;
  department?: string;
  company?: string;
  companionName?: string;
  companionId?: string;
  avatar?: string;
  status?: "Active" | "Checked Out";
  bedCode?: string;
}
