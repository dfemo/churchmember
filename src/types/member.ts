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
  status: MemberStatus;
  roles: string[];
  mustChangePassword: boolean;
};

export type UpdateProfileRequest = {
  fullName: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
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
