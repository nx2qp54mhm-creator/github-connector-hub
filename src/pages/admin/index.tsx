import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CreditCard, Clock, CheckCircle, AlertCircle } from "lucide-react";

// Placeholder stats - will be fetched from database in real implementation
const stats = {
  totalCards: 11,
  totalIssuers: 2,
  pendingReviews: 0,
  recentUploads: 0,
};

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
            <CardTitle className="text-3xl">{stats.totalCards}</CardTitle>
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
              {stats.pendingReviews}
              {stats.pendingReviews > 0 ? (
                <AlertCircle className="h-5 w-5 text-warning" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReviews > 0
                ? "Extractions awaiting review"
                : "All extractions reviewed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recent Uploads</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {stats.recentUploads}
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Data Quality</CardDescription>
            <CardTitle className="text-3xl text-success">Good</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              All cards have complete data
            </p>
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

      {/* Recent activity placeholder */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <Card>
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
        </Card>
      </div>
    </div>
  );
}
