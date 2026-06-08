"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function WarehouseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3ecf8e" />
          <stop offset="100%" stopColor="#2db97d" />
        </linearGradient>
      </defs>
      <rect x="3" y="15" width="22" height="10" rx="2" fill="rgba(62,207,142,0.15)" stroke="url(#logoGrad)" strokeWidth="1.5"/>
      <rect x="6" y="8" width="16" height="8" rx="2" fill="rgba(45,185,125,0.12)" stroke="#3ecf8e" strokeWidth="1.5"/>
      <path d="M10 8 L14 4 L18 8" stroke="#3ecf8e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="14" y1="15" x2="14" y2="25" stroke="rgba(62,207,142,0.4)" strokeWidth="1"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1.5L1.5 5.5v1.5h15V5.5L9 1.5z" fill="currentColor" opacity="0.9" />
      <rect x="2" y="7" width="14" height="9.5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.9" />
      <rect x="6.5" y="10" width="5" height="6.5" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="3" y="8.5" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
      <rect x="12" y="8.5" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 2h6l8 8-6 6-8-8V2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="5.5" cy="5.5" r="1.2" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="5" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.9" />
      <path d="M12 7.5h3l2 3v2.5h-5V7.5z" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.9" />
      <circle cx="4" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="14.5" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.9" />
      <path d="M6.5 2.5h5a.5.5 0 010 1h-5a.5.5 0 010-1z" fill="currentColor" opacity="0.9" />
      <line x1="6" y1="7.5" x2="12" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6" y1="12.5" x2="10" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.9" />
      <path d="M6.5 2.5h5a.5.5 0 010 1h-5a.5.5 0 010-1z" fill="currentColor" opacity="0.9" />
      <path d="M6 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/inventory", label: "Inventário", icon: <InventoryIcon /> },
  { href: "/products", label: "Produtos", icon: <TagIcon /> },
  { href: "/suppliers", label: "Fornecedores", icon: <TruckIcon /> },
  { href: "/purchase-orders", label: "Encomendas", icon: <ClipboardIcon /> },
  { href: "/stocktake", label: "Contagem", icon: <ClipboardCheckIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-logo">
          <WarehouseIcon />
          <span className="sidebar__title">StockSmart</span>
        </div>
        <span className="sidebar__tagline">Gestão de Inventário</span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar__item${pathname === item.href ? " sidebar__item--active" : ""}`}
          >
            <span className="sidebar__item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__version">v1.0</span>
      </div>
    </aside>
  );
}
