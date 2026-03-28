"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

const NAV_ITEMS = [
  { href: "/" as Route, label: "허브" },
  { href: "/labs/grid" as Route, label: "Grid Lab" },
  { href: "/labs/employee-batch" as Route, label: "Employee Batch" },
  { href: "/labs/bench" as Route, label: "Bench" },
  { href: "/labs/compatibility" as Route, label: "Compatibility" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "app-nav__link app-nav__link--active" : "app-nav__link"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
