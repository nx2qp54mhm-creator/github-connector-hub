import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AutoPolicy } from "@/hooks/useAutoPolicy";
import {
  autoPolicyFormSchema,
  AutoPolicyFormData,
  premiumFrequencyOptions,
} from "@/lib/schemas/auto-policy-schema";
import {
  TextField,
  CurrencyField,
  SelectField,
  SwitchField,
  DateField,
} from "@/components/admin/benefit-forms/FormFields";

interface AutoPolicyEditFormProps {
  policy: AutoPolicy;
  onSave: (data: AutoPolicyFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function AutoPolicyEditForm({
  policy,
  onSave,
  onCancel,
  isSaving,
}: AutoPolicyEditFormProps) {
  // Memoize defaultValues to prevent form reset on parent re-renders
  const defaultValues = useMemo(
    () => ({
      insurance_company: policy.insurance_company ?? null,
      policy_number: policy.policy_number ?? null,
      coverage_start_date: policy.coverage_start_date ?? null,
      coverage_end_date: policy.coverage_end_date ?? null,
      collision_covered: policy.collision_covered ?? null,
      collision_deductible: policy.collision_deductible ?? null,
      comprehensive_covered: policy.comprehensive_covered ?? null,
      comprehensive_deductible: policy.comprehensive_deductible ?? null,
      bodily_injury_per_person: policy.bodily_injury_per_person ?? null,
      bodily_injury_per_accident: policy.bodily_injury_per_accident ?? null,
      property_damage_limit: policy.property_damage_limit ?? null,
      medical_payments_covered: policy.medical_payments_covered ?? null,
      medical_payments_limit: policy.medical_payments_limit ?? null,
      uninsured_motorist_covered: policy.uninsured_motorist_covered ?? null,
      uninsured_motorist_per_person: policy.uninsured_motorist_per_person ?? null,
      uninsured_motorist_per_accident: policy.uninsured_motorist_per_accident ?? null,
      rental_reimbursement_covered: policy.rental_reimbursement_covered ?? null,
      rental_reimbursement_daily: policy.rental_reimbursement_daily ?? null,
      rental_reimbursement_max: policy.rental_reimbursement_max ?? null,
      roadside_assistance_covered: policy.roadside_assistance_covered ?? null,
      premium_amount: policy.premium_amount ?? null,
      premium_frequency: policy.premium_frequency ?? null,
    }),
    // Only recalculate if policy.id changes (new policy), not on every prop change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [policy.id]
  );

  const form = useForm<AutoPolicyFormData>({
    resolver: zodResolver(autoPolicyFormSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Policy Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Policy Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              form={form}
              name="insurance_company"
              label="Insurance Company"
              placeholder="e.g., State Farm"
            />
            <TextField
              form={form}
              name="policy_number"
              label="Policy Number"
              placeholder="e.g., POL-123456"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateField form={form} name="coverage_start_date" label="Coverage Start" />
            <DateField form={form} name="coverage_end_date" label="Coverage End" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CurrencyField form={form} name="premium_amount" label="Premium Amount" />
            <SelectField
              form={form}
              name="premium_frequency"
              label="Premium Frequency"
              options={premiumFrequencyOptions}
              placeholder="Select frequency"
            />
          </div>
        </div>

        {/* Collision & Comprehensive */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Collision & Comprehensive</h4>
          <div className="space-y-3">
            <SwitchField form={form} name="collision_covered" label="Collision Coverage" />
            <CurrencyField form={form} name="collision_deductible" label="Collision Deductible" />
          </div>
          <div className="space-y-3">
            <SwitchField form={form} name="comprehensive_covered" label="Comprehensive Coverage" />
            <CurrencyField
              form={form}
              name="comprehensive_deductible"
              label="Comprehensive Deductible"
            />
          </div>
        </div>

        {/* Liability */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Liability Coverage</h4>
          <CurrencyField
            form={form}
            name="bodily_injury_per_person"
            label="Bodily Injury (per person)"
          />
          <CurrencyField
            form={form}
            name="bodily_injury_per_accident"
            label="Bodily Injury (per accident)"
          />
          <CurrencyField
            form={form}
            name="property_damage_limit"
            label="Property Damage Limit"
          />
        </div>

        {/* Medical Payments */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Medical Payments</h4>
          <SwitchField form={form} name="medical_payments_covered" label="Medical Payments Coverage" />
          <CurrencyField form={form} name="medical_payments_limit" label="Medical Payments Limit" />
        </div>

        {/* Uninsured Motorist */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Uninsured Motorist</h4>
          <SwitchField
            form={form}
            name="uninsured_motorist_covered"
            label="Uninsured Motorist Coverage"
          />
          <CurrencyField
            form={form}
            name="uninsured_motorist_per_person"
            label="Uninsured Motorist (per person)"
          />
          <CurrencyField
            form={form}
            name="uninsured_motorist_per_accident"
            label="Uninsured Motorist (per accident)"
          />
        </div>

        {/* Rental Reimbursement */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Rental Reimbursement</h4>
          <SwitchField
            form={form}
            name="rental_reimbursement_covered"
            label="Rental Reimbursement Coverage"
          />
          <div className="grid grid-cols-2 gap-4">
            <CurrencyField
              form={form}
              name="rental_reimbursement_daily"
              label="Daily Limit"
            />
            <CurrencyField
              form={form}
              name="rental_reimbursement_max"
              label="Maximum Limit"
            />
          </div>
        </div>

        {/* Roadside Assistance */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Roadside Assistance</h4>
          <SwitchField
            form={form}
            name="roadside_assistance_covered"
            label="Roadside Assistance"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
