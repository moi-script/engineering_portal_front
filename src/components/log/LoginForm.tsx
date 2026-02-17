import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, EyeOff, GraduationCap, User, ShieldCheck } from "lucide-react";

import { useUser } from "../../context/UserContext";
import api from "@/services/api";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const adminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  admintokens: z.string().min(1, "Token is required"),
});

const studentLoginSchema = z.object({
  token: z.string().min(1, "Your token is required"),
});

const studentRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  adminToken: z
    .string()
    .min(1, "Admin token is required to register"),
});

type AdminForm = z.infer<typeof adminSchema>;
type StudentLoginForm = z.infer<typeof studentLoginSchema>;
type StudentRegisterForm = z.infer<typeof studentRegisterSchema>;

// ─── Helper: SHA-256 token generator ─────────────────────────────────────────

async function generateHash(name: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(name + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.substring(0, 6);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginAdmin, loginUser } = useUser();

  const [isAdmin, setIsAdmin] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Separate status messages from the old alert() calls
  const [statusMsg, setStatusMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Three independent forms — keeps fields completely isolated per mode
  const adminForm = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: "", password: "", admintokens: "" },
  });

  const studentLoginForm = useForm<StudentLoginForm>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { token: "" },
  });

  const studentRegisterForm = useForm<StudentRegisterForm>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: { name: "", password: "", adminToken: "" },
  });

  // Reset everything when switching role / mode
  useEffect(() => {
    setStatusMsg(null);
    adminForm.reset();
    studentLoginForm.reset();
    studentRegisterForm.reset();
  }, [isAdmin, isLogin]);

  // ── Admin token auto-generate ──────────────────────────────────────────────
  const handleGenerateAdminToken = async () => {
    const { name, password } = adminForm.getValues();
    if (!name || !password) {
      setStatusMsg({ type: "error", text: "Enter name and password first to generate a token." });
      return;
    }
    const hash = await generateHash(name, password);
    adminForm.setValue("admintokens", hash);
  };

  // ── Student token auto-generate (for registration preview) ────────────────
  const handlePreviewStudentToken = async () => {
    const { name, password } = studentRegisterForm.getValues();
    if (!name || !password) {
      setStatusMsg({ type: "error", text: "Enter name and password first to preview your token." });
      return;
    }
    const hash = await generateHash(name, password);
    setStatusMsg({
      type: "success",
      text: `Your generated token will be: ${hash}  — save this to log in later.`,
    });
  };

  // ── ADMIN SUBMIT ───────────────────────────────────────────────────────────
  const onAdminSubmit = async (values: AdminForm) => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      if (isLogin) {
        // Admin login — verify token via GET /check-admin-credentials
        const response = await api.get(`/check-admin-credentials?token=${values.admintokens}`);
        if (response.data) {
          loginAdmin({ name: response.data.name, token: response.data.admintokens });
          navigate("/admin");
        }
      } else {
        // Admin register — POST /save-login-signIn_admin
        await api.post("/save-login-signIn_admin", {
          name: values.name,
          password: values.password,
          admintokens: values.admintokens,
        });
        setIsLogin(true);
        setStatusMsg({ type: "success", text: "Admin registered! Please sign in with your token." });
      }
    } catch (error: any) {
      const msg = error.response?.data || "Authentication failed. Check your credentials.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // ── STUDENT LOGIN SUBMIT ───────────────────────────────────────────────────
  const onStudentLoginSubmit = async (values: StudentLoginForm) => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      // Verify student token via GET /check-user-credentials
      const response = await api.get(`/check-user-credentials?token=${values.token}`);
      if (response.data) {
        // If your UserContext has loginUser, call it here:
        loginUser({ name: response.data.name, token: values.token });
        navigate("/user");
      }
    } catch (error: any) {
      const msg =
        error.response?.status === 404
          ? "No account found with that token. Please register first."
          : error.response?.data || "Login failed. Please try again.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // ── STUDENT REGISTER SUBMIT ────────────────────────────────────────────────
  const onStudentRegisterSubmit = async (values: StudentRegisterForm) => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      // Step 1 — Verify the admin token actually exists
      // GET /check-admin-credentials?token=<adminToken>
      let adminData: { name: string; admintokens: string };
      try {
        const adminCheck = await api.get(`/check-admin-credentials?token=${values.adminToken}`);
        adminData = adminCheck.data;
      } catch {
        setStatusMsg({
          type: "error",
          text: "Invalid admin token. Ask your admin for the correct token to enroll.",
        });
        setIsLoading(false);
        return;
      }

      // Step 2 — Generate a deterministic student token from name + password
      const studentToken = await generateHash(values.name, values.password);

      // Step 3 — Register the student via POST /save-login-signIn
      // The student is linked to the admin via admintokens
      await api.post("/save-login-signIn", {
        name: values.name,
        password: values.password,
        token: studentToken,           // unique student identifier
        admintokens: adminData.admintokens, // binds student to their admin
      });

      // Step 4 — Auto-enroll student under the admin via POST /add-student
      await api.post("/add-student", {
        adminToken: adminData.admintokens,
        userToken: studentToken,
      });

      setIsLogin(true);
      setStatusMsg({
        type: "success",
        text: `Account created! Your login token is: ${studentToken}  — copy it now, you'll need it to sign in.`,
      });
    } catch (error: any) {
      const status = error.response?.status;
      const msg =
        status === 409
          ? "An account with that name/password combination already exists."
          : error.response?.data || "Registration failed. Please try again.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #0f1117;
          background-image:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 90%, rgba(139, 92, 246, 0.06) 0%, transparent 55%);
          padding: 1.5rem;
        }

        .login-shell {
          display: flex;
          width: 100%;
          max-width: 950px;
          min-height: 620px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
        }

        .role-selector {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 2rem;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .role-btn {
          flex: 1;
          padding: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          background: transparent;
          border: none;
          cursor: pointer;
          z-index: 1;
          transition: color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .role-btn.active { color: #fff; }

        .role-slider {
          position: absolute;
          top: 4px;
          left: 4px;
          width: calc(50% - 4px);
          height: calc(100% - 8px);
          background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
          border-radius: 9px;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }

        .role-slider.user-active { transform: translateX(100%); }

        .login-left {
          display: none;
          position: relative;
          flex-direction: column;
          justify-content: flex-end;
          padding: 3.5rem;
          background-size: cover;
          background-position: center;
        }

        @media (min-width: 768px) { .login-left { display: flex; width: 45%; } }

        .login-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, rgba(15, 17, 23, 0.2) 0%, rgba(15, 17, 23, 0.95) 100%);
        }

        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          background-color: #141720;
          border-left: 1px solid rgba(255,255,255,0.06);
        }

        .login-form-wrap { width: 100%; max-width: 340px; }

        .field-input {
          width: 100%; height: 46px; padding: 0 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; color: #f1f2f6; outline: none;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }
        .field-input:focus { border-color: rgba(99, 102, 241, 0.5); }

        .btn-submit {
          width: 100%; height: 48px; margin-top: 1.5rem;
          border-radius: 12px; border: none;
          background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
          color: #fff; font-weight: 600; cursor: pointer;
          font-size: 0.95rem;
          opacity: 1;
          transition: opacity 0.2s;
        }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          white-space: nowrap; padding: 0 1rem; border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          background: rgba(99, 102, 241, 0.1); color: #a5b4fc;
          font-size: 0.75rem; cursor: pointer; height: 46px;
          transition: background 0.2s;
        }
        .btn-secondary:hover { background: rgba(99, 102, 241, 0.2); }

        .switch-mode-text {
          text-align: center; margin-top: 1.5rem; font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
        }

        .switch-link {
          color: #a5b4fc; cursor: pointer; font-weight: 500; margin-left: 5px;
        }

        .status-banner {
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          margin-bottom: 1rem;
          line-height: 1.4;
          word-break: break-all;
        }
        .status-banner.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }
        .status-banner.success {
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.25);
          color: #6ee7b7;
        }

        .token-hint {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.3);
          margin-top: 4px;
        }

        .divider {
          text-align: center;
          color: rgba(255,255,255,0.2);
          font-size: 0.75rem;
          margin: 0.5rem 0 1rem;
          position: relative;
        }
        .divider::before, .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }
        .divider::before { left: 0; }
        .divider::after { right: 0; }
      `}</style>

      <div className="login-root">
        <div className="login-shell">

          {/* ── Left panel ── */}
          <div
            className="login-left"
            style={{
              backgroundImage: `url(${
                isAdmin
                  ? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070"
                  : "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070"
              })`,
            }}
          >
            <div className="login-left-overlay" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "rgba(99, 102, 241, 0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1rem",
              }}>
                {isAdmin ? <ShieldCheck color="#a5b4fc" /> : <GraduationCap color="#a5b4fc" />}
              </div>
              <h2 style={{ fontFamily: "DM Serif Display", fontSize: "2.2rem", color: "#fff", marginBottom: "0.5rem" }}>
                {isAdmin ? "Admin Control" : "Student Hub"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
                {isAdmin
                  ? "Manage curriculum and oversee system security."
                  : isLogin
                    ? "Sign in with your personal token to continue."
                    : "Enter the admin token your teacher shared to enroll."}
              </p>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="login-right">
            <div className="login-form-wrap">

              {/* Role toggle */}
              <div className="role-selector">
                <div className={`role-slider ${!isAdmin ? "user-active" : ""}`} />
                <button className={`role-btn ${isAdmin ? "active" : ""}`} onClick={() => { setIsAdmin(true); setIsLogin(true); }}>
                  <ShieldCheck size={16} /> Admin
                </button>
                <button className={`role-btn ${!isAdmin ? "active" : ""}`} onClick={() => { setIsAdmin(false); setIsLogin(true); }}>
                  <User size={16} /> Student
                </button>
              </div>

              {/* Header */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontFamily: "DM Serif Display", fontSize: "1.8rem", color: "#fff", marginBottom: 4 }}>
                  {isAdmin
                    ? isLogin ? "Admin Sign In" : "Register Admin"
                    : isLogin ? "Student Sign In" : "Create Account"}
                </h1>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                  {isAdmin
                    ? "Access the restricted management layer"
                    : isLogin
                      ? "Enter your unique token to access your account"
                      : "Join your admin's class by entering their token"}
                </p>
              </div>

              {/* Status banner */}
              {statusMsg && (
                <div className={`status-banner ${statusMsg.type}`}>
                  {statusMsg.text}
                </div>
              )}

              {/* ════════════════════════════════════
                  ADMIN FORM (login + register shared)
                  ════════════════════════════════════ */}
              {isAdmin && (
                <Form {...adminForm}>
                  <form onSubmit={adminForm.handleSubmit(onAdminSubmit)}>

                    <FormField
                      control={adminForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem style={{ marginBottom: "1rem" }}>
                          <FormLabel style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            Admin Username
                          </FormLabel>
                          <FormControl>
                            <input {...field} className="field-input" placeholder="admin_id" />
                          </FormControl>
                          <FormMessage style={{ color: "#f87171", fontSize: "0.7rem" }} />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adminForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem style={{ marginBottom: "1rem" }}>
                          <FormLabel style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            Password
                          </FormLabel>
                          <div style={{ position: "relative" }}>
                            <input {...field} type={showPassword ? "text" : "password"} className="field-input" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <FormMessage style={{ color: "#f87171", fontSize: "0.7rem" }} />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adminForm.control}
                      name="admintokens"
                      render={({ field }) => (
                        <FormItem style={{ marginBottom: "1rem" }}>
                          <FormLabel style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            Security Token
                          </FormLabel>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input {...field} className="field-input" placeholder="6-digit hash" />
                            <button type="button" onClick={handleGenerateAdminToken} className="btn-secondary">
                              Generate
                            </button>
                          </div>
                          <p className="token-hint">
                            {isLogin
                              ? "Enter the token you generated when you registered."
                              : "Click Generate to create your token from name + password."}
                          </p>
                          <FormMessage style={{ color: "#f87171", fontSize: "0.7rem" }} />
                        </FormItem>
                      )}
                    />

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                      {isLoading ? "Please wait…" : isLogin ? "Sign In" : "Register Now"}
                    </button>

                    <p className="switch-mode-text">
                      {isLogin ? "Need a new account?" : "Already registered?"}
                      <span className="switch-link" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Create Account" : "Log In"}
                      </span>
                    </p>
                  </form>
                </Form>
              )}

              {/* ════════════════════════════════════
                  STUDENT LOGIN FORM
                  ════════════════════════════════════ */}
              {!isAdmin && isLogin && (
                <Form {...studentLoginForm}>
                  <form onSubmit={studentLoginForm.handleSubmit(onStudentLoginSubmit)}>

                    <FormField
                      control={studentLoginForm.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem style={{ marginBottom: "1rem" }}>
                          <FormLabel style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            Your Student Token
                          </FormLabel>
                          <FormControl>
                            <input {...field} className="field-input" placeholder="e.g. a3f9c1" />
                          </FormControl>
                          <p className="token-hint">
                            This is the 6-character token shown when you registered.
                          </p>
                          <FormMessage style={{ color: "#f87171", fontSize: "0.7rem" }} />
                        </FormItem>
                      )}
                    />

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                      {isLoading ? "Checking…" : "Sign In"}
                    </button>

                    <p className="switch-mode-text">
                      No account yet?
                      <span className="switch-link" onClick={() => setIsLogin(false)}>
                        Create Account
                      </span>
                    </p>
                  </form>
                </Form>
              )}

              {/* ════════════════════════════════════
                  STUDENT REGISTER FORM
                  ════════════════════════════════════ */}
              {!isAdmin && !isLogin && (
                <Form {...studentRegisterForm}>
                  <form onSubmit={studentRegisterForm.handleSubmit(onStudentRegisterSubmit)}>

                    <FormField
                      control={studentRegisterForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem style={{ marginBottom: "1rem" }}>
                          <FormLabel style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <input {...field} className="field-input" placeholder="John Doe" />
                          </FormControl>
                          <FormMessage style={{ color: "#f87171", fontSize: "0.7rem" }} />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={studentRegisterForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem style={{ marginBottom: "1rem" }}>
                          <FormLabel style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            Password
                          </FormLabel>
                          <div style={{ position: "relative" }}>
                            <input {...field} type={showPassword ? "text" : "password"} className="field-input" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <FormMessage style={{ color: "#f87171", fontSize: "0.7rem" }} />
                        </FormItem>
                      )}
                    />

                    {/* Preview token button */}
                    <div style={{ marginBottom: "1rem" }}>
                      <button type="button" onClick={handlePreviewStudentToken} className="btn-secondary"
                        style={{ width: "100%", height: 38 }}>
                        Preview your login token
                      </button>
                      <p className="token-hint" style={{ marginTop: 6 }}>
                        Your token is generated from your name + password. Preview it now and save it — you'll need it to log in.
                      </p>
                    </div>

                    <div className="divider">enter your admin's token below</div>

                    <FormField
                      control={studentRegisterForm.control}
                      name="adminToken"
                      render={({ field }) => (
                        <FormItem style={{ marginBottom: "1rem" }}>
                          <FormLabel style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            Admin Token
                          </FormLabel>
                          <FormControl>
                            <input {...field} className="field-input" placeholder="Provided by your teacher" />
                          </FormControl>
                          <p className="token-hint">
                            Ask your admin / teacher for their 6-character token. This links your account to their class.
                          </p>
                          <FormMessage style={{ color: "#f87171", fontSize: "0.7rem" }} />
                        </FormItem>
                      )}
                    />

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                      {isLoading ? "Verifying & registering…" : "Create Account"}
                    </button>

                    <p className="switch-mode-text">
                      Already have an account?
                      <span className="switch-link" onClick={() => setIsLogin(true)}>
                        Log In
                      </span>
                    </p>
                  </form>
                </Form>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}