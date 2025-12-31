import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { rentalSchema, RentalBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, NumberField, SelectField, StringArrayField } from "./FormFields";

interface RentalBenefitFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: RentalBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function RentalBenefitForm({ defaultValues, onSubmit, formRef }: RentalBenefitFormProps) {
  const form = useForm<RentalBenefit>({
    resolver: zodResolver(rentalSchema),
    defaultValues: defaultValues as RentalBenefit,
  });

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            form={form}
            name="coverageType"
            label="Coverage Type"
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ]}
            placeholder="Select type..."
          />
          <CurrencyField
            form={form}
            name="maxCoverage"
            label="Maximum Coverage"
          />
        </div>

        <NumberField
          form={form}
          name="maxRentalDays"
          label="Maximum Rental Days"
          suffix="days"
        />

        <StringArrayField
          form={form}
          name="whatsCovered"
          label="What's Covered"
          placeholder="Add coverage item..."
        />

        <StringArrayField
          form={form}
          name="whatsNotCovered"
          label="What's Not Covered"
          placeholder="Add exclusion..."
        />

        <StringArrayField
          form={form}
          name="vehicleExclusions"
          label="Vehicle Exclusions"
          placeholder="Add vehicle type..."
        />

        <StringArrayField
          form={form}
          name="countryExclusions"
          label="Country Exclusions"
          placeholder="Add country..."
        />
      </form>
    </Form>
  );
}
