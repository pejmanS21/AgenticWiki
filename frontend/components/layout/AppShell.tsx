"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Database, LayoutDashboard, Monitor, Moon, Network, Search, Settings, Sun, Upload } from "lucide-react";
import { applyThemeMode } from "@/components/layout/ThemeController";
import type { ThemeMode } from "@/lib/types";
import styles from "./AppShell.module.css";

const nav = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/upload", label: "Upload", Icon: Upload },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/graph", label: "Graph", Icon: Network },
  { href: "/settings", label: "Settings", Icon: Settings }
];

const themeOptions: Array<{ value: ThemeMode; label: string; Icon: typeof Sun }> = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "device", label: "Device", Icon: Monitor }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [themeMode, setThemeMode] = useState<ThemeMode>("device");

  useEffect(() => {
    const sync = () => {
      const stored = (localStorage.getItem("agentic-wiki-theme-mode") as ThemeMode | null) ?? "device";
      setThemeMode(stored);
      applyThemeMode(stored);
    };
    sync();
    window.addEventListener("theme-mode-changed", sync);
    return () => window.removeEventListener("theme-mode-changed", sync);
  }, []);

  function onThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    localStorage.setItem("agentic-wiki-theme-mode", mode);
    applyThemeMode(mode);
    window.dispatchEvent(new Event("theme-mode-changed"));
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}><Database size={19} strokeWidth={2.2} /></div>
          <div className={styles.brandTitle}>Knowledge Space</div>
          <div className={styles.brandSub}>Local-first RAG workspace</div>
        </div>
        <nav className={styles.nav}>
          {nav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              className={`${styles.link} ${pathname === href ? styles.active : ""}`}
              href={href}
            >
              <Icon className={styles.linkIcon} size={17} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <strong>Agentic document intelligence</strong>
          <div className={styles.headerTools}>
            <span className="muted">Private by default · SQLite · Chroma · Local files</span>
            <div className={styles.themeControl} aria-label="Theme">
              {themeOptions.map(({ value, label, Icon }) => (
                <button
                  aria-label={label}
                  className={`${styles.themeButton} ${themeMode === value ? styles.themeButtonActive : ""}`}
                  key={value}
                  onClick={() => onThemeChange(value)}
                  title={label}
                  type="button"
                >
                  <Icon size={15} strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
