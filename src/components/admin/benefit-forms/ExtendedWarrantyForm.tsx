import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { extendedWarrantySchema, ExtendedWarrantyBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, NumberField, StringArrayField } from "./FormFields";

interface ExtendedWarrantyFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: ExtendedWarrantyBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function ExtendedWarrantyForm({ defaultValues, onSubmit, formRef }: ExtendedWarrantyFormProps) {
  const form = useForm<ExtendedWarrantyBenefit>({
    resolver: zodResolver(extendedWarrantySchema),
    defaultValues: defaultValues as ExtendedWarrantyBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            form={form}
            name="extensionYears"
            label="Extension Years"
            suffix="years"
          />
          <NumberField
            form={form}
            name="maxOriginalWarrantyYears"
            label="Max Original Warranty"
            suffix="years"
          />
        </div>

        <CurrencyField
          form={form}
          name="maxPerClaim"
          label="Max Per Claim"
        />

        <StringArrayField
          form={form}
          name="coverageDetails"
          label="Coverage Details"
          placeholder="Add detail..."
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
