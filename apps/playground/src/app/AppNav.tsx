"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

const NAV_ITEMS = [
  { href: "/" as Route, label: "허브" },
  { href: "/labs/grid" as Route, label: "Grid Lab" },
  { href: "/labs/bench" as Route, label: "Bench" },
  { href: "/labs/compatibility" as Route, label: "Compatibility" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              borderRadius: 999,
              padding: "10px 14px",
              border: active ? "1px solid #0f766e" : "1px solid #d9e4f1",
              background: active ? "#0f766e" : "#fff",
              color: active ? "#fff" : "#0f172a",
              fontWeight: 700,
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
