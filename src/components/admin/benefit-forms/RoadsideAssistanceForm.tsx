import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { roadsideAssistanceSchema, RoadsideAssistanceBenefit } from "@/lib/schemas/benefit-schemas";
import { NumberField, TextField, StringArrayField } from "./FormFields";

interface RoadsideAssistanceFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: RoadsideAssistanceBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function RoadsideAssistanceForm({ defaultValues, onSubmit, formRef }: RoadsideAssistanceFormProps) {
  const form = useForm<RoadsideAssistanceBenefit>({
    resolver: zodResolver(roadsideAssistanceSchema),
    defaultValues: defaultValues as RoadsideAssistanceBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            form={form}
            name="provider"
            label="Provider"
            placeholder="e.g., Allstate Motor Club"
          />
          <NumberField
            form={form}
            name="towingMiles"
            label="Towing Distance"
            suffix="miles"
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
          name="limitations"
          label="Limitations"
          placeholder="Add limitation..."
        />
      </form>
    </Form>
  );
}
