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
  indented?: boolean;
}

function CoverageRow({ label, value, covered, indented }: CoverageRowProps) {
  return (
    <div className="py-2 border-b border-border last:border-b-0">
      <div className={cn("flex items-center justify-between", indented && "pl-4")}>
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

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="pt-3 pb-2 border-b border-border">
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}

export function AutoPolicyDetails({ policy }: AutoPolicyDetailsProps) {
  const dateRange = formatDateRange(policy.coverage_start_date, policy.coverage_end_date);
  const premium = formatPremium(
    policy.premium_amount ? Number(policy.premium_amount) : null,
    policy.premium_frequency
  );

  // Check if we have liability data
  const hasLiability = policy.bodily_injury_per_person || policy.bodily_injury_per_accident || policy.property_damage_limit;
  
  // Check if we have uninsured motorist data
  const hasUninsuredMotorist = policy.uninsured_motorist_covered && 
    (policy.uninsured_motorist_per_person || policy.uninsured_motorist_per_accident);

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
            {/* Collision */}
            {policy.collision_covered !== null && (
              <CoverageRow 
                label="Collision" 
                value={policy.collision_covered 
                  ? (policy.collision_deductible ? `${formatCurrency(policy.collision_deductible)} deductible` : "Covered")
                  : "Not covered"
                } 
                covered={policy.collision_covered} 
              />
            )}

            {/* Comprehensive */}
            {policy.comprehensive_covered !== null && (
              <CoverageRow 
                label="Comprehensive" 
                value={policy.comprehensive_covered 
                  ? (policy.comprehensive_deductible ? `${formatCurrency(policy.comprehensive_deductible)} deductible` : "Covered")
                  : "Not covered"
                } 
                covered={policy.comprehensive_covered} 
              />
            )}

            {/* Liability Section */}
            {hasLiability && (
              <>
                <SectionHeader label="Liability" />
                {policy.bodily_injury_per_person && (
                  <CoverageRow 
                    label="Bodily injury (per person)" 
                    value={formatCurrency(policy.bodily_injury_per_person)} 
                    covered={true}
                    indented
                  />
                )}
                {policy.bodily_injury_per_accident && (
                  <CoverageRow 
                    label="Bodily injury (per accident)" 
                    value={formatCurrency(policy.bodily_injury_per_accident)} 
                    covered={true}
                    indented
                  />
                )}
                {policy.property_damage_limit && (
                  <CoverageRow 
                    label="Property damage" 
                    value={formatCurrency(policy.property_damage_limit)} 
                    covered={true}
                    indented
                  />
                )}
              </>
            )}

            {/* Uninsured Motorist Section */}
            {hasUninsuredMotorist && (
              <>
                <SectionHeader label="Uninsured Motorist" />
                {policy.uninsured_motorist_per_person && (
                  <CoverageRow 
                    label="Per person" 
                    value={formatCurrency(policy.uninsured_motorist_per_person)} 
                    covered={true}
                    indented
                  />
                )}
                {policy.uninsured_motorist_per_accident && (
                  <CoverageRow 
                    label="Per accident" 
                    value={formatCurrency(policy.uninsured_motorist_per_accident)} 
                    covered={true}
                    indented
                  />
                )}
              </>
            )}
            {policy.uninsured_motorist_covered === false && (
              <CoverageRow 
                label="Uninsured motorist" 
                value="Not covered" 
                covered={false}
              />
            )}

            {/* Medical payments */}
            {policy.medical_payments_covered !== null && (
              <CoverageRow 
                label="Medical payments" 
                value={policy.medical_payments_covered 
                  ? (policy.medical_payments_limit ? `${formatCurrency(policy.medical_payments_limit)} limit` : "Covered")
                  : "Not covered"
                } 
                covered={policy.medical_payments_covered} 
              />
            )}

            {/* Rental reimbursement */}
            {policy.rental_reimbursement_covered !== null && (
              <CoverageRow 
                label="Rental reimbursement" 
                value={policy.rental_reimbursement_covered 
                  ? (policy.rental_reimbursement_daily && policy.rental_reimbursement_max 
                    ? `${formatCurrency(policy.rental_reimbursement_daily)}/day, ${formatCurrency(policy.rental_reimbursement_max)} max`
                    : policy.rental_reimbursement_daily 
                      ? `${formatCurrency(policy.rental_reimbursement_daily)}/day`
                      : "Included")
                  : "Not included"
                } 
                covered={policy.rental_reimbursement_covered} 
              />
            )}

            {/* Roadside assistance */}
            {policy.roadside_assistance_covered !== null && (
              <CoverageRow 
                label="Roadside assistance" 
                value={policy.roadside_assistance_covered ? "Included" : "Not included"} 
                covered={policy.roadside_assistance_covered} 
              />
            )}

            {/* Empty state */}
            {policy.collision_covered === null && 
             policy.comprehensive_covered === null && 
             !hasLiability && 
             !hasUninsuredMotorist &&
             policy.medical_payments_covered === null &&
             policy.rental_reimbursement_covered === null &&
             policy.roadside_assistance_covered === null && (
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
