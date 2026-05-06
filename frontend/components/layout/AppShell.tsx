"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./AppShell.module.css";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/search", label: "Search" },
  { href: "/graph", label: "Graph" },
  { href: "/settings", label: "Settings" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>AI</div>
          <div className={styles.brandTitle}>Knowledge Space</div>
          <div className={styles.brandSub}>Local-first RAG workspace</div>
        </div>
        <nav className={styles.nav}>
          {nav.map((item) => (
            <Link
              key={item.href}
              className={`${styles.link} ${pathname === item.href ? styles.active : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <strong>Agentic document intelligence</strong>
          <span className="muted">Private by default · SQLite · Chroma · Local files</span>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
