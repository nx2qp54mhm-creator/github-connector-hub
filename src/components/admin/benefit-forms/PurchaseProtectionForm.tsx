import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { purchaseProtectionSchema, PurchaseProtectionBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, NumberField, StringArrayField } from "./FormFields";

interface PurchaseProtectionFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: PurchaseProtectionBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function PurchaseProtectionForm({ defaultValues, onSubmit, formRef }: PurchaseProtectionFormProps) {
  const form = useForm<PurchaseProtectionBenefit>({
    resolver: zodResolver(purchaseProtectionSchema),
    defaultValues: defaultValues as PurchaseProtectionBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencyField
            form={form}
            name="maxPerClaim"
            label="Max Per Claim"
          />
          <CurrencyField
            form={form}
            name="maxPerYear"
            label="Max Per Year"
          />
        </div>

        <NumberField
          form={form}
          name="coveragePeriodDays"
          label="Coverage Period"
          suffix="days"
        />

        <StringArrayField
          form={form}
          name="whatsCovered"
          label="What's Covered"
          placeholder="Add covered item..."
        />

        <StringArrayField
          form={form}
          name="whatsNotCovered"
          label="What's Not Covered"
          placeholder="Add exclusion..."
        />
      </form>
    </Form>
  );
}
