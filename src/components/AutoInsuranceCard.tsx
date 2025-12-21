import { memo } from "react";
import { ChevronRight, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CategoryDefinition } from "@/types/coverage";
import { useAutoPolicy } from "@/hooks/useAutoPolicy";
import { cn } from "@/lib/utils";

interface AutoInsuranceCardProps {
  category: CategoryDefinition;
  onClick: () => void;
}

export const AutoInsuranceCard = memo(function AutoInsuranceCard({ category, onClick }: AutoInsuranceCardProps) {
  const { autoPolicy, loading } = useAutoPolicy();

  // Empty state - no policy
  if (!autoPolicy && !loading) {
    return (
      <Card
        onClick={onClick}
        className={cn(
          "p-4 cursor-pointer transition-all duration-200 group",
          "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
          "border border-border bg-card"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center flex-shrink-0 group-hover:bg-accent transition-colors">
              <CategoryIcon categoryId={category.id} className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-sm text-foreground">
                {category.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {category.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              0 sources
            </span>
            <StatusBadge status="none" />
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 group",
        "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
        "border border-border bg-card"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm text-foreground">
              {autoPolicy?.insurance_company || "Auto Insurance"}
            </h3>
            <p className="text-xs text-primary font-medium group-hover:underline">
              View details →
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status="covered" />
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>
  );
});
