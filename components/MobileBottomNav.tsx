"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, MessageSquare, User } from "lucide-react";

export default function MobileBottomNav({
  username,
  unreadCount,
}: {
  username: string;
  unreadCount: number;
}) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Feed", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/projects/new", label: "Add", icon: PlusSquare },
    { href: "/messages", label: "Messages", icon: MessageSquare, badge: unreadCount },
    { href: `/${username}`, label: "Profile", icon: User },
  ];

  return (
    <nav
      aria-label="Primary"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active =
            href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-[10px] font-semibold transition-colors ${
                active ? "text-accent" : "text-text-dim hover:text-navy"
              }`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                {badge ? (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 pointer-events-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
