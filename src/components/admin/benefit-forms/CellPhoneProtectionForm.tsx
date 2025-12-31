import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { cellPhoneProtectionSchema, CellPhoneProtectionBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, NumberField, StringArrayField } from "./FormFields";

interface CellPhoneProtectionFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: CellPhoneProtectionBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function CellPhoneProtectionForm({ defaultValues, onSubmit, formRef }: CellPhoneProtectionFormProps) {
  const form = useForm<CellPhoneProtectionBenefit>({
    resolver: zodResolver(cellPhoneProtectionSchema),
    defaultValues: defaultValues as CellPhoneProtectionBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <CurrencyField
            form={form}
            name="maxPerClaim"
            label="Max Per Claim"
          />
          <NumberField
            form={form}
            name="maxClaimsPerYear"
            label="Max Claims/Year"
          />
          <CurrencyField
            form={form}
            name="deductible"
            label="Deductible"
          />
        </div>

        <StringArrayField
          form={form}
          name="coverageDetails"
          label="Coverage Details"
          placeholder="Add detail..."
        />

        <StringArrayField
          form={form}
          name="requirements"
          label="Requirements"
          placeholder="Add requirement..."
        />

        <StringArrayField
          form={form}
          name="exclusions"
          label="Exclusions"
          placeholder="Add exclusion..."
        />
      </form>
    </Form>
  );
}
