import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Edit2, Save, RotateCcw } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";

interface BenefitEditorProps {
  benefitId: string;
  benefitType: string;
  extractedData: Record<string, unknown>;
  confidenceScore: number;
  sourceExcerpt: string | null;
  reviewStatus: string;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}

const BENEFIT_TYPE_LABELS: Record<string, string> = {
  rental: "Rental Car Coverage",
  tripProtection: "Trip Protection",
  baggageProtection: "Baggage Protection",
  purchaseProtection: "Purchase Protection",
  extendedWarranty: "Extended Warranty",
  cellPhoneProtection: "Cell Phone Protection",
  roadsideAssistance: "Roadside Assistance",
  emergencyAssistance: "Emergency Assistance",
  returnProtection: "Return Protection",
  travelPerks: "Travel Perks",
};

export function BenefitEditor({
  benefitId,
  benefitType,
  extractedData,
  confidenceScore,
  sourceExcerpt,
  reviewStatus,
  onApprove,
  onReject,
  onUpdate,
}: BenefitEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(JSON.stringify(extractedData, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const parsedData = JSON.parse(editedData);
      await onUpdate(benefitId, parsedData);
      setIsEditing(false);
    } catch {
      // JSON parse error - handled by UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(benefitId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(benefitId);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (reviewStatus) {
      case "approved":
        return <Badge className="bg-success/10 text-success border-success/30">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending Review</Badge>;
    }
  };

  return (
    <Card className={reviewStatus === "approved" ? "border-success/30" : reviewStatus === "rejected" ? "border-destructive/30" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {BENEFIT_TYPE_LABELS[benefitType] || benefitType}
              {getStatusBadge()}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Confidence: <ConfidenceBadge score={confidenceScore} size="sm" />
            </CardDescription>
          </div>
          {reviewStatus === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isLoading}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleReject}
                disabled={isLoading}
              >
                <X className="h-3 w-3 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90"
                onClick={handleApprove}
                disabled={isLoading}
              >
                <Check className="h-3 w-3 mr-1" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedData}
              onChange={(e) => setEditedData(e.target.value)}
              className="font-mono text-xs min-h-[200px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditedData(JSON.stringify(extractedData, null, 2));
                  setIsEditing(false);
                }}
                disabled={isLoading}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading}>
                <Save className="h-3 w-3 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-auto max-h-[300px]">
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        )}

        {sourceExcerpt && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSource(!showSource)}
              className="text-xs"
            >
              {showSource ? "Hide" : "Show"} Source Excerpt
            </Button>
            {showSource && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground border-l-2 border-primary/30">
                <p className="whitespace-pre-wrap">{sourceExcerpt}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
