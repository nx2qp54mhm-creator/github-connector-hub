import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { travelPerksSchema, TravelPerksBenefit } from "@/lib/schemas/benefit-schemas";
import { CurrencyField, StringArrayField } from "./FormFields";
import { Plus, X } from "lucide-react";

interface TravelPerksFormProps {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: TravelPerksBenefit) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function TravelPerksForm({ defaultValues, onSubmit, formRef }: TravelPerksFormProps) {
  const form = useForm<TravelPerksBenefit>({
    resolver: zodResolver(travelPerksSchema),
    defaultValues: defaultValues as TravelPerksBenefit,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "travelCredits",
  });

  const [newCreditAmount, setNewCreditAmount] = useState("");
  const [newCreditDescription, setNewCreditDescription] = useState("");

  const addTravelCredit = () => {
    if (newCreditAmount || newCreditDescription) {
      append({
        amount: newCreditAmount ? Number(newCreditAmount) : undefined,
        description: newCreditDescription || undefined,
      });
      setNewCreditAmount("");
      setNewCreditDescription("");
    }
  };

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CurrencyField
          form={form}
          name="annualFee"
          label="Annual Fee"
        />

        <StringArrayField
          form={form}
          name="loungeAccess"
          label="Lounge Access"
          placeholder="Add lounge program..."
        />

        <FormItem>
          <FormLabel>Travel Credits</FormLabel>
          <div className="space-y-2">
            {fields.length > 0 && (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                  >
                    <Badge variant="secondary" className="shrink-0">
                      ${form.watch(`travelCredits.${index}.amount`) || 0}
                    </Badge>
                    <span className="text-sm flex-1 truncate">
                      {form.watch(`travelCredits.${index}.description`) || "No description"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => remove(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative w-24 shrink-0">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  className="pl-6"
                  placeholder="0"
                  value={newCreditAmount}
                  onChange={(e) => setNewCreditAmount(e.target.value)}
                />
              </div>
              <Input
                className="flex-1"
                placeholder="Credit description..."
                value={newCreditDescription}
                onChange={(e) => setNewCreditDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTravelCredit();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addTravelCredit}
                disabled={!newCreditAmount && !newCreditDescription}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </FormItem>

        <StringArrayField
          form={form}
          name="otherPerks"
          label="Other Perks"
          placeholder="Add perk..."
        />
      </form>
    </Form>
  );
}
