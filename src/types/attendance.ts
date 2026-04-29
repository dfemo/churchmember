export type AttendanceKind = "ChurchService" | "Event";

export type SundayServiceMode = "Online" | "Onsite";

export type AttendanceRecord = {
  id: number;
  attendanceDate: string;
  kind: AttendanceKind;
  eventName: string | null;
  sundayServiceMode: SundayServiceMode | null;
};

export type MarkSundayAttendanceBody = {
  attendanceDate: string;
  mode: SundayServiceMode;
};

export type SundayServiceAttendanceAdminRow = {
  id: number;
  userId: number;
  fullName: string;
  phoneNumber: string | null;
  attendanceDate: string;
  sundayServiceMode: SundayServiceMode | null;
};
