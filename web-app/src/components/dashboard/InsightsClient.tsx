"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, MessageSquare, Share2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { insightsAPI, type Insight } from "@/lib/services";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function InsightsClient() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newText, setNewText] = useState("");
  const [newSentiment, setNewSentiment] = useState<"bullish" | "bearish" | "neutral">("bullish");
  const [isPublic, setIsPublic] = useState(true);

  const fetchInsights = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await insightsAPI.getInsights({ page: pageNum, limit: 12 });
      setInsights(res.insights);
      setTotal(res.total);
      setPages(res.pages);
      setPage(res.page);
    } catch (err) {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(1);
  }, []);

  const handlePostInsight = async () => {
    if (!newSymbol || !newText) {
      toast.error("Please fill in symbol and insight text");
      return;
    }
    try {
      await insightsAPI.createInsight({
        symbol: newSymbol,
        text: newText,
        sentiment: newSentiment,
        isPublic,
      });
      toast.success("Insight posted successfully");
      setIsDialogOpen(false);
      setNewSymbol("");
      setNewText("");
      setNewSentiment("bullish");
      fetchInsights(1); // Refresh
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post insight");
    }
  };

  const handleLike = async (id: string) => {
    if (!user) {
      toast.error("Must be logged in to like");
      return;
    }
    try {
      const res = await insightsAPI.toggleLike(id);
      setInsights(prev => prev.map(insight => {
        if (insight._id === id) {
          const likedBy = res.liked 
            ? [...insight.likedBy, user.id] 
            : insight.likedBy.filter(uid => uid !== user.id);
          return { ...insight, likes: res.likes, likedBy };
        }
        return insight;
      }));
    } catch (err) {
      toast.error("Failed to like insight");
    }
  };

  return (
    <>
      {/* Market Pulse Header */}
      <Card className="card-clinical mb-6 p-0 shadow-none">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          <div>
            <h1 className="font-heading text-2xl font-bold">Market Pulse</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time aggregate sentiment across NEPSE listed companies.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full md:w-auto">
            <div className="text-center">
              <p className="clinical-label">Global Sentiment</p>
              <div className="mt-1 flex items-center gap-2 justify-center md:justify-start">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="font-heading text-lg font-bold">BULLISH</span>
              </div>
            </div>
            <div className="text-center">
              <p className="clinical-label">Avg Confidence</p>
              <span className="font-heading text-lg font-bold positive">78.4%</span>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Post Insight
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Post New Insight</DialogTitle>
                  <DialogDescription>
                    Share your market analysis and technical outlook with the community.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input id="symbol" placeholder="e.g. NICA" className="uppercase" value={newSymbol} onChange={e => setNewSymbol(e.target.value.toUpperCase())} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sentiment">Sentiment</Label>
                    <div className="flex gap-2">
                      {(["bullish", "neutral", "bearish"] as const).map(s => (
                        <Button 
                          key={s} 
                          type="button"
                          variant={newSentiment === s ? "default" : "outline"} 
                          onClick={() => setNewSentiment(s)}
                          className="flex-1 capitalize"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="insight">Insight</Label>
                    <Textarea id="insight" placeholder="Type your analysis here..." className="h-24 resize-none" value={newText} onChange={e => setNewText(e.target.value)} />
                  </div>
                  <div className="flex items-center space-x-2 pt-2 border-t border-border mt-2">
                    <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                    <Label htmlFor="public" className="font-normal cursor-pointer">Post publicly to all tiers</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" className="w-full" onClick={handlePostInsight}>Submit Insight</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs defaultValue="sectors" className="w-full sm:w-auto overflow-x-auto">
          <TabsList className="bg-secondary/50 border border-border h-9 min-w-max">
            <TabsTrigger value="sectors" className="text-xs px-4">All Sectors</TabsTrigger>
            <TabsTrigger value="time" className="text-xs px-4">24 Hours</TabsTrigger>
            <TabsTrigger value="sentiment" className="text-xs px-4">All Sentiment</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-sm text-muted-foreground">
          Showing <strong className="text-foreground">{total}</strong> verified insights
        </span>
      </div>

      {/* Insight Cards */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading insights...</div>
      ) : insights.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No insights found. Be the first to post!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {insights.map((insight) => {
            const hasLiked = user && insight.likedBy?.includes(user.id);
            const timeAgo = formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true });
            const confidenceLabel = insight.confidence > 80 ? "High" : insight.confidence > 50 ? "Mid" : "Low";

            return (
              <Card key={insight._id} className="card-clinical flex flex-col justify-between p-0 shadow-none">
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar className="h-9 w-9 bg-secondary">
                        <AvatarFallback className="text-sm font-bold">{insight.user?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{insight.user?.name || "Anonymous"}</span>
                          <Badge variant="outline" className={insight.sentiment === "bullish" ? "badge-bullish border-0" : insight.sentiment === "bearish" ? "badge-bearish border-0" : "bg-muted text-muted-foreground border-0"}>
                            {insight.sentiment}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {insight.user?.profile?.experience || "Trader"} • {timeAgo}
                        </p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="font-heading text-sm font-bold">{insight.symbol}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{insight.company}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{insight.text}</p>
                  </div>

                  <div className="mt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="clinical-label">Confidence</span>
                      <span className={`text-xs font-bold ${insight.confidence > 80 ? "positive" : insight.confidence > 50 ? "text-warning" : "negative"}`}>
                        {insight.confidence}% {confidenceLabel}
                      </span>
                    </div>
                    <Progress 
                      value={insight.confidence} 
                      className="h-1 bg-secondary [&>div]:bg-primary" 
                    />

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleLike(insight._id)}
                          className={`h-6 px-2 flex items-center gap-1.5 text-xs hover:text-foreground ${hasLiked ? "text-primary font-bold" : "text-muted-foreground"}`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" /> {insight.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <MessageSquare className="h-3.5 w-3.5" /> 0
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && fetchInsights(page - 1)} 
                  className={`hover:bg-secondary cursor-pointer ${page === 1 ? "opacity-50 pointer-events-none" : ""}`} 
                />
              </PaginationItem>
              
              {[...Array(pages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    onClick={() => fetchInsights(i + 1)}
                    isActive={page === i + 1}
                    className={`cursor-pointer ${page === i + 1 ? "bg-primary/10 border-primary text-primary" : "hover:bg-secondary"}`}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < pages && fetchInsights(page + 1)} 
                  className={`hover:bg-secondary cursor-pointer ${page === pages ? "opacity-50 pointer-events-none" : ""}`} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
