import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Check, Code, FileJson } from "lucide-react";
import { toast } from "sonner";

interface ExtractedBenefit {
  id: string;
  benefit_type: string;
  extracted_data: Record<string, unknown>;
  confidence_score: number;
  is_approved: boolean | null;
}

interface DocumentInfo {
  id: string;
  issuer: string;
  card_id: string | null;
  card_name: string | null;
}

interface JSONGeneratorProps {
  document: DocumentInfo;
  benefits: ExtractedBenefit[];
}

// Map extracted benefit types to JSON structure keys
const BENEFIT_TYPE_MAP: Record<string, string> = {
  rental: "rental",
  tripProtection: "tripProtection",
  baggageProtection: "baggageProtection",
  purchaseProtection: "purchaseProtection",
  extendedWarranty: "extendedWarranty",
  cellPhoneProtection: "cellPhoneProtection",
  roadsideAssistance: "roadsideAssistance",
  emergencyAssistance: "emergencyAssistance",
  returnProtection: "returnProtection",
  travelPerks: "travelPerks",
};

// Determine categories based on extracted benefits
function determineCategories(benefits: ExtractedBenefit[]): string[] {
  const categoryMap: Record<string, string> = {
    rental: "travel-rental",
    tripProtection: "travel-trip",
    baggageProtection: "travel-baggage",
    purchaseProtection: "purchase-protection",
    extendedWarranty: "purchase-warranty",
    cellPhoneProtection: "phone-protection",
    roadsideAssistance: "roadside-assistance",
    emergencyAssistance: "travel-emergency",
    returnProtection: "purchase-return",
    travelPerks: "travel-perks",
  };

  const categories = new Set<string>();
  benefits.forEach((b) => {
    if (b.is_approved === true && categoryMap[b.benefit_type]) {
      categories.add(categoryMap[b.benefit_type]);
    }
  });

  return Array.from(categories);
}

// Generate a card ID from the card name
function generateCardId(issuer: string, cardName: string): string {
  const sanitizedIssuer = issuer.toLowerCase().replace(/\s+/g, "_");
  const sanitizedName = cardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `${sanitizedIssuer}_${sanitizedName}`;
}

// Determine tier based on annual fee (can be overridden)
function determineTier(annualFee: number | null): "premium" | "mid-tier" | "basic" {
  if (!annualFee || annualFee === 0) return "basic";
  if (annualFee >= 400) return "premium";
  return "mid-tier";
}

export function JSONGenerator({ document, benefits }: JSONGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Filter to only approved benefits
  const approvedBenefits = benefits.filter((b) => b.is_approved === true);

  if (approvedBenefits.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <FileJson className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Approve benefits to generate JSON
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build the benefits object from approved extractions
  const benefitsObj: Record<string, unknown> = {};
  approvedBenefits.forEach((benefit) => {
    const key = BENEFIT_TYPE_MAP[benefit.benefit_type] || benefit.benefit_type;
    benefitsObj[key] = benefit.extracted_data;
  });

  // Find annual fee from travelPerks or other data
  const travelPerks = approvedBenefits.find((b) => b.benefit_type === "travelPerks");
  const annualFee = (travelPerks?.extracted_data as Record<string, unknown>)?.annualFee as number | null;

  // Generate the card JSON structure
  const cardJson = {
    id: generateCardId(document.issuer, document.card_name || "Unknown"),
    name: document.card_name || "Unknown Card",
    fullName: `${document.issuer} ${document.card_name || "Unknown Card"}`,
    network: document.issuer === "American Express" ? "American Express" : "Visa",
    annualFee: annualFee || 0,
    tier: determineTier(annualFee),
    categories: determineCategories(approvedBenefits),
    benefits: benefitsObj,
  };

  const jsonString = JSON.stringify(cardJson, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${cardJson.id}.json`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON file downloaded");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5" />
              Generated JSON
            </CardTitle>
            <CardDescription>
              Copy this JSON to add to your card data files
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Preview" : "Raw JSON"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{cardJson.id}</Badge>
          <Badge variant="secondary">{cardJson.tier}</Badge>
          <Badge variant="secondary">${cardJson.annualFee}/yr</Badge>
          <Badge variant="secondary">{approvedBenefits.length} benefits</Badge>
        </div>

        {/* JSON display */}
        {showRaw ? (
          <Textarea
            value={jsonString}
            readOnly
            className="font-mono text-xs min-h-[400px]"
          />
        ) : (
          <div className="space-y-3">
            {/* Card Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Card Information</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>{" "}
                  <code className="text-xs bg-muted px-1 rounded">{cardJson.id}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Name:</span> {cardJson.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Network:</span> {cardJson.network}
                </div>
                <div>
                  <span className="text-muted-foreground">Annual Fee:</span> ${cardJson.annualFee}
                </div>
                <div>
                  <span className="text-muted-foreground">Tier:</span> {cardJson.tier}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Categories</p>
              <div className="flex flex-wrap gap-1">
                {cardJson.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Benefits preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Extracted Benefits</p>
              <div className="space-y-2">
                {approvedBenefits.map((benefit) => (
                  <div
                    key={benefit.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {BENEFIT_TYPE_MAP[benefit.benefit_type] || benefit.benefit_type}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        benefit.confidence_score >= 0.8
                          ? "border-green-500 text-green-600"
                          : benefit.confidence_score >= 0.6
                          ? "border-yellow-500 text-yellow-600"
                          : "border-red-500 text-red-600"
                      }
                    >
                      {Math.round(benefit.confidence_score * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground border-t pt-4">
          <p className="font-medium mb-1">Next steps:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Copy the JSON above</li>
            <li>
              Open{" "}
              <code className="text-xs bg-muted px-1 rounded">
                src/data/coverage/sources/credit-cards/{document.issuer.toLowerCase().replace(/\s+/g, "-")}.json
              </code>
            </li>
            <li>Add this card to the "cards" array</li>
            <li>Commit and deploy the changes</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
