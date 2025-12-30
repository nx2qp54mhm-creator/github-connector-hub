import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { getAllCards } from "@/data/cardDatabase";

export default function AdminCards() {
  const allCards = getAllCards();

  // Group cards by issuer
  const cardsByIssuer = allCards.reduce((acc, card) => {
    const issuer = card.issuer || "Unknown";
    if (!acc[issuer]) {
      acc[issuer] = [];
    }
    acc[issuer].push(card);
    return acc;
  }, {} as Record<string, typeof allCards>);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manage Cards</h1>
        <p className="text-muted-foreground mt-1">
          View and manage credit card benefit data
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cards</CardDescription>
            <CardTitle className="text-3xl">{allCards.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Issuers</CardDescription>
            <CardTitle className="text-3xl">{Object.keys(cardsByIssuer).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Benefit Types</CardDescription>
            <CardTitle className="text-3xl">10</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Cards by issuer */}
      {Object.entries(cardsByIssuer).map(([issuer, cards]) => (
        <div key={issuer}>
          <h2 className="text-xl font-semibold text-foreground mb-4">{issuer}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="hover:border-primary/50 transition-colors cursor-pointer">
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
                    <Badge variant="outline">${card.annualFee}/yr</Badge>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
