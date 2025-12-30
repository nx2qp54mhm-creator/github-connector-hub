import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Available issuers - can be expanded
const ISSUERS = [
  { id: "chase", name: "Chase" },
  { id: "amex", name: "American Express" },
  { id: "citi", name: "Citi" },
  { id: "capital_one", name: "Capital One" },
  { id: "discover", name: "Discover" },
  { id: "other", name: "Other" },
];

// Available cards by issuer - this would come from the database in production
const CARDS_BY_ISSUER: Record<string, Array<{ id: string; name: string }>> = {
  chase: [
    { id: "chase_sapphire_reserve", name: "Sapphire Reserve" },
    { id: "chase_sapphire_preferred", name: "Sapphire Preferred" },
    { id: "chase_freedom_unlimited", name: "Freedom Unlimited" },
    { id: "chase_freedom_flex", name: "Freedom Flex" },
    { id: "chase_ink_preferred", name: "Ink Business Preferred" },
    { id: "new", name: "+ Add New Card" },
  ],
  amex: [
    { id: "amex_platinum", name: "Platinum Card" },
    { id: "amex_gold", name: "Gold Card" },
    { id: "amex_green", name: "Green Card" },
    { id: "amex_business_platinum", name: "Business Platinum" },
    { id: "amex_delta_reserve", name: "Delta Reserve" },
    { id: "amex_delta_gold", name: "Delta Gold" },
    { id: "new", name: "+ Add New Card" },
  ],
};

export default function AdminUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [issuer, setIssuer] = useState("");
  const [cardId, setCardId] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [guideVersion, setGuideVersion] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (selectedFile: File) => {
    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      toast.error("Invalid file type", {
        description: "Please upload a PDF file.",
      });
      return;
    }

    // Validate file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum file size is 50MB.",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  const availableCards = issuer ? (CARDS_BY_ISSUER[issuer] || [{ id: "new", name: "+ Add New Card" }]) : [];

  const handleUpload = async () => {
    if (!file || !issuer || !user) {
      toast.error("Missing required fields");
      return;
    }

    if (!cardId) {
      toast.error("Please select a card");
      return;
    }

    if (cardId === "new" && !newCardName.trim()) {
      toast.error("Please enter a name for the new card");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${issuer}/${cardId === "new" ? "new_card" : cardId}/${timestamp}_${sanitizedFileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("benefit-guides")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Create database record
      const { data: docData, error: dbError } = await supabase
        .from("benefit_guide_documents")
        .insert({
          issuer: ISSUERS.find((i) => i.id === issuer)?.name || issuer,
          card_id: cardId === "new" ? null : cardId,
          card_name: cardId === "new" ? newCardName : availableCards.find((c) => c.id === cardId)?.name,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          guide_version: guideVersion || null,
          processing_status: "pending",
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from("benefit-guides").remove([filePath]);
        throw dbError;
      }

      toast.success("Guide uploaded successfully", {
        description: "The AI extraction process will begin shortly.",
      });

      // Navigate to the review page (will show processing status)
      navigate(`/admin/review?document=${docData.id}`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Benefits Guide</h1>
        <p className="text-muted-foreground mt-1">
          Upload a PDF benefits guide for automated AI extraction
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Upload file */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                  1
                </span>
                Upload Document
              </CardTitle>
              <CardDescription>
                Select a PDF benefits guide from the card issuer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground font-medium">
                    Drag & drop your PDF here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse (max 50MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                  2
                </span>
                Select Card
              </CardTitle>
              <CardDescription>
                Choose the card this benefits guide applies to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issuer">Card Issuer</Label>
                <Select value={issuer} onValueChange={(value) => {
                  setIssuer(value);
                  setCardId("");
                  setNewCardName("");
                }}>
                  <SelectTrigger id="issuer">
                    <SelectValue placeholder="Select issuer" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUERS.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {issuer && (
                <div className="space-y-2">
                  <Label htmlFor="card">Card</Label>
                  <Select value={cardId} onValueChange={setCardId}>
                    <SelectTrigger id="card">
                      <SelectValue placeholder="Select card" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {cardId === "new" && (
                <div className="space-y-2">
                  <Label htmlFor="newCardName">New Card Name</Label>
                  <Input
                    id="newCardName"
                    placeholder="e.g., Sapphire Preferred"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="version">Guide Version (optional)</Label>
                <Input
                  id="version"
                  placeholder="e.g., 2025-01 or v2.0"
                  value={guideVersion}
                  onChange={(e) => setGuideVersion(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/admin")}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !issuer || !cardId || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Extract
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                  1
                </div>
                <p className="text-muted-foreground">
                  Upload a PDF benefits guide from the card issuer
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                  2
                </div>
                <p className="text-muted-foreground">
                  AI extracts benefit data automatically
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                  3
                </div>
                <p className="text-muted-foreground">
                  Review and approve the extracted data
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                  4
                </div>
                <p className="text-muted-foreground">
                  Data is added to the card database
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border-warning/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Tips for best results
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Use official benefits guides from the card issuer for most accurate extraction.
              </p>
              <p>
                Ensure the PDF is text-searchable, not a scanned image.
              </p>
              <p>
                Low confidence extractions will be flagged for manual review.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
