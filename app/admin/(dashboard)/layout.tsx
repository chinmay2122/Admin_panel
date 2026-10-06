"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Palette,
  Award,
  Briefcase,
  FileText,
  ShieldAlert,
  CreditCard,
  Sliders,
  Menu,
  X,
  LogOut,
  Loader2,
  Shield,
  ArrowUpRight,
  Database as DbIcon,
} from "lucide-react";
import { DEFAULT_ADMIN } from "@/lib/auth";
import { ToastProvider } from "@/components/ui";
import { isBrowserSupabaseConfigured } from "@/lib/supabase/client";
import { getAdminSidebarCountsAction, SidebarCounts } from "@/app/admin/sidebar-actions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Creators", href: "/admin/creators", icon: Sparkles },
  { name: "Collectors", href: "/admin/collectors", icon: Users },
  { name: "Artworks", href: "/admin/artworks", icon: Palette },
  { name: "Reports", href: "/admin/reports", icon: ShieldAlert },
  { name: "COR", href: "/admin/cor", icon: Award },
  { name: "Studio Settings", href: "/admin/settings", icon: Sliders },
];

const corSubNav = [
  { name: "Requests", href: "/admin/cor/requests" },
  { name: "Members", href: "/admin/cor/members" },
  { name: "Applications", href: "/admin/cor/applications" },
  { name: "Opportunities", href: "/admin/cor/opportunities" },
];

