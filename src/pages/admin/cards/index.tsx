import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Plus, Search, Copy, Check, ChevronRight } from "lucide-react";
import { getAllCards } from "@/data/cardDatabase";
import { toast } from "sonner";

const ISSUERS = ["Chase", "American Express", "Citi", "Capital One", "Discover", "Other"];
const NETWORKS = ["Visa", "Mastercard", "American Express", "Discover"];
const TIERS = ["premium", "mid-tier", "basic"];

export default function AdminCards() {
  const allCards = getAllCards();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIssuer, setFilterIssuer] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // New card form state
  const [newCard, setNewCard] = useState({
    name: "",
    issuer: "",
    network: "Visa",
    annualFee: "0",
    tier: "basic",
  });

  // Filter cards based on search and issuer filter
  const filteredCards = allCards.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.issuer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIssuer = filterIssuer === "all" || card.issuer === filterIssuer;

    return matchesSearch && matchesIssuer;
  });

  // Group filtered cards by issuer
  const cardsByIssuer = filteredCards.reduce((acc, card) => {
    const issuer = card.issuer || "Unknown";
    if (!acc[issuer]) {
      acc[issuer] = [];
    }
    acc[issuer].push(card);
    return acc;
  }, {} as Record<string, typeof allCards>);

  // Generate card ID from name
  const generateCardId = (issuer: string, name: string) => {
    const sanitizedIssuer = issuer.toLowerCase().replace(/\s+/g, "_");
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return `${sanitizedIssuer}_${sanitizedName}`;
  };

  // Generate JSON for new card
  const generateNewCardJson = () => {
    const cardId = generateCardId(newCard.issuer, newCard.name);
    return {
      id: cardId,
      name: newCard.name,
      fullName: `${newCard.issuer} ${newCard.name}`,
      network: newCard.network,
      annualFee: parseInt(newCard.annualFee) || 0,
      tier: newCard.tier,
      categories: [],
      benefits: {},
    };
  };

  const handleCopyNewCardJson = async () => {
    try {
      const json = JSON.stringify(generateNewCardJson(), null, 2);
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Get unique issuers for filter
  const uniqueIssuers = [...new Set(allCards.map((c) => c.issuer))];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Cards</h1>
          <p className="text-muted-foreground mt-1">
            View and manage credit card benefit data
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Card</DialogTitle>
              <DialogDescription>
                Generate the JSON structure for a new credit card. You'll need to add this
                to the appropriate JSON file in the codebase.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Card Name</Label>
                <Input
                  id="cardName"
                  placeholder="e.g., Sapphire Reserve"
                  value={newCard.name}
                  onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Select
                  value={newCard.issuer}
                  onValueChange={(value) => setNewCard({ ...newCard, issuer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issuer" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUERS.map((issuer) => (
                      <SelectItem key={issuer} value={issuer}>
                        {issuer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <Select
                    value={newCard.network}
                    onValueChange={(value) => setNewCard({ ...newCard, network: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NETWORKS.map((network) => (
                        <SelectItem key={network} value={network}>
                          {network}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualFee">Annual Fee ($)</Label>
                  <Input
                    id="annualFee"
                    type="number"
                    min="0"
                    value={newCard.annualFee}
                    onChange={(e) => setNewCard({ ...newCard, annualFee: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={newCard.tier}
                  onValueChange={(value) => setNewCard({ ...newCard, tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              {newCard.name && newCard.issuer && (
                <div className="space-y-2">
                  <Label>Generated JSON</Label>
                  <Textarea
                    value={JSON.stringify(generateNewCardJson(), null, 2)}
                    readOnly
                    className="font-mono text-xs min-h-[150px]"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCopyNewCardJson}
                disabled={!newCard.name || !newCard.issuer}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy JSON"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cards</CardDescription>
            <CardTitle className="text-3xl">{allCards.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Issuers</CardDescription>
            <CardTitle className="text-3xl">{uniqueIssuers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Premium Cards</CardDescription>
            <CardTitle className="text-3xl">
              {allCards.filter((c) => c.annualFee >= 400).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>No Annual Fee</CardDescription>
            <CardTitle className="text-3xl">
              {allCards.filter((c) => c.annualFee === 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterIssuer} onValueChange={setFilterIssuer}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by issuer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Issuers</SelectItem>
            {uniqueIssuers.map((issuer) => (
              <SelectItem key={issuer} value={issuer}>
                {issuer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards by issuer */}
      {Object.keys(cardsByIssuer).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No cards found matching your filters.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(cardsByIssuer).map(([issuer, cards]) => (
          <div key={issuer}>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {issuer}
              <Badge variant="secondary" className="ml-2">
                {cards.length} cards
              </Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card) => (
                <Link key={card.id} to={`/admin/cards/${card.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{card.name}</CardTitle>
                            <CardDescription>{card.fullName}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">${card.annualFee}/yr</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {card.rental && (
                          <Badge variant="secondary" className="text-xs">
                            {card.rental.coverageType} rental
                          </Badge>
                        )}
                        {card.tripProtection && (
                          <Badge variant="secondary" className="text-xs">
                            trip protection
                          </Badge>
                        )}
                        {card.purchaseProtection && (
                          <Badge variant="secondary" className="text-xs">
                            purchase protection
                          </Badge>
                        )}
                        {card.extendedWarranty && (
                          <Badge variant="secondary" className="text-xs">
                            extended warranty
                          </Badge>
                        )}
                        {card.cellPhoneProtection && (
                          <Badge variant="secondary" className="text-xs">
                            cell phone
                          </Badge>
                        )}
                        {card.travelPerks && (
                          <Badge variant="secondary" className="text-xs">
                            travel perks
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
