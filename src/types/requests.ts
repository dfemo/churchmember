export type MemberViewAdminReply = {
  id: number;
  body: string;
  createdAt: string;
  adminName: string;
};

export type MemberViewSubmissionSummary = {
  id: number;
  title: string | null;
  body: string;
  createdAt: string;
  replies: MemberViewAdminReply[];
};

export type MemberViewAdminListRow = {
  id: number;
  memberUserId: number;
  memberName: string;
  memberPhone: string | null;
  title: string | null;
  body: string;
  createdAt: string;
  replyCount: number;
  awaitingFirstResponse: boolean;
};

export type PrayerRequestMemberRow = {
  id: number;
  body: string;
  createdAt: string;
  isActioned: boolean;
  actionedAt: string | null;
};

export type PrayerRequestAdminRow = {
  id: number;
  memberUserId: number;
  memberName: string;
  memberPhone: string | null;
  body: string;
  createdAt: string;
  isActioned: boolean;
  actionedAt: string | null;
  actionedByName: string | null;
};
