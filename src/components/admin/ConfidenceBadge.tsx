import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceBadge({ score, showLabel = true, size = "md" }: ConfidenceBadgeProps) {
  const percentage = Math.round(score * 100);

  const getColor = () => {
    if (score >= 0.8) return "bg-success/10 text-success border-success/30";
    if (score >= 0.6) return "bg-warning/10 text-warning border-warning/30";
    return "bg-destructive/10 text-destructive border-destructive/30";
  };

  const getLabel = () => {
    if (score >= 0.8) return "High";
    if (score >= 0.6) return "Medium";
    return "Low";
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        getColor(),
        sizeClasses[size]
      )}
    >
      {percentage}%
      {showLabel && <span className="opacity-75">({getLabel()})</span>}
    </span>
  );
}
