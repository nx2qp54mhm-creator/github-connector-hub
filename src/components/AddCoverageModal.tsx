import { useState, useRef } from "react";
import { Check, Upload, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cardDatabase, commonPlans } from "@/data/cardDatabase";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { cn } from "@/lib/utils";

interface AddCoverageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

export function AddCoverageModal({ open, onOpenChange, defaultTab = "cards" }: AddCoverageModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { selectedCards, toggleCard, addPolicy, addPlan, addedPlans } = useCoverageStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let policyType: "auto" | "home" | "renters" | "other" = "other";
    const nameLower = file.name.toLowerCase();
    if (nameLower.includes("auto") || nameLower.includes("car")) policyType = "auto";
    else if (nameLower.includes("home") || nameLower.includes("house")) policyType = "home";
    else if (nameLower.includes("rent")) policyType = "renters";

    const categoryMap: Record<string, string[]> = {
      auto: ["foundational-auto"],
      home: ["foundational-home"],
      renters: ["foundational-home"],
      other: [],
    };

    addPolicy({
      id: `policy_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      type: policyType,
      filename: file.name,
      categories: categoryMap[policyType] as any[],
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const handleAddPlan = (planId: string) => {
    addPlan(planId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Add Your Coverage
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select credit cards, upload policies, or add common plans
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="cards">Credit Cards</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="plans">Other Plans</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* Credit Cards Tab */}
            <TabsContent value="cards" className="mt-0 space-y-6">
              {Object.entries(cardDatabase).map(([issuer, cards]) => (
                <div key={issuer}>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-3">
                    {issuer === "chase" ? "Chase" : "American Express"}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cards.map((card) => {
                      const isSelected = selectedCards.includes(card.id);
                      return (
                        <button
                          key={card.id}
                          onClick={() => toggleCard(card.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150",
                            isSelected
                              ? "border-primary bg-secondary"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm text-foreground truncate">
                                {card.name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              ${card.annualFee}/yr
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies" className="mt-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-accent/50 transition-colors text-center"
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold text-foreground">
                  Upload Insurance Policy
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop or click to browse (PDF, PNG, JPG)
                </p>
              </button>

              <div className="mt-6 p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Pro tip:</strong> Include "auto", "home", or "renters" in your filename for automatic categorization.
                </p>
              </div>
            </TabsContent>

            {/* Other Plans Tab */}
            <TabsContent value="plans" className="mt-0 space-y-2">
              {commonPlans.map((plan) => {
                const isAdded = addedPlans.some(p => p.id === plan.id);
                return (
                  <button
                    key={plan.id}
                    onClick={() => !isAdded && handleAddPlan(plan.id)}
                    disabled={isAdded}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                      isAdded
                        ? "border-primary/50 bg-secondary opacity-70 cursor-not-allowed"
                        : "border-border hover:border-primary hover:bg-accent/50"
                    )}
                  >
                    <span className="text-2xl">✨</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Coverage for {plan.categories.map(c => c.replace(/-/g, " ")).join(", ")}
                      </p>
                    </div>
                    {isAdded ? (
                      <Check className="w-5 h-5 text-primary" />
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
