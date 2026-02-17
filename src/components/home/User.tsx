import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Star,
  StickyNote,
  LogOut,
  Calculator as CalcIcon,
  BookOpen,
  Sun,
  Moon,
  BarChart2,
  ChevronRight,
} from "lucide-react";

import BarChart from "../BarCharts";
import { useUser } from "@/context/UserContext";
import api from "@/services/api";
import CalculatorTool from "@/components/tools/Calculator";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface UserStats {
  name?: string;
  activities?: number;
  timeSpent?: number;
  scores?: number;
  progressPerDays?: number;
  totalProgress?: number;
  status?: string;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function User() {
  const navigate = useNavigate();
  // ── FIX: also pull isLoading from context so we know when hydration is done
  const { user, logout, isLoading: contextLoading } = useUser();
  const [showCalculator, setShowCalculator] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);

  /* Fetch profile
   * ── FIX: Gate on contextLoading so we never try to use user.token before
   *    sessionStorage hydration is complete. Previously this fired immediately
   *    with user === null, hit the early-return, and never retried. Now the
   *    effect re-runs once contextLoading flips to false. */
  useEffect(() => {
    // Wait for context to finish hydrating
    if (contextLoading) return;

    // After hydration: if still no token, nothing to fetch
    if (!user?.token) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        // ── FIX: use the already-cleaned token from context (UserContext now
        //    strips quotes on login/hydration), but strip defensively anyway.
        const token = user.token.replace(/^"|"$/g, "").trim();
        const res = await api.get(`/fetchAll?token=${token}`);
        setUserStats(res.data);
      } catch (err) {
        console.error("Profile fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, contextLoading]); // ← re-run when context finishes loading

  /* Session timer */
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsedTime(Date.now() - start), 1000);
    return () => clearInterval(id);
  }, []);

  /* Scroll-aware nav */
  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Dark-mode class on <html> */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/user-progress", {
        ...userStats,
        timeSpent: (userStats.timeSpent || 0) + elapsedTime / 1000,
      });
    } catch {
      console.error("Failed to sync progress");
    }
    logout();
    navigate("/");
  }, [userStats, elapsedTime, logout, navigate]);

  const totalProg = userStats.totalProgress ?? 0;
  const dailyProg = userStats.progressPerDays ?? 0;

  // Show skeleton during context hydration OR profile fetch
  const showSkeleton = contextLoading || isLoading;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg:       #f5f5f7;
          --surface:  #ffffff;
          --surface2: #f0f0f3;
          --border:   rgba(0,0,0,0.08);
          --text:     #0d0d0d;
          --muted:    #666;
          --accent:   #6c47ff;
          --accent2:  #00c896;
          --accent3:  #ff6b6b;
          --shadow:   0 2px 24px rgba(0,0,0,0.07);
          --shadow-lg:0 8px 48px rgba(0,0,0,0.12);
          --radius:   20px;
          --nav-h:    72px;
        }
        .dark {
          --bg:       #0c0c0f;
          --surface:  #141418;
          --surface2: #1c1c22;
          --border:   rgba(255,255,255,0.07);
          --text:     #f0f0f0;
          --muted:    #888;
          --shadow:   0 2px 24px rgba(0,0,0,0.4);
          --shadow-lg:0 8px 48px rgba(0,0,0,0.6);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; }

        .ud-root {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          transition: background 0.3s, color 0.3s;
          padding-top: var(--nav-h);
        }

        .ud-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: var(--nav-h);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          transition: background 0.25s, box-shadow 0.25s, border-color 0.25s;
          background: transparent;
        }
        .ud-nav.scrolled {
          background: var(--surface);
          box-shadow: var(--shadow);
          border-bottom: 1px solid var(--border);
        }

        .ud-nav-brand { display: flex; align-items: center; gap: 12px; }
        .ud-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: var(--accent);
          display: grid; place-items: center;
          font-weight: 600;
          font-size: 14px;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: 0.5px;
        }
        .ud-greeting { font-weight: 500; font-size: 15px; line-height: 1.2; }
        .ud-greeting span {
          font-weight: 700;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── FIX: avatar and name skeleton while loading ── */
        .ud-avatar-skeleton {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .ud-name-skeleton {
          width: 90px; height: 16px;
          border-radius: 6px;
          background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .ud-nav-links { display: flex; align-items: center; gap: 4px; }
        .ud-link {
          background: none; border: none; cursor: pointer;
          padding: 8px 14px; border-radius: 10px;
          color: var(--muted); font-family: inherit; font-size: 14px; font-weight: 500;
          text-decoration: none; transition: background 0.18s, color 0.18s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ud-link:hover { background: var(--surface2); color: var(--text); }
        .ud-icon-btn {
          width: 36px; height: 36px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px; cursor: pointer;
          display: grid; place-items: center;
          color: var(--muted);
          transition: background 0.18s, color 0.18s;
        }
        .ud-icon-btn:hover { background: var(--accent); color: #fff; border-color: transparent; }
        .ud-logout {
          background: var(--accent3); color: #fff;
          border: none; padding: 8px 18px; border-radius: 10px;
          cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 6px;
          transition: opacity 0.18s, transform 0.18s; letter-spacing: 0.2px;
        }
        .ud-logout:hover { opacity: 0.88; transform: translateY(-1px); }

        .ud-page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          display: flex; flex-direction: column; gap: 32px;
        }

        .ud-hero {
          background: linear-gradient(135deg, var(--accent) 0%, #9f72ff 50%, var(--accent2) 100%);
          border-radius: var(--radius);
          padding: 48px 40px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          position: relative; overflow: hidden;
        }
        .ud-hero::before {
          content: ''; position: absolute; top: -60px; right: -60px;
          width: 300px; height: 300px; border-radius: 50%;
          background: rgba(255,255,255,0.07); pointer-events: none;
        }
        .ud-hero::after {
          content: ''; position: absolute; bottom: -80px; left: 40%;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(255,255,255,0.05); pointer-events: none;
        }
        .ud-hero-text h1 {
          font-size: clamp(24px, 3vw, 36px); font-weight: 700; color: #fff; line-height: 1.2;
        }
        .ud-hero-text p { margin-top: 8px; color: rgba(255,255,255,0.72); font-size: 14px; }
        .ud-hero-badge {
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
          border-radius: 20px; padding: 6px 16px; font-size: 13px; font-weight: 600;
          color: #fff; display: inline-flex; align-items: center; gap: 6px;
          margin-top: 16px; backdrop-filter: blur(8px);
        }
        .ud-hero-pulse {
          width: 8px; height: 8px; border-radius: 50%; background: #00ff9d;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,157,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(0,255,157,0); }
        }
        .ud-hero-timer { text-align: right; color: rgba(255,255,255,0.85); }
        .ud-hero-timer .val {
          font-family: 'DM Mono', monospace;
          font-size: clamp(28px, 3.5vw, 44px); font-weight: 500;
          letter-spacing: -1px; line-height: 1; color: #fff;
        }
        .ud-hero-timer .lbl {
          font-size: 12px; text-transform: uppercase;
          letter-spacing: 1.5px; color: rgba(255,255,255,0.55); margin-top: 4px;
        }

        .ud-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .ud-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }

        .ud-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ud-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

        .ud-stat { display: flex; align-items: center; gap: 18px; }
        .ud-stat-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .ud-stat-icon.purple { background: rgba(108,71,255,0.12); color: var(--accent); }
        .ud-stat-icon.green  { background: rgba(0,200,150,0.12);  color: var(--accent2); }
        .ud-stat-icon.red    { background: rgba(255,107,107,0.12); color: var(--accent3); }
        .ud-stat-info { display: flex; flex-direction: column; gap: 2px; }
        .ud-stat-label {
          font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
          color: var(--muted); font-weight: 500;
        }
        .ud-stat-val {
          font-size: 28px; font-weight: 700; line-height: 1;
          font-variant-numeric: tabular-nums; font-family: 'DM Mono', monospace;
        }

        .ud-progress-title {
          font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
          color: var(--muted); font-weight: 600; margin-bottom: 20px;
        }
        .ud-prog-row { display: flex; flex-direction: column; gap: 14px; }
        .ud-prog-item { display: flex; flex-direction: column; gap: 6px; }
        .ud-prog-meta { display: flex; justify-content: space-between; align-items: center; }
        .ud-prog-name { font-size: 13px; font-weight: 500; color: var(--text); }
        .ud-prog-pct { font-size: 13px; font-weight: 700; font-family: 'DM Mono', monospace; color: var(--accent); }
        .ud-bar-bg { height: 6px; border-radius: 99px; background: var(--surface2); overflow: hidden; }
        .ud-bar-fill { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(.4,0,.2,1); }
        .ud-bar-fill.purple { background: linear-gradient(90deg, var(--accent), #9f72ff); }
        .ud-bar-fill.green  { background: linear-gradient(90deg, var(--accent2), #00e6ab); }

        .ud-goals-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
        .ud-goal-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          border-radius: 12px; background: var(--surface2); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background 0.18s;
        }
        .ud-goal-item:hover { background: var(--border); }
        .ud-goal-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ud-goal-dot.done { background: var(--accent2); }
        .ud-goal-dot.todo { background: var(--border); border: 2px solid var(--muted); }
        .ud-goal-label { flex: 1; }
        .ud-goal-done-label { color: var(--muted); text-decoration: line-through; }
        .ud-goal-icon { color: var(--muted); }

        .ud-chart-title {
          font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
          color: var(--muted); font-weight: 600; margin-bottom: 16px;
        }
        .ud-chart-wrap { height: 220px; display: flex; align-items: flex-end; }

        .ud-skeleton {
          background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        .ud-calc-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
          z-index: 200; display: grid; place-items: center;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 640px) {
          .ud-nav { padding: 0 16px; }
          .ud-page { padding: 24px 12px 60px; gap: 20px; }
          .ud-hero { flex-direction: column; align-items: flex-start; padding: 32px 24px; }
          .ud-hero-timer { text-align: left; }
          .ud-nav-links .ud-link { display: none; }
          .ud-nav-links .ud-link.visible { display: inline-flex; }
        }
      `}</style>

      <div className="ud-root">
        {/* ── NAV ── */}
        <nav className={`ud-nav${navScrolled ? " scrolled" : ""}`}>
          <div className="ud-nav-brand">
            {/* ── FIX: show skeleton in nav while name is still loading ── */}
            {showSkeleton ? (
              <>
                <div className="ud-avatar-skeleton" />
                <div className="ud-name-skeleton" />
              </>
            ) : (
              <>
                <div className="ud-avatar">{getInitials(userStats.name)}</div>
                <div className="ud-greeting">
                  Hello, <span>{userStats.name || "Student"}</span>
                </div>
              </>
            )}
          </div>

          <div className="ud-nav-links">
            <Link to="/materials" className="ud-link">
              <BookOpen size={15} /> Study
            </Link>
            <button className="ud-link" onClick={() => setShowCalculator(true)}>
              <CalcIcon size={15} /> Calc
            </button>
            <Link to="/contacts" className="ud-link">Contact</Link>
            <button
              className="ud-icon-btn"
              onClick={() => setIsDark((d) => !d)}
              title={isDark ? "Switch to light" : "Switch to dark"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="ud-logout" onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </nav>

        {/* ── CALCULATOR MODAL ── */}
        {showCalculator && (
          <div className="ud-calc-overlay" onClick={() => setShowCalculator(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <CalculatorTool onClose={() => setShowCalculator(false)} />
            </div>
          </div>
        )}

        {/* ── PAGE BODY ── */}
        <main className="ud-page">
          {/* Hero */}
          <div className="ud-hero">
            <div className="ud-hero-text">
              <h1>Your Learning Dashboard</h1>
              <p>Track progress, hit goals, keep momentum.</p>
              <div className="ud-hero-badge">
                <span className="ud-hero-pulse" />
                {userStats.status === "active" ? "Active Session" : "Session Running"}
              </div>
            </div>
            <div className="ud-hero-timer">
              <div className="val">{formatTime(elapsedTime / 1000)}</div>
              <div className="lbl">Time this session</div>
            </div>
          </div>

          {/* Stat Row */}
          <div className="ud-grid-3">
            <StatCard
              icon={<StickyNote size={22} />}
              label="Activities"
              value={showSkeleton ? null : userStats.activities ?? 0}
              color="purple"
            />
            <StatCard
              icon={<Clock size={22} />}
              label="Total Time"
              value={showSkeleton ? null : formatTime(userStats.timeSpent ?? 0)}
              color="green"
            />
            <StatCard
              icon={<Star size={22} />}
              label="Score"
              value={showSkeleton ? null : userStats.scores ?? 0}
              color="red"
            />
          </div>

          {/* Middle Row: Progress + Goals */}
          <div className="ud-grid-2">
            <div className="ud-card">
              <div className="ud-progress-title">Overall Progress</div>
              <div className="ud-prog-row">
                <ProgressBar label="Total Progress" value={totalProg} max={100} color="purple" />
                <ProgressBar label="Today's Progress" value={dailyProg} max={20} color="green" />
              </div>
            </div>
            <div className="ud-card">
              <div className="ud-progress-title">
                <Calendar size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                Today's Goals
              </div>
              <div className="ud-goals-list">
                <GoalItem done label="Review Chapter 3" />
                <GoalItem done label="Complete Quiz #7" />
                <GoalItem label="Practice Problems (Set B)" />
                <GoalItem label="Watch lecture video" />
                <GoalItem label="Submit assignment" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="ud-card">
            <div className="ud-chart-title">
              <BarChart2 size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Weekly Activity
            </div>
            <div className="ud-chart-wrap">
              <BarChart mon={10} tue={20} wed={12} thu={11} fri={9} sat={16} sun={18} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  color: "purple" | "green" | "red";
}) {
  return (
    <div className="ud-card ud-stat">
      <div className={`ud-stat-icon ${color}`}>{icon}</div>
      <div className="ud-stat-info">
        <div className="ud-stat-label">{label}</div>
        {value === null ? (
          <div className="ud-skeleton" style={{ width: 80, height: 28, marginTop: 4 }} />
        ) : (
          <div className="ud-stat-val">{value}</div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  label, value, max, color,
}: {
  label: string;
  value: number;
  max: number;
  color: "purple" | "green";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="ud-prog-item">
      <div className="ud-prog-meta">
        <span className="ud-prog-name">{label}</span>
        <span className="ud-prog-pct">{pct}%</span>
      </div>
      <div className="ud-bar-bg">
        <div className={`ud-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function GoalItem({ done, label }: { done?: boolean; label: string }) {
  return (
    <div className="ud-goal-item">
      <div className={`ud-goal-dot ${done ? "done" : "todo"}`} />
      <span className={`ud-goal-label${done ? " ud-goal-done-label" : ""}`}>{label}</span>
      <ChevronRight size={14} className="ud-goal-icon" />
    </div>
  );
}