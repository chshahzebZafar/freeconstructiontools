import Link from "next/link";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
  secondary:
    "bg-white text-zinc-900 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-12 px-6 text-base rounded-md",
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

interface ButtonProps
  extends BaseProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> {}

interface ButtonLinkProps extends BaseProps {
  href: string;
  external?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  href,
  external,
  children,
}: ButtonLinkProps) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
