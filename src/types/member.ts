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
  status: MemberStatus;
  roles: string[];
  mustChangePassword: boolean;
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
  roles: string[];
  dateOfBirth: string | null;
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
  status: MemberStatus;
  role: "Admin" | "Member";
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
  status: MemberStatus;
  role: "Admin" | "Member";
  defaultPassword: string;
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
};
