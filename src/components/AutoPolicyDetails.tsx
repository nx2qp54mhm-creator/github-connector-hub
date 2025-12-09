import { Check, X, Shield, Calendar, FileText } from "lucide-react";
import { AutoPolicy } from "@/hooks/useAutoPolicy";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface AutoPolicyDetailsProps {
  policy: AutoPolicy;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

function formatFrequency(frequency: string | null): string {
  if (!frequency) return "";
  switch (frequency.toLowerCase()) {
    case "six_month":
    case "6_month":
    case "semi_annual":
      return " / 6 months";
    case "monthly":
      return " / month";
    case "annual":
    case "yearly":
      return " / year";
    case "quarterly":
      return " / quarter";
    default:
      return ` / ${frequency}`;
  }
}

function formatPremium(amount: number | null, frequency: string | null): string | null {
  if (!amount) return null;
  const formattedAmount = formatCurrency(amount);
  return `${formattedAmount}${formatFrequency(frequency)}`;
}

interface CoverageRowProps {
  label: string;
  value: string | null;
  covered: boolean;
}

function CoverageRow({ label, value, covered }: CoverageRowProps) {
  return (
    <div className="py-2 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn(
          "flex items-center gap-1.5 text-sm font-medium",
          covered ? "text-primary" : "text-muted-foreground"
        )}>
          {covered ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {value}
        </span>
      </div>
    </div>
  );
}

export function AutoPolicyDetails({ policy }: AutoPolicyDetailsProps) {
  const dateRange = formatDateRange(policy.coverage_start_date, policy.coverage_end_date);
  const premium = formatPremium(
    policy.premium_amount ? Number(policy.premium_amount) : null,
    policy.premium_frequency
  );

  // Build coverage rows
  const coverageRows: { label: string; value: string; covered: boolean }[] = [];

  // Collision
  if (policy.collision_covered !== null) {
    let value = "Not covered";
    if (policy.collision_covered) {
      value = policy.collision_deductible 
        ? `${formatCurrency(policy.collision_deductible)} deductible`
        : "Covered";
    }
    coverageRows.push({ label: "Collision", value, covered: policy.collision_covered });
  }

  // Comprehensive
  if (policy.comprehensive_covered !== null) {
    let value = "Not covered";
    if (policy.comprehensive_covered) {
      value = policy.comprehensive_deductible 
        ? `${formatCurrency(policy.comprehensive_deductible)} deductible`
        : "Covered";
    }
    coverageRows.push({ label: "Comprehensive", value, covered: policy.comprehensive_covered });
  }

  // Liability - Split into 3 separate rows
  if (policy.bodily_injury_per_person) {
    coverageRows.push({ 
      label: "Bodily injury (per person)", 
      value: formatCurrency(policy.bodily_injury_per_person), 
      covered: true 
    });
  }
  if (policy.bodily_injury_per_accident) {
    coverageRows.push({ 
      label: "Bodily injury (per accident)", 
      value: formatCurrency(policy.bodily_injury_per_accident), 
      covered: true 
    });
  }
  if (policy.property_damage_limit) {
    coverageRows.push({ 
      label: "Property damage", 
      value: formatCurrency(policy.property_damage_limit), 
      covered: true 
    });
  }

  // Medical payments
  if (policy.medical_payments_covered !== null) {
    let value = "Not covered";
    if (policy.medical_payments_covered) {
      value = policy.medical_payments_limit 
        ? `${formatCurrency(policy.medical_payments_limit)} limit`
        : "Covered";
    }
    coverageRows.push({ label: "Medical payments", value, covered: policy.medical_payments_covered });
  }

  // Uninsured motorist - Split into 2 separate rows
  if (policy.uninsured_motorist_covered) {
    if (policy.uninsured_motorist_per_person) {
      coverageRows.push({ 
        label: "Uninsured motorist (per person)", 
        value: formatCurrency(policy.uninsured_motorist_per_person), 
        covered: true 
      });
    }
    if (policy.uninsured_motorist_per_accident) {
      coverageRows.push({ 
        label: "Uninsured motorist (per accident)", 
        value: formatCurrency(policy.uninsured_motorist_per_accident), 
        covered: true 
      });
    }
  } else if (policy.uninsured_motorist_covered === false) {
    coverageRows.push({ 
      label: "Uninsured motorist", 
      value: "Not covered", 
      covered: false 
    });
  }

  // Rental reimbursement
  if (policy.rental_reimbursement_covered !== null) {
    let value = "Not included";
    if (policy.rental_reimbursement_covered) {
      if (policy.rental_reimbursement_daily && policy.rental_reimbursement_max) {
        value = `${formatCurrency(policy.rental_reimbursement_daily)}/day, ${formatCurrency(policy.rental_reimbursement_max)} max`;
      } else if (policy.rental_reimbursement_daily) {
        value = `${formatCurrency(policy.rental_reimbursement_daily)}/day`;
      } else {
        value = "Included";
      }
    }
    coverageRows.push({ label: "Rental reimbursement", value, covered: policy.rental_reimbursement_covered });
  }

  // Roadside assistance
  if (policy.roadside_assistance_covered !== null) {
    coverageRows.push({ 
      label: "Roadside assistance", 
      value: policy.roadside_assistance_covered ? "Included" : "Not included", 
      covered: policy.roadside_assistance_covered 
    });
  }

  return (
    <div className="space-y-6">
      {/* Policy Header Info */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">
              {policy.insurance_company || "Auto Insurance Policy"}
            </h4>
            {(policy.policy_number || premium) && (
              <div className="flex items-center justify-between gap-2">
                {policy.policy_number && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Policy #{policy.policy_number}
                  </p>
                )}
                {premium && (
                  <span className="text-lg font-bold text-foreground">
                    {premium}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {dateRange && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground pl-[52px]">
            <Calendar className="w-4 h-4" />
            <span>{dateRange}</span>
          </div>
        )}
      </div>

      {/* Coverage Details */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Coverage Details</h4>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4">
            {coverageRows.length > 0 ? (
              coverageRows.map((row, i) => (
                <CoverageRow key={i} label={row.label} value={row.value} covered={row.covered} />
              ))
            ) : (
              <p className="py-4 text-sm text-muted-foreground text-center">
                No coverage details available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
