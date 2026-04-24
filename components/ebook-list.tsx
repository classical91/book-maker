"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type EbookItem = {
  id: string;
  title: string;
  updatedAt: Date;
};

export function EbookList({ ebooks }: { ebooks: EbookItem[] }) {
  const pathname = usePathname();

  if (ebooks.length === 0) {
    return (
      <p className="px-5 py-8 text-sm text-[var(--muted)]">
        No e-books yet. Hit <strong>+ New</strong> to start one.
      </p>
    );
  }

  return (
    <div className="divide-y divide-[var(--line)]">
      {ebooks.map((ebook) => {
        const href = `/ebooks/${ebook.id}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={ebook.id}
            href={href}
            className={cn(
              "block px-5 py-4 transition",
              active
                ? "bg-[rgba(33,23,17,0.06)] border-l-2 border-[var(--accent)]"
                : "hover:bg-[rgba(255,255,255,0.6)]",
            )}
          >
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {ebook.title}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {new Date(ebook.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
