"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react";
import { useLogoutMutation } from "@/features/auth/api/authApi";
import {
  selectAuthName,
  selectSchoolName,
} from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import { navGroups, type NavItem } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }
  if (!pathname.startsWith(`${href}/`)) {
    return false;
  }
  // Keep Attendance vs Reason siblings from both highlighting
  if (href === "/attendance" && pathname.startsWith("/attendance/reasons")) {
    return false;
  }
  return true;
}

function isBranchActive(pathname: string, item: NavItem): boolean {
  if (item.href && isActive(pathname, item.href)) {
    return true;
  }

  return item.children?.some((child) => isBranchActive(pathname, child)) ?? false;
}

const linkClass = (active: boolean, collapsed: boolean) =>
  `flex min-h-11 cursor-pointer items-center rounded-full text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
    collapsed ? "w-11 justify-center px-0" : "gap-3 px-3"
  } ${
    active
      ? "bg-primary text-on-primary shadow-sm"
      : "text-foreground hover:bg-primary-soft"
  }`;

function NavLinkItem({
  item,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  if (!item.href) {
    return null;
  }

  const Icon = item.icon;
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={linkClass(active, collapsed)}
    >
      <Icon aria-hidden className="h-4 w-4 shrink-0" />
      {collapsed ? null : item.label}
    </Link>
  );
}

function NavBranch({
  item,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const childActive = isBranchActive(pathname, item);
  const [open, setOpen] = useState(childActive);
  const Icon = item.icon;

  if (!item.children?.length) {
    return (
      <NavLinkItem
        item={item}
        pathname={pathname}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
    );
  }

  if (collapsed) {
    return (
      <ul className="space-y-1">
        {item.children.map((child) => (
          <li key={child.href ?? child.label} className="flex justify-center">
            <NavLinkItem
              item={child}
              pathname={pathname}
              onNavigate={onNavigate}
              collapsed
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`w-full ${linkClass(false, false)} ${childActive ? "bg-primary-soft" : ""}`}
      >
        <Icon aria-hidden className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      {open ? (
        <ul className="mt-1 space-y-1 pl-4">
          {item.children.map((child) => (
            <li key={child.href ?? child.label}>
              <NavLinkItem
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.title}>
          {collapsed ? (
            <p className="sr-only">{group.title}</p>
          ) : (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {group.title}
            </p>
          )}
          <ul className={`space-y-1 ${collapsed ? "" : "mt-2"}`}>
            {group.items.map((item) => (
              <li
                key={item.href ?? item.label}
                className={collapsed ? "flex justify-center" : undefined}
              >
                <NavBranch
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({
  schoolName,
  collapsed = false,
}: {
  schoolName: string;
  collapsed?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${collapsed ? "justify-center px-0" : "px-2"}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary">
        MS
      </span>
      {collapsed ? null : (
        <div>
          <p className="text-sm font-semibold text-foreground">My School</p>
          <p className="text-xs text-muted">{schoolName}</p>
        </div>
      )}
    </div>
  );
}

function SidebarAccount({
  name,
  initials,
  isLoading,
  onLogout,
  collapsed = false,
}: {
  name: string;
  initials: string;
  isLoading: boolean;
  onLogout: () => void;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 p-2 pb-4">
        <span
          title={name}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
        >
          {initials}
        </span>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoading}
          aria-label="Logout"
          title="Logout"
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <LogOut aria-hidden className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3">
        <span
          aria-hidden
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted">School admin</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={isLoading}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-white text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary-soft disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <LogOut aria-hidden className="h-4 w-4" />
        {isLoading ? "Signing out…" : "Logout"}
      </button>
    </div>
  );
}

const glassAside =
  "flex flex-col bg-surface text-foreground";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const name = useAppSelector(selectAuthName) ?? "School admin";
  const schoolName = useAppSelector(selectSchoolName) ?? "My School";
  const [logout, { isLoading }] = useLogoutMutation();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function onLogout() {
    try {
      await logout().unwrap();
    } catch {
      // Session is cleared locally even if the request fails.
    }
    router.replace("/login");
  }

  return (
    <div
      className={`min-h-dvh bg-surface lg:grid ${
        sidebarOpen
          ? "lg:grid-cols-[240px_minmax(0,1fr)]"
          : "lg:grid-cols-[72px_minmax(0,1fr)]"
      }`}
    >
      <aside
        className={`hidden min-h-dvh border-r border-border lg:flex ${glassAside}`}
      >
        <div
          className={`flex py-5 ${
            sidebarOpen
              ? "items-center justify-between gap-2 px-3"
              : "flex-col items-center gap-3 px-2"
          }`}
        >
          <SidebarBrand schoolName={schoolName} collapsed={!sidebarOpen} />
          <button
            type="button"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </button>
        </div>
        <div
          className={`flex-1 overflow-y-auto pb-4 ${sidebarOpen ? "px-3" : "px-2"}`}
        >
          <SidebarNav collapsed={!sidebarOpen} />
        </div>
        <SidebarAccount
          name={name}
          initials={initials}
          isLoading={isLoading}
          onLogout={onLogout}
          collapsed={!sidebarOpen}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 cursor-pointer bg-black/20"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={`relative z-50 h-full w-[min(100%,280px)] border-r border-border ${glassAside}`}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <SidebarBrand schoolName={schoolName} />
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground hover:bg-primary-soft"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarAccount
              name={name}
              initials={initials}
              isLoading={isLoading}
              onLogout={onLogout}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-dvh flex-col bg-surface">
        <header className="flex h-14 items-center gap-3 px-4 sm:px-8">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-primary-soft lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="hidden text-sm text-muted sm:block">
            {schoolName} <span className="mx-1">&gt;</span> School admin
          </p>
        </header>
        <main className="flex-1 overflow-y-auto px-4 pb-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
