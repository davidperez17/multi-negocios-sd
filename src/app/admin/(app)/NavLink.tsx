"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  exact,
  label,
  variant = "sidebar",
  children,
}: {
  href: string;
  exact: boolean;
  label: string;
  variant?: "sidebar" | "bottom";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  if (variant === "bottom") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors duration-150 ${
          active ? "text-primary font-semibold" : "text-muted"
        }`}
      >
        {children}
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-(--radius-control) px-3 py-2 text-sm whitespace-nowrap transition-colors duration-150 ${
        active
          ? "bg-primary-soft text-primary font-semibold"
          : "text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      {children}
      {label}
    </Link>
  );
}
