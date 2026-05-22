"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ThumbsUp, MessageSquare, Share2, Plus, Send, Trash2, Clock, Flame, Pencil, BookUser } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import { insightsAPI, type Insight, type InsightComment } from "@/lib/services";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SORT_OPTIONS = [
  { value: "latest",   label: "Latest",   icon: Clock },
  { value: "popular",  label: "Popular",  icon: ThumbsUp },
  { value: "trending", label: "Trending", icon: Flame },
] as const;

type SortOption = "latest" | "popular" | "trending";
type TabOption = "community" | "mine";

// ─── helpers ──────────────────────────────────────────────────────────────────
function shareInsight(insight: Insight) {
  const url  = `${window.location.origin}/insights?symbol=${insight.symbol}`;
  const body = `${insight.symbol} — ${insight.sentiment.toUpperCase()} insight by ${insight.user?.name} on NepseSage:\n"${insight.text.slice(0, 120)}…"\n${url}`;
  if (navigator.share) {
    navigator.share({ title: `${insight.symbol} Insight`, text: body, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(body).then(() => toast.success("Link copied to clipboard"));
  }
}

// ─── Comment Sheet ────────────────────────────────────────────────────────────
function CommentSheet({
  insight, open, onClose, onCountChanged,
}: {
  insight: Insight | null;
  open: boolean;
  onClose: () => void;
  onCountChanged: (insightId: string, delta: number) => void;
}) {
  const { user } = useAuth();
  const [comments, setComments]       = useState<InsightComment[]>([]);
  const [loadingComments, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting]         = useState(false);

  useEffect(() => {
    if (!open || !insight) return;
    setLoading(true);
    insightsAPI
      .getComments(insight._id)
      .then((res) => setComments(res.comments))
      .catch(() => toast.error("Failed to load comments"))
      .finally(() => setLoading(false));
  }, [open, insight]);

  const handlePost = async () => {
    if (!commentText.trim() || !insight) return;
    try {
      setPosting(true);
      const newComment = await insightsAPI.postComment(insight._id, commentText.trim());
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      onCountChanged(insight._id, +1);
      toast.success("Comment posted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!insight) return;
    try {
      await insightsAPI.deleteComment(insight._id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      onCountChanged(insight._id, -1);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <SheetTitle className="font-heading text-base">
            Comments
            {insight && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                on {insight.symbol} · {insight.user?.name}
              </span>
            )}
          </SheetTitle>
          {insight && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{insight.text}</p>
          )}
        </SheetHeader>

        <div className="px-5 py-4 border-b border-border">
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="resize-none h-16 text-sm"
              maxLength={500}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost(); }}
            />
            <Button
              size="icon"
              className="h-16 w-10 shrink-0"
              onClick={handlePost}
              disabled={posting || !commentText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Ctrl+Enter to post</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loadingComments ? (
            <p className="text-sm text-muted-foreground text-center py-8 animate-pulse">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="flex gap-3 group">
                <Avatar className="h-7 w-7 shrink-0 bg-secondary mt-0.5">
                  <AvatarFallback className="text-[11px] font-bold">{c.user?.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{c.user?.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                    {user && String(c.user?._id) === String(user.id) && (
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
function EditInsightDialog({
  insight,
  open,
  onClose,
  onUpdated,
}: {
  insight: Insight | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: Insight) => void;
}) {
  const [text, setText]           = useState("");
  const [sentiment, setSentiment] = useState<"bullish" | "bearish" | "neutral">("bullish");
  const [isPublic, setIsPublic]   = useState(true);
  const [saving, setSaving]       = useState(false);

  // Sync form state whenever the insight changes
  useEffect(() => {
    if (insight) {
      setText(insight.text);
      setSentiment(insight.sentiment);
      setIsPublic(insight.isPublic);
    }
  }, [insight]);

  const handleSave = async () => {
    if (!insight || !text.trim()) return;
    try {
      setSaving(true);
      const updated = await insightsAPI.updateInsight(insight._id, { text: text.trim(), sentiment, isPublic });
      onUpdated(updated);
      toast.success("Insight updated");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update insight");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Insight</DialogTitle>
          <DialogDescription>
            Update your analysis for <strong>{insight?.symbol}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Sentiment</Label>
            <div className="flex gap-2">
              {(["bullish", "neutral", "bearish"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={sentiment === s ? "default" : "outline"}
                  onClick={() => setSentiment(s)}
                  className="flex-1 capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-insight">Insight</Label>
            <Textarea
              id="edit-insight"
              className="h-28 resize-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
            />
            <p className="text-[10px] text-muted-foreground text-right">{text.length}/1000</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Switch id="edit-public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="edit-public" className="font-normal cursor-pointer">
              Post publicly to all users
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !text.trim()}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────
function InsightCard({
  insight,
  currentUserId,
  onLike,
  onComment,
  onEdit,
  onDelete,
}: {
  insight: Insight;
  currentUserId?: string;
  onLike: (id: string) => void;
  onComment: (insight: Insight) => void;
  onEdit: (insight: Insight) => void;
  onDelete: (id: string) => void;
}) {
  const liked   = insight.isLikedByMe;
  const timeAgo = formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true });
  const isOwner = currentUserId && String(insight.user?._id) === String(currentUserId);

  return (
    <Card className="card-clinical flex flex-col p-0 shadow-none hover:border-primary/30 transition">
      <CardContent className="p-5 flex-1 flex flex-col">
        {/* Author */}
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-9 w-9 bg-secondary shrink-0">
            <AvatarFallback className="text-sm font-bold">
              {insight.user?.name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">
                {insight.user?.name ?? "Anonymous"}
              </span>
              <Badge
                variant="outline"
                className={
                  insight.sentiment === "bullish"
                    ? "badge-bullish border-0 text-[10px]"
                    : insight.sentiment === "bearish"
                    ? "badge-bearish border-0 text-[10px]"
                    : "bg-muted text-muted-foreground border-0 text-[10px]"
                }
              >
                {insight.sentiment}
              </Badge>
              {!insight.isPublic && (
                <Badge variant="outline" className="text-[10px] border-dashed">private</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(insight)}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                title="Edit insight"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-destructive"
                    title="Delete insight"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this insight?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove your insight on <strong>{insight.symbol}</strong> and all its comments. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(insight._id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Symbol + body */}
        <div className="mb-1">
          <span className="font-heading text-sm font-bold">{insight.symbol}</span>
          {insight.company && (
            <span className="ml-2 text-xs text-muted-foreground">{insight.company}</span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4 flex-1">
          {insight.text}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLike(insight._id)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition hover:bg-secondary ${
                liked ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-primary" : ""}`} />
              {insight.likes}
            </button>

            <button
              onClick={() => onComment(insight)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {insight.commentCount ?? 0}
            </button>
          </div>

          <button
            onClick={() => shareInsight(insight)}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            title="Share insight"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function InsightsClient() {
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabOption>("community");

  // Community feed state
  const [insights, setInsights]   = useState<Insight[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [sort, setSort]           = useState<SortOption>("latest");

  // My posts state
  const [myInsights, setMyInsights]   = useState<Insight[]>([]);
  const [myLoading, setMyLoading]     = useState(false);
  const [myTotal, setMyTotal]         = useState(0);
  const [myPage, setMyPage]           = useState(1);
  const [myPages, setMyPages]         = useState(1);

  // Comment sheet
  const [commentInsight, setCommentInsight]   = useState<Insight | null>(null);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);

  // Edit dialog
  const [editInsight, setEditInsight] = useState<Insight | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Post dialog
  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [newSymbol, setNewSymbol]         = useState("");
  const [newText, setNewText]             = useState("");
  const [newSentiment, setNewSentiment]   = useState<"bullish" | "bearish" | "neutral">("bullish");
  const [isPublic, setIsPublic]           = useState(true);

  // ── Fetch community feed ──────────────────────────────────────────────────
  const fetchInsights = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await insightsAPI.getInsights({ page: pageNum, limit: 12, sort });
      const normalized = res.insights.map((ins) => ({ ...ins, isLikedByMe: ins.isLikedByMe === true }));
      setInsights(normalized);
      setTotal(res.total);
      setPages(res.pages);
      setPage(res.page);
    } catch {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    setInsights([]);
    fetchInsights(1);
  }, [fetchInsights, user?.id]);

  // ── Fetch my posts ────────────────────────────────────────────────────────
  const fetchMyInsights = useCallback(async (pageNum: number) => {
    try {
      setMyLoading(true);
      const res = await insightsAPI.getMyInsights({ page: pageNum, limit: 12 });
      setMyInsights(res.insights.map((ins) => ({ ...ins, isLikedByMe: ins.isLikedByMe === true })));
      setMyTotal(res.total);
      setMyPages(res.pages);
      setMyPage(res.page);
    } catch {
      toast.error("Failed to load your insights");
    } finally {
      setMyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "mine") fetchMyInsights(1);
  }, [activeTab, fetchMyInsights]);

  // ── Post new insight ──────────────────────────────────────────────────────
  const handlePostInsight = async () => {
    if (!newSymbol || !newText) { toast.error("Please fill in symbol and insight text"); return; }
    try {
      const created = await insightsAPI.createInsight({ symbol: newSymbol, text: newText, sentiment: newSentiment, isPublic });
      toast.success("Insight posted!");
      setIsDialogOpen(false);
      setNewSymbol(""); setNewText(""); setNewSentiment("bullish");
      // Optimistic prepend + background sync
      setInsights((prev) => [{ ...created, isLikedByMe: false }, ...prev]);
      setTotal((prev) => prev + 1);
      await fetchInsights(1);
      // Also refresh My Posts if user is on that tab or has already loaded it
      setMyInsights((prev) => [{ ...created, isLikedByMe: false }, ...prev]);
      setMyTotal((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post insight");
    }
  };

  // ── Like ──────────────────────────────────────────────────────────────────
  const applyLikeOptimistic = (list: Insight[], id: string): Insight[] =>
    list.map((ins) => {
      if (ins._id !== id) return ins;
      return { ...ins, likes: ins.isLikedByMe ? ins.likes - 1 : ins.likes + 1, isLikedByMe: !ins.isLikedByMe };
    });

  const handleLike = async (id: string) => {
    if (!user) { toast.error("Log in to like insights"); return; }
    setInsights((prev) => applyLikeOptimistic(prev, id));
    setMyInsights((prev) => applyLikeOptimistic(prev, id));
    try {
      const res = await insightsAPI.toggleLike(id);
      const syncLike = (list: Insight[]) =>
        list.map((ins) => ins._id !== id ? ins : { ...ins, likes: res.likes, isLikedByMe: res.liked === true });
      setInsights(syncLike);
      setMyInsights(syncLike);
    } catch {
      fetchInsights(page);
      toast.error("Failed to like insight");
    }
  };

  // ── Comment count sync ────────────────────────────────────────────────────
  const handleCountChanged = (insightId: string, delta: number) => {
    const bump = (list: Insight[]) =>
      list.map((ins) =>
        ins._id === insightId ? { ...ins, commentCount: Math.max(0, (ins.commentCount ?? 0) + delta) } : ins
      );
    setInsights(bump);
    setMyInsights(bump);
    setCommentInsight((prev) =>
      prev?._id === insightId ? { ...prev, commentCount: Math.max(0, (prev.commentCount ?? 0) + delta) } : prev
    );
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleOpenEdit = (insight: Insight) => {
    setEditInsight(insight);
    setEditDialogOpen(true);
  };

  const handleUpdated = (updated: Insight) => {
    const sync = (list: Insight[]) =>
      list.map((ins) => ins._id === updated._id ? { ...ins, ...updated } : ins);
    setInsights(sync);
    setMyInsights(sync);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await insightsAPI.deleteInsight(id);
      setInsights((prev) => prev.filter((ins) => ins._id !== id));
      setMyInsights((prev) => prev.filter((ins) => ins._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setMyTotal((prev) => Math.max(0, prev - 1));
      toast.success("Insight deleted");
    } catch {
      toast.error("Failed to delete insight");
    }
  };

  // ── Shared card grid ──────────────────────────────────────────────────────
  const renderGrid = (list: Insight[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-clinical h-44 animate-pulse bg-secondary/40" />
          ))}
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="card-clinical text-center py-16">
          <p className="text-sm text-muted-foreground">
            {activeTab === "mine" ? "You haven't posted any insights yet." : "No insights yet. Be the first to post!"}
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((insight) => (
          <InsightCard
            key={insight._id}
            insight={insight}
            currentUserId={user?.id}
            onLike={handleLike}
            onComment={(ins) => { setCommentInsight(ins); setCommentSheetOpen(true); }}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <AuthGuard
      require="user"
      featureName="Insights"
      featureDesc="Sign in to read community analysis, share your own thesis, and engage with other NEPSE investors."
    >
      <>
      {/* Top bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Community analysis across NEPSE listed companies.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Sort (community only) */}
          {activeTab === "community" && (
            <div className="flex gap-1">
              {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSort(value)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    sort === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
          )}

          {/* Post */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Post Insight
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Post New Insight</DialogTitle>
                <DialogDescription>
                  Share your market analysis with the NepseSagecommunity.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g. NICA"
                    className="uppercase"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Sentiment</Label>
                  <div className="flex gap-2">
                    {(["bullish", "neutral", "bearish"] as const).map((s) => (
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
                  <Textarea
                    id="insight"
                    placeholder="Type your analysis here…"
                    className="h-24 resize-none"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    maxLength={1000}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{newText.length}/1000</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                  <Label htmlFor="public" className="font-normal cursor-pointer">
                    Post publicly to all users
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full" onClick={handlePostInsight}>Submit Insight</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        <button
          onClick={() => setActiveTab("community")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
            activeTab === "community"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Community
          <span className="text-xs text-muted-foreground">{total}</span>
        </button>
        <button
          onClick={() => setActiveTab("mine")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
            activeTab === "mine"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookUser className="h-3.5 w-3.5" />
          My Posts
          {myTotal > 0 && (
            <span className="text-xs text-muted-foreground">{myTotal}</span>
          )}
        </button>
      </div>

      {/* Community tab */}
      {activeTab === "community" && (
        <>
          {renderGrid(insights, loading)}
          {pages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && fetchInsights(page - 1)}
                      className={`cursor-pointer hover:bg-secondary ${page === 1 ? "opacity-50 pointer-events-none" : ""}`}
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
                      className={`cursor-pointer hover:bg-secondary ${page === pages ? "opacity-50 pointer-events-none" : ""}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* My Posts tab */}
      {activeTab === "mine" && (
        <>
          {renderGrid(myInsights, myLoading)}
          {myPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => myPage > 1 && fetchMyInsights(myPage - 1)}
                      className={`cursor-pointer hover:bg-secondary ${myPage === 1 ? "opacity-50 pointer-events-none" : ""}`}
                    />
                  </PaginationItem>
                  {[...Array(myPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => fetchMyInsights(i + 1)}
                        isActive={myPage === i + 1}
                        className={`cursor-pointer ${myPage === i + 1 ? "bg-primary/10 border-primary text-primary" : "hover:bg-secondary"}`}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => myPage < myPages && fetchMyInsights(myPage + 1)}
                      className={`cursor-pointer hover:bg-secondary ${myPage === myPages ? "opacity-50 pointer-events-none" : ""}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <EditInsightDialog
        insight={editInsight}
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setEditInsight(null); }}
        onUpdated={handleUpdated}
      />

      {/* Comment Sheet */}
      <CommentSheet
        insight={commentInsight}
        open={commentSheetOpen}
        onClose={() => setCommentSheetOpen(false)}
        onCountChanged={handleCountChanged}
      />
    </>
    </AuthGuard>
  );
}
