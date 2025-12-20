import { LogOut, User, ChevronDown } from "lucide-react";
import policyPocketLogo from "@/assets/policy-pocket-logo.jpeg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const displayName = profile?.name || user?.email;

  return (
    <header className={cn("gradient-header px-4 py-4 md:px-6 sticky top-0 z-20 shadow-lg border-b border-primary/20", className)}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={policyPocketLogo} 
            alt="Policy Pocket logo" 
            className="w-10 h-10 rounded-lg object-contain"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-primary-foreground tracking-tight font-sans text-left">
              Policy Pocket
            </h1>
            <p className="text-xs md:text-sm text-primary-foreground/85 font-sans">
              Your Coverage Intelligence System
            </p>
          </div>
        </div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 text-xs md:text-sm px-3 py-1.5 h-auto gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[150px] truncate">{displayName}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card z-50">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.name || "Account"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
