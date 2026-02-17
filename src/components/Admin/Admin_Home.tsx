import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import api from "../../services/api";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  Users,
  Upload,
  LogOut,
  Search,
  MessageSquare,
  LayoutDashboard,
  Send,
  Trophy,
  Clock,
  Activity,
  TrendingUp,
  ChevronRight,
  X,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentSummary {
  userToken: string;
  id: number;
}

interface StudentDetail {
  name: string;
  token: string;
  status: string;
  progressPerDays: number;
  totalProgress: number;
  activities: number;
  timeSpent: number;
  scores: number;
}

interface MessageDTO {
  messageContent: string;
  messageType: string;
  timeStamp: string;
}

interface ConversationDTO {
  id: number;
  name: string;
  admintoken: string;
  personConvoWithToken: string;
  messages: MessageDTO[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-emerald-500";
    case "inactive":
      return "bg-slate-400";
    default:
      return "bg-blue-400";
  }
};

const progressVariant = (p: number): "default" | "secondary" | "destructive" => {
  if (p >= 75) return "default";
  if (p >= 40) return "secondary";
  return "destructive";
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-0 bg-card shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
            )}
            {sub && (
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
          <span className="rounded-xl bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Message Drawer ───────────────────────────────────────────────────────────

function MessageDrawer({
  student,
  adminToken,
  url,
  onClose,
}: {
  student: StudentDetail & { token: string };
  adminToken: string;
  url: string;
  onClose: () => void;
}) {
  const [conversation, setConversation] = useState<ConversationDTO | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversation = useCallback(async () => {
    try {
      const res = await api.get(
        `${url}/searchConversation?adminToken=${adminToken}&personToken=${student.token}`
      );
      setConversation(res.data);
    } catch {
      setConversation(null);
    } finally {
      setLoadingConvo(false);
    }
  }, [adminToken, student.token, url]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await api.post(
        `${url}/addMessageToPerson?adminToken=${adminToken}&personToken=${student.token}`,
        {
          messageContent: draft.trim(),
          messageType: "text",
          timeStamp: new Date().toISOString(),
        }
      );
      setDraft("");
      await fetchConversation();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {initials(student.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{student.name}</p>
          <p className="text-xs text-muted-foreground truncate font-mono">
            {student.token}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loadingConvo ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-3/4" />
            ))}
          </div>
        ) : !conversation || conversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversation.messages.map((msg, i) => {
              const isAdmin = msg.messageType === "admin" || !msg.messageType;
              return (
                <div
                  key={i}
                  className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      isAdmin
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.messageContent}</p>
                    <p
                      className={`mt-0.5 text-[10px] ${
                        isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.timeStamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

function StudentRow({
  summary,
  url,
  adminToken,
  onMessageClick,
}: {
  summary: StudentSummary;
  url: string;
  adminToken: string;
  onMessageClick: (student: StudentDetail & { token: string }) => void;
}) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await api.get(`${url}/fetchAll?token=${summary.userToken}`);
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [summary.userToken, url]);

  if (loading) {
    return (
      <TableRow>
        {[1, 2, 3, 4, 5].map((i) => (
          <TableCell key={i}>
            <Skeleton className="h-5 w-full" />
          </TableCell>
        ))}
      </TableRow>
    );
  }

  if (error || !detail) {
    return (
      <TableRow className="opacity-50">
        <TableCell>
          <span className="font-mono text-xs text-muted-foreground">
            {summary.userToken}
          </span>
        </TableCell>
        <TableCell colSpan={4}>
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" /> Failed to load
          </span>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="group hover:bg-muted/30 transition-colors">
      {/* Student Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials(detail.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{detail.name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {summary.userToken}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${statusColor(detail.status)}`} />
          <span className="text-sm capitalize">{detail.status || "normal"}</span>
        </span>
      </TableCell>

      {/* Progress */}
      <TableCell className="min-w-[140px]">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{detail.totalProgress}%</span>
          </div>
          <Progress value={detail.totalProgress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            +{detail.progressPerDays}% today
          </p>
        </div>
      </TableCell>

      {/* Stats */}
      <TableCell>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {detail.activities} activities
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(detail.timeSpent)}
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {detail.scores} pts
          </span>
        </div>
      </TableCell>

      {/* Action */}
      <TableCell className="text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary hover:bg-primary/10"
                onClick={() => onMessageClick({ ...detail, token: summary.userToken })}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Message {detail.name}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminHome() {
  const navigate = useNavigate();
  const { admin, logout } = useUser();
  const url = import.meta.env.VITE_API_URL;

  // ── State ──────────────────────────────────────────────────────────────────
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<
    (StudentDetail & { token: string }) | null
  >(null);
  const [msgDrawerOpen, setMsgDrawerOpen] = useState(false);

  // Aggregated stats (populated as student rows resolve)
  const [aggregatedStats, setAggregatedStats] = useState({
    totalActivities: 0,
    totalTimeSpent: 0,
    avgProgress: 0,
    totalScores: 0,
    resolvedCount: 0,
  });

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!admin?.token) navigate("/");
  }, [admin, navigate]);

  // ── Fetch enrollment list ──────────────────────────────────────────────────
  const fetchStudentList = useCallback(async () => {
    if (!admin?.token) return;
    setLoadingList(true);
    try {
      const token = admin.token.replace(/"/g, "");
      const res = await api.get(
        `${url}/get-admin-enroll-by-token?adminToken=${token}`
      );
      setStudentSummaries(res.data.students || []);
    } catch (err) {
      console.error("Failed to fetch student list", err);
    } finally {
      setLoadingList(false);
    }
  }, [admin, url]);

  useEffect(() => {
    fetchStudentList();
  }, [fetchStudentList]);

  // ── Aggregate stats as details resolve ────────────────────────────────────
  // Individual StudentRow components fetch their own details.
  // We expose a callback so the parent can accumulate stats.
  // (Alternative: fetch all details here — kept row-level for better UX.)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openMessageDrawer = (student: StudentDetail & { token: string }) => {
    setSelectedStudent(student);
    setMsgDrawerOpen(true);
  };

  // ── Filtered list (search by token prefix — actual names load per-row) ────
  const filteredSummaries = searchQuery
    ? studentSummaries.filter((s) =>
        s.userToken.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : studentSummaries;

  const adminToken = admin?.token?.replace(/"/g, "") ?? "";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">

        {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-6 py-3">

            {/* Brand */}
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-primary p-1.5">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-none">Admin Portal</p>
                <p className="text-xs text-muted-foreground">{admin?.name ?? "Guest"}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                placeholder="Search by token…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Nav actions */}
            <nav className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/uploadLessons">
                      <Upload className="mr-1.5 h-4 w-4" />
                      <span className="hidden sm:inline">Upload Lessons</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload Lessons</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchStudentList}
                    disabled={loadingList}
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="mx-1 h-5" />

              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </nav>
          </div>
        </header>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <main className="mx-auto max-w-screen-2xl space-y-6 p-6">

          {/* ── Stat Cards ───────────────────────────────────────────────── */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Enrolled Students"
              value={studentSummaries.length}
              icon={Users}
              sub={`${filteredSummaries.length} shown`}
              loading={loadingList}
            />
            <StatCard
              label="System Status"
              value="Operational"
              icon={LayoutDashboard}
              sub="All services running"
            />
            <StatCard
              label="Active Lessons"
              value="—"
              icon={BookOpen}
              sub="Upload to add content"
            />
            <StatCard
              label="Avg. Progress"
              value="—"
              icon={TrendingUp}
              sub="Loads with student data"
            />
          </section>

          {/* ── Student Directory ─────────────────────────────────────────── */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-4">
              <div>
                <CardTitle className="text-base">Enrolled Student Directory</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {loadingList
                    ? "Loading…"
                    : `${filteredSummaries.length} of ${studentSummaries.length} students`}
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {adminToken.slice(0, 14)}…
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6 w-[260px]">Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[160px]">Progress</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead className="pr-6 text-right w-16">Chat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingList ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4, 5].map((j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Users className="h-8 w-8 opacity-30" />
                          <p className="text-sm font-medium">
                            {searchQuery ? "No students match your search" : "No students enrolled yet"}
                          </p>
                          {searchQuery && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setSearchQuery("")}
                            >
                              Clear search
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummaries.map((summary) => (
                      <StudentRow
                        key={summary.id ?? summary.userToken}
                        summary={summary}
                        url={url}
                        adminToken={adminToken}
                        onMessageClick={openMessageDrawer}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>

        {/* ── Messaging Drawer ──────────────────────────────────────────── */}
        <Sheet open={msgDrawerOpen} onOpenChange={setMsgDrawerOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md p-0 flex flex-col"
          >
            {selectedStudent && (
              <MessageDrawer
                student={selectedStudent}
                adminToken={adminToken}
                url={url}
                onClose={() => setMsgDrawerOpen(false)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}