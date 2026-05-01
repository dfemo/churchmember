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

export type BulkAttendanceBody = {
  attendanceDate: string;
  kind: AttendanceKind;
  eventName?: string | null;
  sundayServiceMode?: SundayServiceMode | null;
  userIds: number[];
};

export type BulkAttendanceItemResult = {
  userId: number;
  status: string;
  record?: AttendanceRecord | null;
};

export type BulkAttendanceResponse = {
  createdCount: number;
  skippedDuplicateCount: number;
  skippedNotFoundCount: number;
  results: BulkAttendanceItemResult[];
};
