import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Copy, Check, Save, CreditCard as CreditCardIcon } from "lucide-react";
import { toast } from "sonner";
import { getCardById } from "@/data/cardDatabase";
import type { CreditCard } from "@/types/coverage";

const BENEFIT_LABELS: Record<string, string> = {
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

export default function CardEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<CreditCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      const foundCard = getCardById(id);
      setCard(foundCard || null);
      setIsLoading(false);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/cards"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to cards
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCardIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Card not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build JSON representation of the card
  const cardJson = {
    id: card.id,
    name: card.name,
    fullName: card.fullName,
    network: card.network,
    annualFee: card.annualFee,
    categories: card.categories,
    benefits: {
      ...(card.rental && { rental: card.rental }),
      ...(card.tripProtection && { tripProtection: card.tripProtection }),
      ...(card.baggageProtection && { baggageProtection: card.baggageProtection }),
      ...(card.purchaseProtection && { purchaseProtection: card.purchaseProtection }),
      ...(card.extendedWarranty && { extendedWarranty: card.extendedWarranty }),
      ...(card.cellPhoneProtection && { cellPhoneProtection: card.cellPhoneProtection }),
      ...(card.roadsideAssistance && { roadsideAssistance: card.roadsideAssistance }),
      ...(card.emergencyAssistance && { emergencyAssistance: card.emergencyAssistance }),
      ...(card.returnProtection && { returnProtection: card.returnProtection }),
      ...(card.travelPerks && { travelPerks: card.travelPerks }),
    },
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(cardJson, null, 2));
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Get list of benefits this card has
  const cardBenefits = Object.entries(BENEFIT_LABELS).filter(([key]) => {
    return card[key as keyof CreditCard] !== undefined;
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/cards"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to cards
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{card.fullName}</h1>
          <p className="text-muted-foreground mt-1">
            {card.issuer} - {card.network}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyJson}>
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied" : "Copy JSON"}
          </Button>
        </div>
      </div>

      {/* Card Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Card Details</CardTitle>
            <CardDescription>Basic card information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Card ID</Label>
              <Input value={card.id} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={card.name} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={card.fullName} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <Input value={card.network} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Annual Fee</Label>
                <Input value={`$${card.annualFee}`} readOnly className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coverage Categories</CardTitle>
            <CardDescription>What this card covers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {card.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <CardDescription>Coverage highlights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {card.rental && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rental Coverage</span>
                <Badge variant={card.rental.coverageType === "primary" ? "default" : "outline"}>
                  {card.rental.coverageType}
                </Badge>
              </div>
            )}
            {card.rental && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Rental</span>
                <span>${card.rental.maxCoverage?.toLocaleString()}</span>
              </div>
            )}
            {card.tripProtection && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trip Cancellation</span>
                <span>${card.tripProtection.maxCancellation?.toLocaleString()}</span>
              </div>
            )}
            {card.purchaseProtection && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Purchase Protection</span>
                <span>${card.purchaseProtection.maxPerClaim?.toLocaleString()}/claim</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Benefits</span>
              <span>{cardBenefits.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Detail */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Benefits Detail</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cardBenefits.map(([key, label]) => {
            const benefitData = card[key as keyof CreditCard];
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-[200px]">
                    {JSON.stringify(benefitData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Raw JSON */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Raw JSON</CardTitle>
              <CardDescription>Full card data structure</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyJson}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={JSON.stringify(cardJson, null, 2)}
            readOnly
            className="font-mono text-xs min-h-[300px]"
          />
        </CardContent>
      </Card>

      {/* Edit Notice */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Card data is stored in JSON files and managed through version control.
            To edit this card, modify the corresponding file in{" "}
            <code className="text-xs bg-muted px-1 rounded">
              src/data/coverage/sources/credit-cards/
            </code>{" "}
            and redeploy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
