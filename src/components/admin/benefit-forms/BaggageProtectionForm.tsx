import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { baggageProtectionSchema, BaggageProtectionBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, NumberField, StringArrayField } from "./FormFields";

interface BaggageProtectionFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: BaggageProtectionBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function BaggageProtectionForm({ defaultValues, onSubmit, formRef }: BaggageProtectionFormProps) {
  const form = useForm<BaggageProtectionBenefit>({
    resolver: zodResolver(baggageProtectionSchema),
    defaultValues: defaultValues as BaggageProtectionBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencyField
            form={form}
            name="delayCoverage"
            label="Delay Coverage"
          />
          <NumberField
            form={form}
            name="delayThresholdHours"
            label="Delay Threshold"
            suffix="hours"
          />
        </div>

        <CurrencyField
          form={form}
          name="lostBaggageCoverage"
          label="Lost Baggage Coverage"
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
