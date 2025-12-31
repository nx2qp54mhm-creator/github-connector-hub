import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { returnProtectionSchema, ReturnProtectionBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, NumberField, StringArrayField } from "./FormFields";

interface ReturnProtectionFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: ReturnProtectionBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function ReturnProtectionForm({ defaultValues, onSubmit, formRef }: ReturnProtectionFormProps) {
  const form = useForm<ReturnProtectionBenefit>({
    resolver: zodResolver(returnProtectionSchema),
    defaultValues: defaultValues as ReturnProtectionBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencyField
            form={form}
            name="maxPerItem"
            label="Max Per Item"
          />
          <CurrencyField
            form={form}
            name="maxPerYear"
            label="Max Per Year"
          />
        </div>

        <NumberField
          form={form}
          name="returnWindowDays"
          label="Return Window"
          suffix="days"
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
