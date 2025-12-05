import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "covered" | "partial" | "none";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    covered: {
      bg: "bg-success-light",
      text: "text-success-foreground",
      label: "Covered",
    },
    partial: {
      bg: "bg-warning-light",
      text: "text-warning-foreground",
      label: "Partial",
    },
    none: {
      bg: "bg-danger-light",
      text: "text-danger-foreground",
      label: "Add coverage",
    },
  };

  const { bg, text, label } = config[status];

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
        bg,
        text,
        className
      )}
    >
      {label}
    </span>
  );
}
