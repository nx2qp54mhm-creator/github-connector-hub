import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { tripProtectionSchema, TripProtectionBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, NumberField, StringArrayField } from "./FormFields";

interface TripProtectionFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: TripProtectionBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function TripProtectionForm({ defaultValues, onSubmit, formRef }: TripProtectionFormProps) {
  const form = useForm<TripProtectionBenefit>({
    resolver: zodResolver(tripProtectionSchema),
    defaultValues: defaultValues as TripProtectionBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencyField
            form={form}
            name="cancellationCoverage"
            label="Cancellation Coverage"
          />
          <CurrencyField
            form={form}
            name="interruptionCoverage"
            label="Interruption Coverage"
          />
        </div>

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

        <StringArrayField
          form={form}
          name="coveredReasons"
          label="Covered Reasons"
          placeholder="Add covered reason..."
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
