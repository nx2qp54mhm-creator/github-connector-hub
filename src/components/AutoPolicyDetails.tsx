import { Check, X, Shield, Calendar, DollarSign, FileText } from "lucide-react";
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

function formatPremium(amount: number | null, frequency: string | null): string | null {
  if (!amount) return null;
  const formattedAmount = formatCurrency(amount);
  if (frequency) {
    return `${formattedAmount}/${frequency}`;
  }
  return formattedAmount;
}

interface CoverageRowProps {
  label: string;
  value: string | null;
  covered: boolean;
}

function CoverageRow({ label, value, covered }: CoverageRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
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

  // Liability
  if (policy.bodily_injury_per_person || policy.bodily_injury_per_accident || policy.property_damage_limit) {
    const bi1 = policy.bodily_injury_per_person ? policy.bodily_injury_per_person / 1000 : "—";
    const bi2 = policy.bodily_injury_per_accident ? policy.bodily_injury_per_accident / 1000 : "—";
    const pd = policy.property_damage_limit ? policy.property_damage_limit / 1000 : "—";
    coverageRows.push({ 
      label: "Liability (BI/PD)", 
      value: `${bi1}/${bi2}/${pd}K`, 
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

  // Uninsured motorist
  if (policy.uninsured_motorist_covered !== null) {
    let value = "Not covered";
    if (policy.uninsured_motorist_covered) {
      if (policy.uninsured_motorist_per_person && policy.uninsured_motorist_per_accident) {
        value = `${formatCurrency(policy.uninsured_motorist_per_person)}/${formatCurrency(policy.uninsured_motorist_per_accident)}`;
      } else {
        value = "Covered";
      }
    }
    coverageRows.push({ label: "Uninsured motorist", value, covered: policy.uninsured_motorist_covered });
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
          <div>
            <h4 className="font-semibold text-foreground">
              {policy.insurance_company || "Auto Insurance Policy"}
            </h4>
            {policy.policy_number && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Policy #{policy.policy_number}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {dateRange && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{dateRange}</span>
            </div>
          )}
          {premium && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>{premium}</span>
            </div>
          )}
        </div>
      </div>

      {/* Coverage Details */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Coverage Details</h4>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4">
            {coverageRows.length > 0 ? (
              coverageRows.map((row, i) => (
                <CoverageRow key={i} {...row} />
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
