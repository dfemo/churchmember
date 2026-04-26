import Image from "next/image";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  cardFooter?: ReactNode;
};

/**
 * Flat split layout: solid color panels, geometric decor, no glass/blur/heavy shadows
 * (inspired by flat app onboarding, e.g. Dribbble community / matching UIs).
 */
export function AuthShell({ title, subtitle, children, cardFooter }: AuthShellProps) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-white md:flex-row">
      {/* Left: flat brand panel — solid fill + simple shapes (no gradients/blur) */}
      <div className="relative flex min-h-[38vh] flex-1 flex-col justify-end overflow-hidden bg-[#C4B5FD] px-8 pb-10 pt-8 md:min-h-svh md:max-w-[48%] md:justify-center md:px-12 md:py-12 lg:px-16">
        {/* Static geometric decor — flat layers */}
        <div
          className="pointer-events-none absolute -right-8 top-8 h-28 w-28 rounded-3xl bg-[#A78BFA]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-16 left-6 h-20 w-20 rounded-full border-4 border-white/80 bg-[#DDD6FE]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-6 right-10 h-32 w-24 rounded-2xl bg-white/30"
          aria-hidden
        />

        <div className="relative z-10 text-left">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-slate-900/10 bg-white">
              <Image src="/logo.svg" alt="" width={40} height={40} className="h-9 w-9" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Church Members
            </span>
          </div>
          <h1 className="max-w-md text-3xl font-bold leading-[1.15] tracking-tight text-slate-900 md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-slate-800/90 md:text-lg">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: form — flat white surface, hairline border only on desktop */}
      <div className="flex flex-1 items-stretch justify-center bg-[#FAFAFA] md:min-h-svh md:items-center md:border-l md:border-slate-200">
        <div className="w-full max-w-md p-6 sm:p-8 md:py-12">
          <div className="border border-slate-200 bg-white p-6 sm:p-8">
            {children}
            {cardFooter}
          </div>
        </div>
      </div>
    </div>
  );
}
