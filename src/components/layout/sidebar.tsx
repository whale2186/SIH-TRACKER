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
  { href: "/problems", label: "Problem Statements", icon: FileText },
  { href: "/shortlist", label: "My Shortlist", icon: Star },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

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
                "flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
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
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white border border-gray-200 rounded-md shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-white border-r border-gray-200 w-56 flex-shrink-0 h-full",
          "lg:block",
          mobileOpen
            ? "fixed inset-y-0 left-0 z-40"
            : "hidden"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
