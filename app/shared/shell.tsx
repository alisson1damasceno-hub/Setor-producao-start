"use client";

import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  Factory,
  KanbanSquare,
  Package,
} from "lucide-react";

const nav = [
  { href: "/", key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/produtos", key: "produtos", label: "Produtos", icon: Package },
  { href: "/ficha-tecnica", key: "ficha", label: "Fichas Técnicas", icon: ClipboardList },
  { href: "/ordens", key: "ordens", label: "Ordens", icon: Factory },
  { href: "/kanban", key: "kanban", label: "Kanban", icon: KanbanSquare },
];

export function Shell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="container">

      <header className="top">
        <span className="eyebrow">Setor de Produção</span>
        <h1>Controle de Produção</h1>
        <p>Fichas técnicas, ordens e Kanban integrados.</p>
      </header>

      <nav className="main-nav">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={active === item.key ? "active" : ""}
            >
              <Icon size={16} /> {item.label}
            </Link>
          );
        })}
      </nav>

      <main>{children}</main>

    </div>
  );
}