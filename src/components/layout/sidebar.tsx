"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Star,
  GitCompareArrows,
  BarChart3,
  History,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/problems", label: "Problems", icon: FileText },
  { href: "/shortlist", label: "Shortlist", icon: Star },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Bottom nav shows a subset on mobile
const bottomNavItems = navItems.slice(0, 5);

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-gray-200">
        <h1 className="text-base font-semibold text-gray-900">SIH 2026 Tracker</h1>
        <p className="text-xs text-gray-500 mt-0.5">Problem Statement Tracker</p>
      </div>
      <div className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-gray-100 text-gray-900 font-medium border-r-2 border-gray-900"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
        Smart India Hackathon 2026
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block bg-white border-r border-gray-200 w-56 flex-shrink-0 h-full">
        {nav}
      </aside>

      {/* Mobile hamburger for full nav (extra items like Settings/History) */}
      <button
        className="lg:hidden fixed top-3 right-3 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out drawer */}
      <aside
        className={clsx(
          "lg:hidden fixed inset-y-0 left-0 z-40 bg-white w-64 shadow-xl transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg min-w-[56px] transition-colors",
                  isActive(item.href)
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-400"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
