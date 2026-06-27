import { cloneElement, type ButtonHTMLAttributes, type ReactElement } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactElement<{ className?: string }>;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md";
};

const sizes = {
  sm: "h-[38px] w-[38px]",
  md: "h-[38px] w-[38px]",
} as const;

export function IconButton({ icon, label, variant = "outline", size = "md", className, ...props }: IconButtonProps) {
  const normalizedIcon = cloneElement(icon, {
    className: cn("h-[18px] w-[18px] shrink-0", icon.props.className),
  });

  return (
    <Button
      type="button"
      variant={variant}
      aria-label={label}
      title={label}
      className={cn("shrink-0 p-0 [&>svg]:h-[18px] [&>svg]:w-[18px]", sizes[size], className)}
      {...props}
    >
      {normalizedIcon}
    </Button>
  );
}
