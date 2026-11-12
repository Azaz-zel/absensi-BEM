import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ORG_NAME, SITE_NAME } from "@/lib/env";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-bem.png"
      alt=""
      width={32}
      height={32}
      priority
      className={cn("h-8 w-8 shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}

export function Brand({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5", className)}
      aria-label={SITE_NAME}
    >
      <LogoMark />
      {compact ? null : (
        <span className="min-w-0 leading-tight">
          <span className="block text-[13px] font-semibold tracking-tight">
            {SITE_NAME}
          </span>
          <span className="block truncate text-[11px] text-subtle">
            {ORG_NAME}
          </span>
        </span>
      )}
    </Link>
  );
}
