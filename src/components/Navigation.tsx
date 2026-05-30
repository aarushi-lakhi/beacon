"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Activity,
  BarChart3,
  Radio,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "OR Schedule", icon: Calendar },
  { href: "/readiness", label: "Readiness Center", icon: Activity },
  { href: "/metrics", label: "Executive Metrics", icon: BarChart3 },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-beacon-navy flex flex-col z-50">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-beacon-blue rounded-lg flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-none">Beacon</div>
            <div className="text-gray-400 text-xs mt-0.5">Surgical Operations</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "sidebar-link",
              pathname === href ? "sidebar-link-active" : "sidebar-link-inactive"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">HIPAA Compliant</span>
        </div>
        <div className="mt-1 text-xs text-gray-600">Demo Mode · Synthetic Data</div>
      </div>
    </aside>
  );
}
