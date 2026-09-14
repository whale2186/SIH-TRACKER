"use client";

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FileText,
  Star,
  GitCompareArrows,
  BarChart3,
  History,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/problems", label: "Problems", icon: FileText },
  { href: "/shortlist", label: "Shortlist", icon: Star },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Bottom nav shows all items with horizontal scroll on mobile
const bottomNavItems = navItems;

export function Sidebar() {
  const pathname = usePathname();
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      // Set initial width
      setWidth(window.innerWidth);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="flex flex-col h-full sidebar">
      <div className="px-4 py-4 border-b">
        <h1 className="text-base font-semibold">SIH 2026 Tracker</h1>
        <p className="text-xs mt-0.5 text-muted-foreground">Problem Statement Tracker</p>
      </div>
      <div className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-lg mx-2",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t text-xs text-muted-foreground">
        Smart India Hackathon 2026
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      {width >= 1024 && (
        <aside className="flex-shrink-0 h-full sidebar">{nav}</aside>
      )}

      {/* Mobile bottom navigation - horizontal scroll for all items */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t safe-area-bottom bottom-nav">
        <div className="flex items-center gap-1 px-1 py-1 overflow-x-auto scrollbar-hide">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-1.5 px-2.5 rounded-lg min-w-[64px] transition-colors bottom-nav-item whitespace-nowrap shrink-0",
                  isActive(item.href)
                    ? "text-primary bg-muted"
                    : "text-muted-foreground"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium leading-tight bottom-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}