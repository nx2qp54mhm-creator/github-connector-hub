import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, ShoppingCart, Home, Info, Loader2, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import { AutoInsuranceCard } from "@/components/AutoInsuranceCard";
import { CategoryDetailSheet } from "@/components/CategoryDetailSheet";
import { CoverageLibrary } from "@/components/CoverageLibrary";
import { ChatDock } from "@/components/ChatDock";
import { AddCoverageModal } from "@/components/AddCoverageModal";
import { AddCoverageCard } from "@/components/AddCoverageCard";
import { categoryGroups } from "@/data/cardDatabase";
import { CategoryDefinition } from "@/types/coverage";
import { useAuth } from "@/hooks/useAuth";

const groupIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  travel: Plane,
  purchases: ShoppingCart,
  foundational: Home,
};

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDefinition | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleCategoryClick = (category: CategoryDefinition): void => {
    setSelectedCategory(category);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header className="bg-primary shadow-none opacity-100 text-primary-foreground" />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Full-width Coverage Assistant */}
        <div className="mb-6">
          <ChatDock />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Main Column */}
          <div className="space-y-6">
            <AddCoverageCard onClick={() => setModalOpen(true)} />

            <Card className="border border-border shadow-soft overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2 text-xl font-sans">
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  Coverage Overview
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your coverage status by category
                </p>
              </div>

              <div className="p-4 space-y-6">
                {categoryGroups.map((group, groupIndex) => {
                  const GroupIcon = groupIcons[group.id];
                  return (
                    <section
                      key={group.id}
                      className="space-y-3 animate-in"
                      style={{ animationDelay: `${groupIndex * 100}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          {GroupIcon && <GroupIcon className="w-4 h-4 text-primary" />}
                        </div>
                        <div>
                          <h2 className="font-serif text-lg font-semibold text-foreground">
                            {group.title}
                          </h2>
                          <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {group.categories.map((category) =>
                          category.id === "foundational-auto" ? (
                            <AutoInsuranceCard
                              key={category.id}
                              category={category}
                              onClick={() => handleCategoryClick(category)}
                            />
                          ) : (
                            <CategoryCard
                              key={category.id}
                              category={category}
                              onClick={() => handleCategoryClick(category)}
                            />
                          )
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <CoverageLibrary />

            <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Coverage details are for informational purposes only. Always verify with your
                card issuer or insurance provider.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <CategoryDetailSheet
        category={selectedCategory}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAddCoverage={() => setModalOpen(true)}
      />

      <AddCoverageModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default Index;
