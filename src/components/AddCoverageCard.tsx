import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AddCoverageCardProps {
  onClick: () => void;
}

export function AddCoverageCard({ onClick }: AddCoverageCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 group",
        "border border-dashed border-primary/40 bg-secondary/50",
        "hover:shadow-primary-glow hover:border-primary hover:bg-secondary",
        "flex items-center justify-center gap-3"
      )}
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
        <Plus className="w-5 h-5 text-primary" strokeWidth={2.5} />
      </div>
      <span className="font-semibold text-sm text-secondary-foreground group-hover:text-primary transition-colors">
        Add Your Cards, Insurance Policies, and More
      </span>
    </Card>
  );
}
