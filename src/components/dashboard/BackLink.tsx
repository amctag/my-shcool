import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={
        className ??
        "inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
      }
    >
      <ArrowLeft aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span>{children}</span>
    </Link>
  );
}
