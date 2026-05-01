"use client";

import type { MemberFamilyLink, MemberProfile } from "@/types/member";
import Link from "next/link";
import { Baby, Heart, UserCircle2, Users } from "lucide-react";

type TieItem = {
  key: string;
  relation: string;
  person: MemberFamilyLink;
  accent: "sky" | "rose" | "pink" | "violet" | "emerald";
  Icon: typeof UserCircle2;
};

function telHref(phone: string | undefined): string | undefined {
  if (!phone?.trim()) return undefined;
  const t = phone.trim();
  if (t.startsWith("+")) return `tel:${t}`;
  const digits = t.replace(/\D/g, "");
  return digits ? `tel:+${digits}` : undefined;
}

function buildTies(m: MemberProfile): TieItem[] {
  const list: TieItem[] = [];

  if (m.fatherUserId != null && m.fatherFullName) {
    list.push({
      key: `father-${m.fatherUserId}`,
      relation: "Father",
      person: {
        id: m.fatherUserId,
        fullName: m.fatherFullName,
        phoneNumber: m.fatherPhoneNumber ?? "",
      },
      accent: "sky",
      Icon: UserCircle2,
    });
  }

  if (m.motherUserId != null && m.motherFullName) {
    list.push({
      key: `mother-${m.motherUserId}`,
      relation: "Mother",
      person: {
        id: m.motherUserId,
        fullName: m.motherFullName,
        phoneNumber: m.motherPhoneNumber ?? "",
      },
      accent: "rose",
      Icon: UserCircle2,
    });
  }

  if (!list.some((x) => x.relation === "Father" || x.relation === "Mother") && m.parentUserId != null && m.parentFullName) {
    list.push({
      key: `parent-${m.parentUserId}`,
      relation: "Parent",
      person: {
        id: m.parentUserId,
        fullName: m.parentFullName,
        phoneNumber: m.parentPhoneNumber ?? "",
      },
      accent: "sky",
      Icon: UserCircle2,
    });
  }

  if (m.spouse) {
    list.push({
      key: `spouse-${m.spouse.id}`,
      relation: "Spouse / partner",
      person: m.spouse,
      accent: "pink",
      Icon: Heart,
    });
  }

  for (const s of m.siblings ?? []) {
    list.push({
      key: `sibling-${s.id}`,
      relation: "Sibling",
      person: s,
      accent: "violet",
      Icon: Users,
    });
  }

  for (const ch of m.children ?? []) {
    list.push({
      key: `child-${ch.id}`,
      relation: "Child",
      person: ch,
      accent: "emerald",
      Icon: Baby,
    });
  }

  return list;
}

const accentStyles: Record<TieItem["accent"], { ring: string; bg: string; icon: string }> = {
  sky: {
    ring: "border-sky-200 hover:border-sky-400 hover:bg-sky-50/80",
    bg: "from-sky-50 to-white",
    icon: "bg-sky-500/15 text-sky-700",
  },
  rose: {
    ring: "border-rose-200 hover:border-rose-400 hover:bg-rose-50/80",
    bg: "from-rose-50 to-white",
    icon: "bg-rose-500/15 text-rose-700",
  },
  pink: {
    ring: "border-pink-200 hover:border-pink-400 hover:bg-pink-50/80",
    bg: "from-pink-50 to-white",
    icon: "bg-pink-500/15 text-pink-700",
  },
  violet: {
    ring: "border-violet-200 hover:border-violet-400 hover:bg-violet-50/80",
    bg: "from-violet-50 to-white",
    icon: "bg-violet-500/15 text-violet-700",
  },
  emerald: {
    ring: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/80",
    bg: "from-emerald-50 to-white",
    icon: "bg-emerald-500/15 text-emerald-700",
  },
};

export function FamilyTiesCards({ profile, isAdmin }: { profile: MemberProfile; isAdmin: boolean }) {
  const ties = buildTies(profile);

  if (ties.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 border-dashed bg-slate-50/60 p-6 text-center">
        <p className="text-sm font-medium text-slate-700">No family ties on file</p>
        <p className="mt-1 text-xs text-slate-500">When your church links parents, spouse, or siblings to your profile, they will appear here.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-slate-900">Family ties</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        {isAdmin ? "Click a card to open their profile in user management." : "Tap a card to call when a mobile number is listed. Profile links are admin-only."}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ties.map((tie) => {
          const st = accentStyles[tie.accent];
          const adminHref = isAdmin ? `/dashboard/user-management/${tie.person.id}` : undefined;
          const phoneLink = telHref(tie.person.phoneNumber);
          const clickable = Boolean(adminHref || phoneLink);

          const cardInner = (
            <>
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${st.icon}`}
                aria-hidden
              >
                <tie.Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tie.relation}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{tie.person.fullName}</p>
                {tie.person.phoneNumber ? (
                  <p className="mt-0.5 truncate text-xs text-slate-600">{tie.person.phoneNumber}</p>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-400">No phone on file</p>
                )}
              </div>
            </>
          );

          const cardClass = [
            "flex items-start gap-3 rounded-2xl border bg-gradient-to-br p-4 text-left shadow-sm transition",
            st.bg,
            st.ring,
            clickable ? "cursor-pointer" : "cursor-default opacity-95",
          ].join(" ");

          if (adminHref) {
            return (
              <li key={tie.key}>
                <Link href={adminHref} className={cardClass} prefetch={false} aria-label={`Open profile: ${tie.person.fullName}`}>
                  {cardInner}
                </Link>
              </li>
            );
          }

          if (phoneLink) {
            return (
              <li key={tie.key}>
                <a href={phoneLink} className={cardClass} aria-label={`Call ${tie.person.fullName}`}>
                  {cardInner}
                </a>
              </li>
            );
          }

          return (
            <li key={tie.key}>
              <div className={cardClass} aria-label={tie.person.fullName}>
                {cardInner}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
