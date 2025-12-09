import { useState, useRef } from "react";
import { Check, Upload, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cardDatabase, commonPlans } from "@/data/cardDatabase";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { useAutoPolicy } from "@/hooks/useAutoPolicy";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface AddCoverageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

export function AddCoverageModal({
  open,
  onOpenChange,
  defaultTab = "cards"
}: AddCoverageModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    selectedCards,
    toggleCard,
    addPolicy,
    addPlan,
    addedPlans
  } = useCoverageStore();
  const { refetch: refetchAutoPolicy } = useAutoPolicy();

  const resetUploadState = () => {
    setIsUploading(false);
    setIsProcessing(false);
    setUploadingFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload policies.",
        variant: "destructive",
      });
      resetUploadState();
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, PNG, and JPG files are allowed.",
        variant: "destructive",
      });
      resetUploadState();
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      resetUploadState();
      return;
    }

    // Start upload
    setIsUploading(true);
    setUploadingFileName(file.name);

    try {
      // Determine policy type from filename
      let policyType = "other";
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes("auto") || nameLower.includes("car")) policyType = "auto";
      else if (nameLower.includes("home") || nameLower.includes("house")) policyType = "home";
      else if (nameLower.includes("rent")) policyType = "renters";

      // Create file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${policyType}/${timestamp}_${sanitizedFileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("insurance-documents")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Insert record into policy_documents table
      const { data: docData, error: dbError } = await supabase
        .from("policy_documents")
        .insert({
          user_id: user.id,
          policy_type: policyType,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          processing_status: "pending",
        })
        .select("id")
        .single();

      if (dbError) {
        // If database insert fails, try to delete the uploaded file
        await supabase.storage.from("insurance-documents").remove([filePath]);
        throw new Error(dbError.message);
      }

      // Switch to processing state
      setIsUploading(false);
      setIsProcessing(true);

      toast({
        title: "Analyzing your policy...",
        description: "This may take a moment.",
      });

      // Call the Edge Function to parse the document
      const { error: parseError } = await supabase.functions.invoke("smart-worker", {
        body: { document_id: docData.id },
      });

      if (parseError) {
        console.error("Parse error:", parseError);
        toast({
          title: "Analysis failed",
          description: parseError.message || "Could not analyze the policy. You can try again later.",
          variant: "destructive",
        });
        resetUploadState();
        return;
      }

      // Also add to local store for immediate UI update
      const categoryMap: Record<string, string[]> = {
        auto: ["foundational-auto"],
        home: ["foundational-home"],
        renters: ["foundational-home"],
        other: [],
      };

      addPolicy({
        id: docData.id,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: policyType as "auto" | "home" | "renters" | "other",
        filename: file.name,
        categories: categoryMap[policyType] as any[],
      });

      // Refetch auto policy to update the Auto Insurance card
      if (policyType === "auto") {
        await refetchAutoPolicy();
      }

      toast({
        title: "Policy analyzed successfully!",
        description: "Your coverage details have been extracted.",
      });

      resetUploadState();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      resetUploadState();
    }
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
                    {cards.map(card => {
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
                              isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
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
                disabled={isUploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isProcessing}
                className={cn(
                  "w-full p-8 border-2 border-dashed border-border rounded-xl transition-colors text-center",
                  (isUploading || isProcessing)
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:border-primary hover:bg-accent/50"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-10 h-10 mx-auto text-primary mb-3 animate-spin" />
                    <p className="font-semibold text-foreground">Analyzing policy...</p>
                    <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs mx-auto">
                      {uploadingFileName}
                    </p>
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="w-10 h-10 mx-auto text-primary mb-3 animate-spin" />
                    <p className="font-semibold text-foreground">Uploading...</p>
                    <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs mx-auto">
                      {uploadingFileName}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground">
                      Upload Insurance Policy
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag & drop or click to browse (PDF, PNG, JPG - max 10MB)
                    </p>
                  </>
                )}
              </button>

              <div className="mt-6 p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Pro tip:</strong> Include "auto", "home", or "renters" in your filename for automatic categorization.
                </p>
              </div>
            </TabsContent>

            {/* Other Plans Tab */}
            <TabsContent value="plans" className="mt-0 space-y-2">
              {commonPlans.map(plan => {
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
