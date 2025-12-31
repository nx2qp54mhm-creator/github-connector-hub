import { useState } from "react";
import { UseFormReturn, FieldPath, FieldValues, PathValue } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface CurrencyFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
}

export function CurrencyField<T extends FieldValues>({
  form,
  name,
  label,
}: CurrencyFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                className="pl-7"
                placeholder="0"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? undefined : Number(e.target.value);
                  field.onChange(value);
                }}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface NumberFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  suffix?: string;
}

export function NumberField<T extends FieldValues>({
  form,
  name,
  label,
  suffix,
}: NumberFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                className={suffix ? "pr-16" : ""}
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? undefined : Number(e.target.value);
                  field.onChange(value);
                }}
              />
              {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {suffix}
                </span>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface TextField<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
}

export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
}: TextField<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface SelectFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField<T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder = "Select...",
}: SelectFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface StringArrayFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
}

export function StringArrayField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Add item...",
}: StringArrayFieldProps<T>) {
  const [newItem, setNewItem] = useState("");

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const items: string[] = field.value || [];

        const addItem = () => {
          if (newItem.trim()) {
            field.onChange([...items, newItem.trim()]);
            setNewItem("");
          }
        };

        const removeItem = (index: number) => {
          const updated = items.filter((_, i) => i !== index);
          field.onChange(updated.length > 0 ? updated : undefined);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addItem();
          }
        };

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="space-y-2">
              {items.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 flex items-center gap-1"
                    >
                      <span className="text-xs max-w-[200px] truncate">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="hover:bg-muted rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addItem}
                  disabled={!newItem.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
