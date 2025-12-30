import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CreditCard, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAllCards } from "@/data/cardDatabase";

interface Stats {
  totalCards: number;
  totalIssuers: number;
  pendingReviews: number;
  pendingDocuments: number;
  recentUploads: number;
}

interface RecentDocument {
  id: string;
  card_name: string | null;
  issuer: string;
  processing_status: string;
  created_at: string;
}

const quickActions = [
  {
    title: "Upload Benefits Guide",
    description: "Upload a new PDF benefits guide for AI extraction",
    icon: Upload,
    href: "/admin/upload",
    variant: "default" as const,
  },
  {
    title: "Review Extractions",
    description: "Review and approve pending benefit extractions",
    icon: FileText,
    href: "/admin/review",
    variant: "outline" as const,
  },
  {
    title: "Manage Cards",
    description: "View and edit existing credit card data",
    icon: CreditCard,
    href: "/admin/cards",
    variant: "outline" as const,
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCards: 0,
    totalIssuers: 0,
    pendingReviews: 0,
    pendingDocuments: 0,
    recentUploads: 0,
  });
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);

      // Get card stats from local data
      const allCards = getAllCards();
      const issuers = new Set(allCards.map(c => c.issuer));

      // Get pending reviews count
      const { count: pendingReviewsCount } = await supabase
        .from("extracted_benefits")
        .select("*", { count: "exact", head: true })
        .eq("review_status", "pending");

      // Get pending/processing documents count
      const { count: pendingDocsCount } = await supabase
        .from("benefit_guide_documents")
        .select("*", { count: "exact", head: true })
        .in("processing_status", ["pending", "processing"]);

      // Get recent uploads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentUploadsCount } = await supabase
        .from("benefit_guide_documents")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      // Get recent documents for activity feed
      const { data: recentDocsData } = await supabase
        .from("benefit_guide_documents")
        .select("id, card_name, issuer, processing_status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalCards: allCards.length,
        totalIssuers: issuers.size,
        pendingReviews: pendingReviewsCount || 0,
        pendingDocuments: pendingDocsCount || 0,
        recentUploads: recentUploadsCount || 0,
      });

      setRecentDocs(recentDocsData || []);
      setIsLoading(false);
    };

    fetchStats();

    // Set up real-time subscription
    const channel = supabase
      .channel("admin-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "benefit_guide_documents" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "extracted_benefits" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage credit card benefits data and AI extractions
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cards</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalCards}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalIssuers} issuers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Reviews</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {stats.pendingReviews}
                  {stats.pendingReviews > 0 ? (
                    <AlertCircle className="h-5 w-5 text-warning" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReviews > 0
                ? "Benefits awaiting review"
                : "All benefits reviewed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {stats.pendingDocuments}
                  {stats.pendingDocuments > 0 ? (
                    <Loader2 className="h-5 w-5 text-warning animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.pendingDocuments > 0
                ? "Documents being processed"
                : "No documents in queue"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recent Uploads</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {stats.recentUploads}
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card key={action.href} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to={action.href}>
                  <Button variant={action.variant} className="w-full">
                    {action.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <Card>
          {isLoading ? (
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            </CardContent>
          ) : recentDocs.length > 0 ? (
            <CardContent className="p-0">
              <div className="divide-y">
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/admin/review?document=${doc.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {doc.card_name || "Unknown Card"}
                        </p>
                        <p className="text-xs text-muted-foreground">{doc.issuer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(doc.created_at)}
                      </span>
                      {getStatusIcon(doc.processing_status)}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No recent activity. Upload a benefits guide to get started.
              </p>
              <Link to="/admin/upload">
                <Button className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Guide
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
