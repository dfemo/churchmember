export type MemberStatus = "Active" | "Inactive";

export type UserSummary = {
  id: number;
  fullName: string;
  phoneNumber: string;
  roles: string[];
};

export type AuthResult = {
  accessToken: string;
  mustChangePassword: boolean;
  user: UserSummary;
};

export type MemberProfile = {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  title: string | null;
  position: string | null;
  departments?: string[];
  status: MemberStatus;
  roles: string[];
  mustChangePassword: boolean;
  hasProfilePhoto?: boolean;
  hasBirthdayPhoto1?: boolean;
  hasBirthdayPhoto2?: boolean;
  hasBirthdayPhoto3?: boolean;
  fatherUserId?: number | null;
  fatherFullName?: string | null;
  fatherPhoneNumber?: string | null;
  motherUserId?: number | null;
  motherFullName?: string | null;
  motherPhoneNumber?: string | null;
  parentUserId?: number | null;
  parentFullName?: string | null;
  parentPhoneNumber?: string | null;
  spouse?: MemberFamilyLink | null;
  siblings?: MemberFamilyLink[];
  children?: MemberFamilyLink[];
};

export type MemberFamilyLink = {
  id: number;
  fullName: string;
  phoneNumber: string;
};

export type UpdateProfileRequest = {
  fullName: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  title: string | null;
  position: string | null;
};

export type MemberListItem = {
  id: number;
  fullName: string;
  phoneNumber: string;
  status: MemberStatus;
  title: string | null;
  position: string | null;
  departments?: string[];
  roles: string[];
  dateOfBirth: string | null;
  fatherUserId?: number | null;
  fatherFullName?: string | null;
  fatherPhoneNumber?: string | null;
  motherUserId?: number | null;
  motherFullName?: string | null;
  motherPhoneNumber?: string | null;
  parentUserId?: number | null;
  parentFullName?: string | null;
  parentPhoneNumber?: string | null;
  spouseFullName?: string | null;
  /** Comma-separated sibling names from list API */
  siblingsSummary?: string | null;
  childCount?: number;
};

export type UpdateMemberRequest = {
  fullName: string;
  /** Digits only (E.164 without +) after client normalization, matching API storage */
  phoneNumber: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  title: string | null;
  position: string | null;
  departments?: string[];
  status: MemberStatus;
  role: "Admin" | "Member";
  fatherUserId?: number | null;
  motherUserId?: number | null;
  parentUserId?: number | null;
  spouseUserId?: number | null;
  /** Omit to leave siblings unchanged; send array (possibly empty) to replace */
  siblingUserIds?: number[];
};

/** Admin-only POST /api/members/bulk */
export type BulkImportMemberRow = {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string | null;
};

export type BulkImportMembersRequest = {
  rows: BulkImportMemberRow[];
  defaultPassword: string;
};

export type BulkImportMemberResultRow = {
  excelRowNumber: number;
  success: boolean;
  error: string | null;
  createdUserId: number | null;
};

export type BulkImportMembersResponse = {
  createdCount: number;
  failedCount: number;
  results: BulkImportMemberResultRow[];
};

/** Admin-only POST /api/members */
export type CreateMemberRequest = {
  fullName: string;
  phoneNumber: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  title: string | null;
  position: string | null;
  departments?: string[];
  status: MemberStatus;
  role: "Admin" | "Member";
  defaultPassword: string;
  fatherUserId?: number | null;
  motherUserId?: number | null;
  parentUserId?: number | null;
  spouseUserId?: number | null;
  siblingUserIds?: number[];
};

export type BirthdayPersonResponse = {
  id: number;
  fullName: string;
  date: string;
  kind: "Today" | "Upcoming";
};

export type DashboardStatsResponse = {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  todaysBirthdays: BirthdayPersonResponse[];
  upcomingBirthdaysNext7Days: BirthdayPersonResponse[];
  pendingPrayerRequests: number;
  memberViewsAwaitingResponse: number;
};

export type BirthdayWhatsappCelebrantSendResult = {
  celebrantUserId: number;
  fullName: string;
  outcome: string;
  sentToFamilyOrCelebrant: string | null;
  sentToChurchLine: string | null;
  recipientMarkedSentAtUtc?: string | null;
  churchMarkedSentAtUtc?: string | null;
};

export type BirthdayWhatsappAnnouncementRunResponse = {
  localDate: string;
  timeZone: string;
  results: BirthdayWhatsappCelebrantSendResult[];
};
