import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CategoryDefinition } from "@/types/coverage";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { cn } from "@/lib/utils";
interface CategoryCardProps {
  category: CategoryDefinition;
  onClick: () => void;
}
export function CategoryCard({
  category,
  onClick
}: CategoryCardProps) {
  const getCoverageStatus = useCoverageStore(state => state.getCoverageStatus);
  const getSourcesForCategory = useCoverageStore(state => state.getSourcesForCategory);
  const status = getCoverageStatus(category.id);
  const {
    cards,
    policies,
    plans
  } = getSourcesForCategory(category.id);
  const sourceCount = cards.length + policies.length + plans.length;
  return <Card onClick={onClick} className={cn("p-4 cursor-pointer transition-all duration-200 group", "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5", "border border-border bg-card")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center flex-shrink-0 group-hover:bg-accent transition-colors">
            <CategoryIcon categoryId={category.id} className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-foreground truncate">{category.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{category.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {sourceCount} source{sourceCount !== 1 ? "s" : ""}
          </span>
          
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>;
}