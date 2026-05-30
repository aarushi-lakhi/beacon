"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Calendar,
  Activity,
  BarChart3,
  GitBranch,
  ScrollText,
  Shield,
  Radio,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "OR Schedule", icon: Calendar, desc: "Tomorrow's cases" },
  { href: "/readiness", label: "Readiness Center", icon: Activity, desc: "Live status" },
  { href: "/orchestration", label: "Agent Pipeline", icon: GitBranch, desc: "Live orchestration" },
  { href: "/audit", label: "Audit Log", icon: ScrollText, desc: "Full activity trace" },
  { href: "/metrics", label: "Executive Metrics", icon: BarChart3, desc: "KPIs & impact" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside
      className="sidebar fixed left-0 top-0 h-full flex flex-col z-50"
      style={{ width: "var(--sidebar-width, 240px)" }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-beacon-600 rounded-xl flex items-center justify-center animate-pulse-beacon">
              <Radio className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none tracking-tight">Beacon</div>
            <div className="text-gray-500 text-[10px] mt-0.5 font-medium uppercase tracking-widest">
              Surgical AI
            </div>
          </div>
        </div>

        {/* System status */}
        <div className="mt-4 flex items-center justify-between px-2 py-2 rounded-lg bg-white/5 border border-white/8">
          <div className="flex items-center gap-2">
            <div className="live-dot">
              <span className="live-dot-ping bg-green-400" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </div>
            <span className="text-xs text-green-400 font-medium">System Active</span>
          </div>
          <Wifi className="w-3 h-3 text-gray-600" />
        </div>

        {mounted && (
          <div className="mt-2 text-center text-[11px] text-gray-600 font-mono tabular-nums">
            {time}
          </div>
        )}
      </div>

      <div className="px-3 mb-2">
        <div className="h-px bg-white/6" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
        <div className="section-header px-2 pt-2">Navigation</div>
        {navItems.map(({ href, label, icon: Icon, desc }) => {
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
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-none">{label}</div>
                <div className={cn(
                  "text-[10px] mt-0.5 truncate",
                  active ? "text-blue-200" : "text-gray-600 group-hover:text-gray-400"
                )}>
                  {desc}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 mt-auto">
        <div className="h-px bg-white/6 mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-xs text-gray-600 font-medium">HIPAA Compliant · SOC 2</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0" />
          <div>
            <div className="text-[11px] text-gray-300 font-medium leading-none">Demo Mode</div>
            <div className="text-[10px] text-gray-600 mt-0.5">Synthetic data only</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
