"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Activity,
  BarChart3,
  GitBranch,
  ScrollText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LighthouseBeacon from "./LighthouseBeacon";

const navItems = [
  { href: "/",              label: "OR Schedule",       icon: Calendar   },
  { href: "/readiness",     label: "Readiness Center",  icon: Activity   },
  { href: "/orchestration", label: "Agent Pipeline",    icon: GitBranch  },
  { href: "/audit",         label: "Audit Log",         icon: ScrollText },
  { href: "/metrics",       label: "Executive Metrics", icon: BarChart3  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside
      className="sidebar fixed left-0 top-0 h-full flex flex-col z-50"
      style={{ width: "var(--sidebar-width, 240px)" }}
    >
      {/* ── Brand ─────────────────────────────────────── */}
      <div className="px-5 pt-7 pb-5">
        <Link href="/" className="flex items-center gap-3.5 group">
          <LighthouseBeacon size={40} />
          <div>
            <div
              className="text-white font-bold text-xl leading-none tracking-tight"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Beacon
            </div>
            <div className="text-[10px] text-amber-500/60 mt-1 tracking-widest uppercase font-semibold">
              Surgical AI
            </div>
          </div>
        </Link>

        {/* Live indicator */}
        <div className="mt-5 flex items-center gap-2">
          <div className="live-dot">
            <span className="live-dot-ping bg-emerald-400" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <span className="text-xs text-gray-500 font-medium">Live · Synthetic data</span>
        </div>
      </div>

      <div className="px-4 mb-1">
        <div className="h-px bg-white/5" />
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-item group",
                active ? "nav-item-active" : "nav-item-inactive"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="px-4 py-5 mt-auto">
        <div className="h-px bg-white/5 mb-4" />
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-gray-600 flex-shrink-0" />
          <span className="text-[11px] text-gray-600 font-medium">
            HIPAA Compliant · SOC 2
          </span>
        </div>
      </div>
    </aside>
  );
}
