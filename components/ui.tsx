import * as React from "react";
import { cn } from "@/lib/cn";

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-fg text-bg hover:bg-black/85 border border-transparent disabled:bg-black/30",
  secondary:
    "bg-bg text-fg border border-line hover:bg-surface disabled:text-subtle",
  ghost:
    "bg-transparent text-muted border border-transparent hover:bg-surface hover:text-fg",
  danger:
    "bg-bg text-danger border border-line hover:border-danger/40 hover:bg-danger/5",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-md gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Surface ---------- */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-line bg-bg", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[13px] font-medium tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[12px] text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* ---------- Stat ---------- */

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-line bg-bg p-4", className)}>
      <p className="text-2xs font-medium uppercase tracking-[0.06em] text-subtle">
        {label}
      </p>
      <p className="tnum mt-2 text-[26px] font-semibold leading-none tracking-tight">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}

/* ---------- Badge ---------- */

type BadgeTone = "neutral" | "accent" | "success" | "warn" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Form controls ---------- */

const controlBase =
  "w-full rounded-md border border-line bg-bg px-3 text-fg placeholder:text-subtle " +
  "transition-colors hover:border-line-strong focus:border-fg focus:outline-none";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(controlBase, "h-10 text-[15px] sm:text-sm", className)}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(controlBase, "min-h-[72px] py-2 text-[15px] sm:text-sm", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(controlBase, "h-10 appearance-none text-[15px] sm:text-sm", className)}
      {...props}
    />
  );
});

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[12px] font-medium text-muted"
      >
        {label}
        {required ? <span className="text-danger">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-subtle">{hint}</p> : null}
    </div>
  );
}

/* ---------- Misc ---------- */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-[13px] text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}
