"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

const items = [
  { label: "Review", href: "/review", short: "Review" },
  { label: "Add Error", href: "/errors/new", short: "Add" },
  { label: "Rules", href: "/rules", short: "Rules" },
  { label: "Error Log", href: "/errors", short: "Errors" },
  { label: "Benchmarks", href: "/mock-tests", short: "Runs" },
  { label: "Analytics", href: "/analytics", short: "Stats" },
];

export function AppNavigation({ email }: { email: string }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/review" && pathname.startsWith(href));
  return <>
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card md:flex md:flex-col">
      <div className="border-b p-5"><p className="font-semibold text-primary">Signal Log</p><p className="mt-1 truncate text-xs text-muted-foreground">{email}</p></div>
      <nav className="grid gap-1 p-3">{items.map((item) => <Link className={cn("rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground", active(item.href) && "bg-secondary text-primary")} href={item.href} key={item.href}>{item.label}</Link>)}</nav>
      <div className="mt-auto border-t p-3"><SignOutButton /></div>
    </aside>
    <header className="sticky top-0 z-20 border-b bg-card/95 px-4 py-3 backdrop-blur md:hidden"><p className="font-semibold text-primary">Signal Log</p></header>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card md:hidden">{items.map((item) => <Link className={cn("flex h-16 items-center justify-center px-1 text-center text-[11px] font-medium text-muted-foreground", active(item.href) && "bg-secondary text-primary")} href={item.href} key={item.href}>{item.short}</Link>)}</nav>
  </>;
}
