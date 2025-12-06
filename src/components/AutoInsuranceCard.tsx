import { ChevronRight, Car, Check, X, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryDefinition } from "@/types/coverage";
import { useAutoPolicy, AutoPolicy } from "@/hooks/useAutoPolicy";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface AutoInsuranceCardProps {
  category: CategoryDefinition;
  onClick: () => void;
}

function CoverageItem({ label, covered, detail }: { label: string; covered: boolean | null; detail?: string }) {
  const isCovered = covered === true;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "flex items-center gap-1 font-medium",
        isCovered ? "text-primary" : "text-muted-foreground"
      )}>
        {isCovered ? (
          <>
            <Check className="w-3 h-3" />
            {detail || "Covered"}
          </>
        ) : (
          <>
            <X className="w-3 h-3" />
            Not covered
          </>
        )}
      </span>
    </div>
  );
}

function formatLiability(policy: AutoPolicy): string | null {
  const { bodily_injury_per_person, bodily_injury_per_accident, property_damage_limit } = policy;
  if (bodily_injury_per_person && bodily_injury_per_accident && property_damage_limit) {
    return `${bodily_injury_per_person / 1000}/${bodily_injury_per_accident / 1000}/${property_damage_limit / 1000}`;
  }
  return null;
}

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  if (!startDate || !endDate) return null;
  try {
    const start = format(parseISO(startDate), "MMM d, yyyy");
    const end = format(parseISO(endDate), "MMM d, yyyy");
    return `${start} - ${end}`;
  } catch {
    return null;
  }
}

export function AutoInsuranceCard({ category, onClick }: AutoInsuranceCardProps) {
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
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">
                {category.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
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

  const dateRange = formatDateRange(autoPolicy?.coverage_start_date ?? null, autoPolicy?.coverage_end_date ?? null);
  const liability = autoPolicy ? formatLiability(autoPolicy) : null;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 group",
        "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
        "border border-border bg-card"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-foreground truncate">
              {autoPolicy?.insurance_company || "Auto Insurance"}
            </h3>
            <div className="flex flex-col gap-0.5">
              {autoPolicy?.policy_number && (
                <p className="text-xs text-muted-foreground truncate">
                  Policy #{autoPolicy.policy_number}
                </p>
              )}
              {dateRange && (
                <p className="text-xs text-muted-foreground truncate">
                  {dateRange}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status="covered" />
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Coverage Summary */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <CoverageItem 
          label="Collision" 
          covered={autoPolicy?.collision_covered ?? null}
          detail={autoPolicy?.collision_deductible ? `$${autoPolicy.collision_deductible} deductible` : undefined}
        />
        <CoverageItem 
          label="Comprehensive" 
          covered={autoPolicy?.comprehensive_covered ?? null}
          detail={autoPolicy?.comprehensive_deductible ? `$${autoPolicy.comprehensive_deductible} deductible` : undefined}
        />
        {liability && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Liability</span>
            <span className="font-medium text-primary">{liability}K</span>
          </div>
        )}
        <CoverageItem 
          label="Rental reimbursement" 
          covered={autoPolicy?.rental_reimbursement_covered ?? null}
        />
        <CoverageItem 
          label="Roadside assistance" 
          covered={autoPolicy?.roadside_assistance_covered ?? null}
        />
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-border">
        <span className="text-xs text-primary font-medium group-hover:underline">
          View details →
        </span>
      </div>
    </Card>
  );
}
