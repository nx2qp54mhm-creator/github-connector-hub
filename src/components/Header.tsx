import { Shield, LogOut } from "lucide-react";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const totalItems = useCoverageStore(state => state.getTotalItems());
  const { user, signOut } = useAuth();

  return <header className={cn("gradient-header px-4 py-4 md:px-6 sticky top-0 z-20 shadow-lg border-b border-primary/20", className)}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-primary-foreground tracking-tight font-sans text-left">
              Covered
            </h1>
            <p className="text-xs md:text-sm text-primary-foreground/85 font-sans">
              Your Coverage Intelligence System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <div className="px-3 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground text-xs font-medium flex items-center gap-2 border border-primary-foreground/15">
              <span className="w-1.5 h-1.5 rounded-full bg-success-light" />
              {totalItems === 0 ? "Setup in progress" : `${totalItems} source${totalItems !== 1 ? "s" : ""}`}
            </div>
            <p className="text-xs text-primary-foreground/75 hidden sm:block">
              {totalItems === 0 ? "Add your first coverage source" : "Profile configured"}
            </p>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>;
}