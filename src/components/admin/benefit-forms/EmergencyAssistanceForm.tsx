import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { emergencyAssistanceSchema, EmergencyAssistanceBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, StringArrayField } from "./FormFields";

interface EmergencyAssistanceFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: EmergencyAssistanceBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function EmergencyAssistanceForm({ defaultValues, onSubmit, formRef }: EmergencyAssistanceFormProps) {
  const form = useForm<EmergencyAssistanceBenefit>({
    resolver: zodResolver(emergencyAssistanceSchema),
    defaultValues: defaultValues as EmergencyAssistanceBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencyField
            form={form}
            name="evacuationCoverage"
            label="Evacuation Coverage"
          />
          <CurrencyField
            form={form}
            name="medicalCoverage"
            label="Medical Coverage"
          />
        </div>

        <StringArrayField
          form={form}
          name="services"
          label="Services"
          placeholder="Add service..."
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
