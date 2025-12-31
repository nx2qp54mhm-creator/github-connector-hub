import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Edit2, Save, RotateCcw, Code } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import {
  RentalBenefitForm,
  TripProtectionForm,
  BaggageProtectionForm,
  PurchaseProtectionForm,
  ExtendedWarrantyForm,
  CellPhoneProtectionForm,
  RoadsideAssistanceForm,
  EmergencyAssistanceForm,
  ReturnProtectionForm,
  TravelPerksForm,
} from "./benefit-forms";

interface BenefitEditorProps {
  benefitId: string;
  benefitType: string;
  extractedData: Record<string, unknown>;
  confidenceScore: number;
  sourceExcerpts: string[] | null;
  isApproved: boolean | null;
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

// Map benefit types to their form components
const BENEFIT_FORM_MAP: Record<string, React.ComponentType<{
  defaultValues: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}>> = {
  rental: RentalBenefitForm,
  tripProtection: TripProtectionForm,
  baggageProtection: BaggageProtectionForm,
  purchaseProtection: PurchaseProtectionForm,
  extendedWarranty: ExtendedWarrantyForm,
  cellPhoneProtection: CellPhoneProtectionForm,
  roadsideAssistance: RoadsideAssistanceForm,
  emergencyAssistance: EmergencyAssistanceForm,
  returnProtection: ReturnProtectionForm,
  travelPerks: TravelPerksForm,
};

export function BenefitEditor({
  benefitId,
  benefitType,
  extractedData,
  confidenceScore,
  sourceExcerpts,
  isApproved,
  onApprove,
  onReject,
  onUpdate,
}: BenefitEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [editedData, setEditedData] = useState(JSON.stringify(extractedData, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>(extractedData);
  const formRef = useRef<HTMLFormElement>(null);

  const FormComponent = BENEFIT_FORM_MAP[benefitType];
  const hasStructuredForm = !!FormComponent;

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      setIsLoading(true);
      // Filter out undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      );
      await onUpdate(benefitId, cleanedData);
      setFormData(cleanedData);
      setEditedData(JSON.stringify(cleanedData, null, 2));
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonSave = async () => {
    try {
      setIsLoading(true);
      const parsedData = JSON.parse(editedData);
      await onUpdate(benefitId, parsedData);
      setFormData(parsedData);
      setIsEditing(false);
    } catch {
      // JSON parse error - handled by UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    // If editing, save first
    if (isEditing && formRef.current) {
      formRef.current.requestSubmit();
      return;
    }
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
    if (isApproved === true) {
      return <Badge className="bg-success/10 text-success border-success/30">Approved</Badge>;
    } else if (isApproved === false) {
      return <Badge variant="destructive">Rejected</Badge>;
    } else {
      return <Badge variant="outline">Pending Review</Badge>;
    }
  };

  const renderContent = () => {
    // Raw JSON editing mode
    if (showRawJson || !hasStructuredForm) {
      if (isEditing) {
        return (
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
                  setEditedData(JSON.stringify(formData, null, 2));
                  setIsEditing(false);
                }}
                disabled={isLoading}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleJsonSave} disabled={isLoading}>
                <Save className="h-3 w-3 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        );
      }
      return (
        <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-auto max-h-[300px]">
          {JSON.stringify(formData, null, 2)}
        </pre>
      );
    }

    // Structured form view
    if (isEditing) {
      return (
        <div className="space-y-3">
          <FormComponent
            defaultValues={formData}
            onSubmit={handleFormSubmit}
            formRef={formRef}
          />
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFormData(extractedData);
                setIsEditing(false);
              }}
              disabled={isLoading}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={isLoading}
            >
              <Save className="h-3 w-3 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      );
    }

    // Read-only structured view
    return (
      <div className="space-y-3">
        {Object.entries(formData).map(([key, value]) => {
          if (value === undefined || value === null) return null;

          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());

          if (Array.isArray(value)) {
            if (value.length === 0) return null;
            return (
              <div key={key} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className="flex flex-wrap gap-1">
                  {value.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {typeof item === "object" ? JSON.stringify(item) : String(item)}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground min-w-[120px]">{label}:</span>
              <span className="text-sm font-medium">
                {typeof value === "number" && key.toLowerCase().includes("coverage")
                  ? `$${value.toLocaleString()}`
                  : typeof value === "number" && (key.toLowerCase().includes("days") || key.toLowerCase().includes("hours") || key.toLowerCase().includes("years") || key.toLowerCase().includes("miles"))
                  ? `${value} ${key.toLowerCase().includes("days") ? "days" : key.toLowerCase().includes("hours") ? "hours" : key.toLowerCase().includes("years") ? "years" : "miles"}`
                  : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className={isApproved === true ? "border-success/30" : isApproved === false ? "border-destructive/30" : ""}>
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
          <div className="flex gap-2">
            {hasStructuredForm && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRawJson(!showRawJson)}
                disabled={isEditing}
                title={showRawJson ? "Show form view" : "Show raw JSON"}
              >
                <Code className="h-3 w-3" />
              </Button>
            )}
            {isApproved === null && (
              <>
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
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderContent()}

        {sourceExcerpts && sourceExcerpts.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSource(!showSource)}
              className="text-xs"
            >
              {showSource ? "Hide" : "Show"} Source Excerpt{sourceExcerpts.length > 1 ? "s" : ""}
            </Button>
            {showSource && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground border-l-2 border-primary/30 space-y-2">
                {sourceExcerpts.map((excerpt, idx) => (
                  <p key={idx} className="whitespace-pre-wrap">{excerpt}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
