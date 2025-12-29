import { useState, useRef } from "react";
import { Upload, Loader2, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/hooks/useAuth";
import { useAutoPolicy } from "@/hooks/useAutoPolicy";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OnboardingLayout } from "./OnboardingLayout";
import { CategoryId } from "@/types/coverage";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PolicyUploadStep() {
  const { advanceStep, skipStep, exitOnboarding, currentStep } = useOnboarding();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addPolicy } = useCoverageStore();
  const { refetch: refetchAutoPolicy } = useAutoPolicy();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{
    policyNumber?: string;
    insurer?: string;
    policyType?: string;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, PNG, and JPG files are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadedFileName(file.name);

    try {
      // Determine policy type from filename
      let policyType = "auto";
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes("home") || nameLower.includes("house")) policyType = "home";
      else if (nameLower.includes("rent")) policyType = "renters";

      // Create file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${policyType}/${timestamp}_${sanitizedFileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("insurance-documents")
        .upload(filePath, file);

      if (uploadError) throw new Error(uploadError.message);

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
        await supabase.storage.from("insurance-documents").remove([filePath]);
        throw new Error(dbError.message);
      }

      // Switch to processing state
      setIsUploading(false);
      setIsProcessing(true);

      // Call the Edge Function to parse the document
      const { error: parseError } = await supabase.functions.invoke("smart-worker", {
        body: { document_id: docData.id },
      });

      if (parseError) {
        console.error("Parse error:", parseError);
        toast({
          title: "Analysis failed",
          description: "Could not analyze the policy. You can try again later.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Add to local store
      const categoryMap: Record<string, string[]> = {
        auto: ["foundational-auto"],
        home: ["foundational-home"],
        renters: ["foundational-home"],
      };

      addPolicy({
        id: docData.id,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: policyType as "auto" | "home" | "renters" | "other",
        filename: file.name,
        categories: categoryMap[policyType] as CategoryId[],
      });

      // Refetch auto policy to get extracted data
      if (policyType === "auto") {
        await refetchAutoPolicy();
      }

      setExtractedData({
        policyType,
        insurer: "Your Insurance Provider",
      });
      setIsProcessing(false);
      setUploadSuccess(true);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  // Success state
  if (uploadSuccess) {
    return (
      <OnboardingLayout currentStep={currentStep} onExit={exitOnboarding}>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Check className="w-5 h-5" />
              <span className="font-medium">
                {extractedData?.policyType?.charAt(0).toUpperCase()}
                {extractedData?.policyType?.slice(1)} Policy Extracted
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-6 space-y-4">
            <p className="text-center font-medium text-foreground">
              We found your policy details:
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{uploadedFileName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {extractedData?.policyType} Insurance
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Your coverage details have been saved and are ready to explore.
            </p>
          </div>

          <Button onClick={advanceStep} className="w-full">
            Continue
          </Button>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout currentStep={currentStep} onExit={exitOnboarding}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Step 2 of 3: Add an Insurance Policy
          </p>
          <h2 className="text-2xl font-semibold font-serif text-foreground">
            Upload your auto, home, or renters insurance
          </h2>
          <p className="text-muted-foreground">
            We'll extract your coverage automatically.
          </p>
        </div>

        {/* Upload dropzone */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading || isProcessing}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isProcessing}
          className={cn(
            "w-full p-8 border-2 border-dashed border-border rounded-xl transition-colors text-center",
            isUploading || isProcessing
              ? "opacity-70 cursor-not-allowed"
              : "hover:border-primary hover:bg-accent/50"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-primary mb-3 animate-spin" />
              <p className="font-semibold text-foreground">Analyzing your policy...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Usually takes 10-15 seconds
              </p>
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-primary mb-3 animate-spin" />
              <p className="font-semibold text-foreground">Uploading...</p>
              <p className="text-sm text-muted-foreground mt-1">{uploadedFileName}</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">
                Click to upload or drag & drop
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, PNG, or JPG (max 10MB)
              </p>
            </>
          )}
        </button>

        {/* Helper text */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Common policy locations:</strong>
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Email from your insurance agent</li>
            <li>• Insurance company app or website</li>
            <li>• Renewal notices</li>
          </ul>
        </div>

        {/* Skip link */}
        <div className="text-center">
          <button
            onClick={skipStep}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