function getPageTitle(pathname: string): string {
  if (pathname.includes("/admin/overview")) return "Overview";
  if (pathname.includes("/admin/users")) return "Users";
  if (pathname.includes("/admin/subscriptions")) return "Subscriptions";
  if (pathname.includes("/admin/creators")) return "Creators";
  if (pathname.includes("/admin/artworks")) return "Artworks";
  if (pathname.includes("/admin/reports")) return "Reports & moderation";
  if (pathname.includes("/admin/cor/requests")) return "COR Requests";
  if (pathname.includes("/admin/cor/members")) return "COR Members";
  if (pathname.includes("/admin/cor/applications")) return "COR Applications";
  if (pathname.includes("/admin/cor/opportunities")) return "COR Opportunities";
  if (pathname.includes("/admin/cor")) return "Career Operations & Representation (COR)";
  if (pathname.includes("/admin/settings")) return "Studio settings";
  return "Overview";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [serverCounts, setServerCounts] = useState<SidebarCounts>({
    creators: 0,
    artworks: 0,
    reports: 0,
    corRequests: 0,
    corApplications: 0,
    totalCor: 0,
  });
  const [clearedCounts, setClearedCounts] = useState<Partial<SidebarCounts>>({});

  // Initialize cleared counts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminSidebarClearedCounts");
      if (stored) {
        setClearedCounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Could not parse stored counts", e);
    }
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await getAdminSidebarCountsAction();
        if (res.success && res.counts) {
          setServerCounts(res.counts);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar counts:", error);
      }
    };

    // Fetch immediately on mount and when pathname changes
    fetchCounts();

    // Poll every 5 seconds for real-time updates
    const intervalId = setInterval(fetchCounts, 5000);

    return () => clearInterval(intervalId);
  }, [pathname]);

  // Update cleared counts when a section is visited
  useEffect(() => {
    let changed = false;
    const newCleared = { ...clearedCounts };

    const checkAndClear = (pathMatch: string, key: keyof SidebarCounts) => {
      if (pathname === pathMatch || pathname.startsWith(`${pathMatch}/`)) {
        if (newCleared[key] !== serverCounts[key]) {
          newCleared[key] = serverCounts[key];
          changed = true;
        }
      }
    };

    checkAndClear("/admin/creators", "creators");
    checkAndClear("/admin/artworks", "artworks");
    checkAndClear("/admin/reports", "reports");
    checkAndClear("/admin/cor/requests", "corRequests");
    checkAndClear("/admin/cor/applications", "corApplications");

    if (changed) {
      setClearedCounts(newCleared);
      try {
        localStorage.setItem("adminSidebarClearedCounts", JSON.stringify(newCleared));
      } catch (e) {}
    }
  }, [pathname, serverCounts, clearedCounts]);

  // Calculate actual display counts (server count - cleared count)
  const displayCounts = {
    creators: Math.max(0, serverCounts.creators - (clearedCounts.creators || 0)),
    artworks: Math.max(0, serverCounts.artworks - (clearedCounts.artworks || 0)),
    reports: Math.max(0, serverCounts.reports - (clearedCounts.reports || 0)),
    corRequests: Math.max(0, serverCounts.corRequests - (clearedCounts.corRequests || 0)),
    corApplications: Math.max(0, serverCounts.corApplications - (clearedCounts.corApplications || 0)),
  };
  const displayTotalCor = displayCounts.corRequests + displayCounts.corApplications;

  const currentPageTitle = getPageTitle(pathname);

  const toggleMobileDrawer = () => setMobileDrawerOpen((prev) => !prev);
  const closeMobileDrawer = () => setMobileDrawerOpen(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        closeMobileDrawer();
      }
    };
    if (mobileDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#FAFAF8] text-[#141413] flex flex-col lg:flex-row font-sans selection:bg-[#F0DFD7] selection:text-[#9E4323]">
        {/* Mobile Top Navigation Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#E8E8E3] px-4 py-3 flex items-center justify-between">
          <Link
          href="/admin/overview"
          onClick={closeMobileDrawer}
          className="flex items-center gap-1.5 select-none"
        >
          <span className="font-semibold tracking-tight text-base text-[#141413]">
            ErasStudio<span className="text-xs align-super font-normal text-[#6E6E69]">®</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#6E6E69] px-1.5 py-0.5 rounded border border-[#E8E8E3] bg-white">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Admin Avatar on Mobile */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#E8E8E3] bg-white">
            <div className="w-5 h-5 rounded-full bg-[#EAEAE5] flex items-center justify-center text-[10px] font-semibold text-[#141413]">
              A
            </div>
            <span className="text-xs font-medium text-[#141413] pr-1">Admin</span>
          </div>

          <button
            type="button"
            onClick={toggleMobileDrawer}
            aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}
            className="p-1.5 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F5F5F0] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F]"
          >
            {mobileDrawerOpen ? (
              <X className="w-5 h-5 stroke-[1.75]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[1.75]" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Top Drawer Overlay & Panel */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-30 pt-[57px]">
          <div
            className="fixed inset-0 bg-[#141413]/25 backdrop-blur-[2px] transition-opacity"
            onClick={closeMobileDrawer}
          />

          <div className="relative bg-[#FAFAF8] border-b border-[#E8E8E3] px-4 py-6 shadow-sm space-y-6 animate-in slide-in-from-top-2 duration-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isCor = item.href === "/admin/cor";
                const isCorActive = isCor && (pathname === "/admin/cor" || pathname.startsWith("/admin/cor/"));
                const isActive =
                  pathname === item.href ||
                  (!isCor && pathname.startsWith(`${item.href}/`)) ||
                  (isCor && pathname === "/admin/cor");
                return (
                  <div key={item.href} className="space-y-0.5">
                    <Link
                      href={item.href}
                      onClick={closeMobileDrawer}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive || (isCor && isCorActive)
                          ? "bg-white text-[#141413] border border-[#E8E8E3] font-medium"
                          : "text-[#5F5F5A] hover:text-[#141413] hover:bg-white/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 stroke-[1.75] ${
                            isActive || (isCor && isCorActive) ? "text-[#B8532F]" : "text-[#7A7A75]"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.name === "Creators" && displayCounts.creators > 0 && (
                          <span className="text-[10px] font-bold bg-[#FBF0EA] text-[#B8532F] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {displayCounts.creators}
                          </span>
                        )}
                        {item.name === "Artworks" && displayCounts.artworks > 0 && (
                          <span className="text-[10px] font-bold bg-[#FBF0EA] text-[#B8532F] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {displayCounts.artworks}
                          </span>
                        )}
                        {item.name === "Reports" && displayCounts.reports > 0 && (
                          <span className="text-[10px] font-bold bg-[#FBF0EA] text-[#B8532F] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {displayCounts.reports}
                          </span>
                        )}
                        {item.name === "COR" && displayTotalCor > 0 && !isCorActive && (
                          <span className="text-[10px] font-bold bg-[#FBF0EA] text-[#B8532F] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {displayTotalCor}
                          </span>
                        )}
                        {(isActive || (isCor && isCorActive)) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B8532F]" />
                        )}
                      </div>
                    </Link>

                    {isCor && isCorActive && (
                      <div className="pl-6 py-1 space-y-0.5 border-l-2 border-[#E8E8E3] ml-4 my-1">
                        {corSubNav.map((sub) => {
                          const isSubActive =
                            pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={closeMobileDrawer}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${
                                isSubActive
                                  ? "text-[#B8532F] font-semibold bg-[#FBF0EA]"
                                  : "text-[#71716D] hover:text-[#141413]"
                              }`}
                            >
                              <span>{sub.name}</span>
                              {sub.name === "Requests" && displayCounts.corRequests > 0 && (
                                <span className="text-[9px] font-bold bg-white border border-[#E8E8E3] text-[#B8532F] px-1.5 py-0.5 rounded-full">
                                  {displayCounts.corRequests}
                               </span>
                              )}
                              {sub.name === "Applications" && displayCounts.corApplications > 0 && (
                                <span className="text-[9px] font-bold bg-white border border-[#E8E8E3] text-[#B8532F] px-1.5 py-0.5 rounded-full">
                                  {displayCounts.corApplications}
                               </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

            <div className="pt-4 border-t border-[#E8E8E3] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center text-xs font-medium text-[#141413]">
                  A
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-[#141413]">Admin Console</p>
                  <p className="text-[11px] text-[#71716D]">admin123@erasstudio.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeMobileDrawer();
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E8E3] bg-white text-xs font-medium text-[#71716D] hover:text-[#B83838] hover:border-[#F2C6C6] transition-colors cursor-pointer"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5 stroke-[1.75]" />
                )}
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#E8E8E3] bg-[#FAFAF8] min-h-screen sticky top-0 h-screen select-none">
        {/* Top Brand Header */}
        <div className="p-6 border-b border-[#E8E8E3] flex items-center justify-between">
          <Link href="/admin/overview" className="flex items-center gap-1.5 group">
            <span className="font-semibold tracking-tight text-lg text-[#141413] group-hover:text-[#B8532F] transition-colors">
              ErasStudio<span className="text-xs align-super font-normal text-[#6E6E69]">®</span>
            </span>
          </Link>
          <span className="text-[10px] font-medium tracking-wider uppercase text-[#6E6E69] px-2 py-0.5 rounded border border-[#E8E8E3] bg-white">
            Console
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="mb-2.5 px-3 text-[11px] font-medium uppercase tracking-wider text-[#8A8A85]">
            Platform
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isCor = item.href === "/admin/cor";
              const isCorActive = isCor && (pathname === "/admin/cor" || pathname.startsWith("/admin/cor/"));
              const isActive =
                pathname === item.href ||
                (!isCor && pathname.startsWith(`${item.href}/`)) ||
                (isCor && pathname === "/admin/cor");
              return (
                <div key={item.href} className="space-y-0.5">
                  <Link
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm transition-all duration-150 ${
                      isActive || (isCor && isCorActive)
                        ? "bg-white text-[#141413] font-medium border border-[#E8E8E3]"
                        : "text-[#5E5E59] hover:text-[#141413] hover:bg-[#F3F3EE]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 stroke-[1.75] transition-colors ${
                          isActive || (isCor && isCorActive)
                            ? "text-[#B8532F]"
                            : "text-[#7A7A75] group-hover:text-[#141413]"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.name === "Creators" && displayCounts.creators > 0 && (
                        <span className="text-[10px] font-bold bg-[#FBF0EA] text-[#B8532F] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {displayCounts.creators}
                        </span>
                      )}
                      {item.name === "Artworks" && displayCounts.artworks > 0 && (
                        <span className="text-[10px] font-bold bg-[#FBF0EA] text-[#B8532F] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {displayCounts.artworks}
                        </span>
                      )}
                      {item.name === "Reports" && displayCounts.reports > 0 && (
                        <span className="text-[10px] font-bold bg-[#FBF0EA] text-[#B8532F] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {displayCounts.reports}
                        </span>
                      )}
                      {item.name === "COR" && displayTotalCor > 0 && !isCorActive && (
                        <span className="text-[10px] font-bold bg-[#FBF0EA] text-[#B8532F] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {displayTotalCor}
                        </span>
                      )}
                      {(isActive || (isCor && isCorActive)) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8532F]" />
                      )}
                    </div>
                  </Link>

                  {/* Render COR sub-nav when in COR section */}
                  {isCor && isCorActive && (
                    <div className="pl-5 pr-2 py-1 space-y-0.5 border-l-2 border-[#E8E8E3] ml-4 my-1">
                      {corSubNav.map((sub) => {
                        const isSubActive =
                          pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              isSubActive
                                ? "text-[#B8532F] font-semibold bg-[#FBF0EA]"
                                : "text-[#71716D] hover:text-[#141413] hover:bg-[#F3F3EE]"
                            }`}
                          >
                            <span>{sub.name}</span>
                            {sub.name === "Requests" && displayCounts.corRequests > 0 && (
                              <span className="text-[9px] font-bold bg-white border border-[#E8E8E3] text-[#B8532F] px-1.5 py-0.5 rounded-full">
                                {displayCounts.corRequests}
                              </span>
                            )}
                            {sub.name === "Applications" && displayCounts.corApplications > 0 && (
                              <span className="text-[9px] font-bold bg-white border border-[#E8E8E3] text-[#B8532F] px-1.5 py-0.5 rounded-full">
                                {displayCounts.corApplications}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-8 mb-2.5 px-3 text-[11px] font-medium uppercase tracking-wider text-[#8A8A85]">
            Community
          </div>
          <div className="space-y-1 text-xs">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-[#5E5E59] hover:text-[#141413] hover:bg-[#F3F3EE] transition-colors"
            >
              <span>Public Directory</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A85]" />
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-[#5E5E59] hover:text-[#141413] hover:bg-[#F3F3EE] transition-colors"
            >
              <span>Editorial Archive</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A85]" />
            </a>
          </div>
        </div>

        {/* Sidebar Footer with Session & Logout */}
        <div className="p-4 border-t border-[#E8E8E3] bg-[#FAFAF8]">
          <div className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-[#E8E8E3] hover:bg-white transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0">
                A
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-medium text-[#141413] truncate">
                  Admin User
                </p>
                <p className="text-[11px] text-[#71716D] truncate">
                  System Lead
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Log out"
              title="Log out"
              className="p-1.5 rounded-md text-[#8A8A85] hover:text-[#B83838] hover:bg-[#FDF2F2] transition-colors ml-1 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F]"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 stroke-[1.75]" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Dynamic Top Bar */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-[#E8E8E3] bg-[#FAFAF8]/95 backdrop-blur-sm sticky top-0 z-20">
          {/* Active Page Title */}
          <div>
            <h1 className="text-lg font-medium tracking-tight text-[#141413]">
              {currentPageTitle}
            </h1>
          </div>

          {/* Right Top Bar Controls: Admin Avatar & Logout Button */}
          <div className="flex items-center gap-3">
            {/* Supabase Status Pill */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs text-[#5E5E59]"
              title={
                isBrowserSupabaseConfigured
                  ? "Connected to live Supabase database"
                  : "Using local in-memory dataset. Set NEXT_PUBLIC_SUPABASE_URL in .env.local to activate live Supabase."
              }
            >
              <DbIcon className="w-3.5 h-3.5 text-[#8A8A85]" />
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBrowserSupabaseConfigured
                    ? "bg-[#3B7E55] animate-pulse"
                    : "bg-[#D97706]"
                }`}
              />
              <span className="font-medium text-[#141413]">
                {isBrowserSupabaseConfigured ? "Supabase Live" : "DB: Local Mode"}
              </span>
            </div>

            {/* Admin Avatar Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs text-[#141413]">
              <div className="w-5 h-5 rounded-full bg-[#EAEAE5] flex items-center justify-center text-[10px] font-semibold text-[#141413]">
                A
              </div>
              <span className="font-medium">Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B7E55] ml-0.5" title="Online" />
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Log out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E8E3] bg-white text-xs font-medium text-[#5E5E59] hover:text-[#B83838] hover:border-[#F2C6C6] hover:bg-[#FDF2F2] transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F]"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5 stroke-[1.75]" />
              )}
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="flex-1 px-4 py-6 sm:px-6 md:px-8 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
    </ToastProvider>
  );
}
