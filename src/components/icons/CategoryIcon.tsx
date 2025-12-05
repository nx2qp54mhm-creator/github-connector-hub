import {
  Car,
  Shield,
  Luggage,
  Sparkles,
  ShoppingBag,
  Clock,
  Home,
  CarFront,
  LucideIcon
} from "lucide-react";
import { CategoryId } from "@/types/coverage";

interface CategoryIconProps {
  categoryId: CategoryId;
  className?: string;
}

const iconMap: Record<CategoryId, LucideIcon> = {
  "travel-rental": Car,
  "travel-trip": Shield,
  "travel-baggage": Luggage,
  "travel-perks": Sparkles,
  "purchase-protection": ShoppingBag,
  "purchase-warranty": Clock,
  "foundational-auto": CarFront,
  "foundational-home": Home,
};

export function CategoryIcon({ categoryId, className = "w-5 h-5" }: CategoryIconProps) {
  const Icon = iconMap[categoryId];

  if (!Icon) {
    return null;
  }

  return <Icon className={className} />;
}

export { iconMap };
