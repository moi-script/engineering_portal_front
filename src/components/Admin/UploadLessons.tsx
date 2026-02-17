import React, { useState, ChangeEvent, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Film, 
  Sparkles, 
  CheckCircle2, 
  X, 
  AlertCircle,
  FileIcon,
  Plus,
  Trash2,
  Settings,
  ShieldCheck,
  Clock
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   MATERIAL MINIMALISM DESIGN SYSTEM
   Palette: High-contrast Slate, Indigo, and Pure White
   ───────────────────────────────────────────────────────────── */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono&display=swap');

  :root {
    --m-bg: #f8fafc;
    --m-surface: #ffffff;
    --m-primary: #6366f1;
    --m-primary-hover: #4f46e5;
    --m-text: #0f172a;
    --m-text-muted: #64748b;
    --m-border: #e2e8f0;
    --m-error: #ef4444;
    --m-success: #10b981;
    --m-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --m-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --m-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --m-radius: 8px;
    --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background-color: var(--m-bg);
    color: var(--m-text);
    -webkit-font-smoothing: antialiased;
  }

  .upload-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: radial-gradient(circle at 0% 0%, #f1f5f9 0%, #f8fafc 100%);
  }

  /* ── Layout Container ─────────────────────────────────────── */
  .container {
    width: 100%;
    max-width: 900px;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 2rem;
    animation: slideUp 0.5s ease-out;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Main Card ────────────────────────────────────────────── */
  .main-card {
    background: var(--m-surface);
    border: 1px solid var(--m-border);
    border-radius: var(--m-radius);
    box-shadow: var(--m-shadow);
    overflow: hidden;
  }

  .card-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--m-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-leading {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 1px solid var(--m-border);
    background: white;
    color: var(--m-text-muted);
    cursor: pointer;
    transition: var(--transition);
    text-decoration: none;
  }

  .btn-icon:hover {
    background: var(--m-bg);
    color: var(--m-primary);
    border-color: var(--m-primary);
  }

  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--m-text);
  }

  /* ── Form Styling ─────────────────────────────────────────── */
  .card-content {
    padding: 2rem;
  }

  .form-group {
    margin-bottom: 2rem;
  }

  .label-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--m-text);
  }

  .input-material {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-family: inherit;
    border: 1px solid var(--m-border);
    border-radius: 6px;
    transition: var(--transition);
    background: var(--m-bg);
  }

  .input-material:focus {
    outline: none;
    border-color: var(--m-primary);
    background: white;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }

  /* ── Drop Zone ────────────────────────────────────────────── */
  .drop-zone {
    border: 2px dashed var(--m-border);
    border-radius: var(--m-radius);
    padding: 3rem 2rem;
    text-align: center;
    transition: var(--transition);
    background: #fafafa;
    cursor: pointer;
    position: relative;
  }

  .drop-zone:hover, .drop-zone.dragging {
    border-color: var(--m-primary);
    background: rgba(99, 102, 241, 0.02);
  }

  .drop-zone.has-file {
    border-style: solid;
    border-color: var(--m-success);
    background: white;
  }

  .upload-icon-wrapper {
    width: 48px;
    height: 48px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    box-shadow: var(--m-shadow-sm);
    color: var(--m-primary);
    border: 1px solid var(--m-border);
  }

  .drop-text-main {
    font-weight: 600;
    margin-bottom: 0.25rem;
    display: block;
  }

  .drop-text-sub {
    font-size: 0.875rem;
    color: var(--m-text-muted);
  }

  /* ── File List ────────────────────────────────────────────── */
  .file-preview {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border: 1px solid var(--m-border);
    border-radius: 6px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .file-info {
    flex: 1;
  }

  .file-name {
    font-size: 0.875rem;
    font-weight: 500;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .file-size {
    font-size: 0.75rem;
    color: var(--m-text-muted);
  }

  /* ── Sidebar ──────────────────────────────────────────────── */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .side-panel {
    background: var(--m-surface);
    border: 1px solid var(--m-border);
    border-radius: var(--m-radius);
    padding: 1.5rem;
  }

  .panel-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    color: var(--m-text-muted);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
    color: var(--m-text);
  }

  .meta-item:last-child { margin-bottom: 0; }

  .meta-icon {
    color: var(--m-primary);
  }

  /* ── Actions ──────────────────────────────────────────────── */
  .btn-primary {
    width: 100%;
    padding: 0.875rem;
    background: var(--m-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: var(--transition);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--m-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-outline {
    width: 100%;
    padding: 0.875rem;
    background: transparent;
    border: 1px solid var(--m-border);
    color: var(--m-text);
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 0.75rem;
    transition: var(--transition);
  }

  .btn-outline:hover {
    background: var(--m-bg);
  }

  /* ── Status Tags ──────────────────────────────────────────── */
  .tag {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    background: var(--m-bg);
    border: 1px solid var(--m-border);
  }

  .tag-success {
    background: #ecfdf5;
    color: #059669;
    border-color: #a7f3d0;
  }

  .loading-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: var(--m-primary);
    transition: width 0.3s ease;
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .container {
      grid-template-columns: 1fr;
    }
    .sidebar {
      order: 2;
    }
  }
`;

interface FileData {
  name: string;
  size: string;
  type: "pdf" | "video" | "unknown";
}

export default function MaterialUpload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<FileData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFile = (selectedFile: File) => {
    const type = selectedFile.type.includes("video") ? "video" : 
                 selectedFile.type.includes("pdf") ? "pdf" : "unknown";
    
    setFile({
      name: selectedFile.name,
      size: formatFileSize(selectedFile.size),
      type
    });
    setUploadProgress(0);
    setStatus("idle");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = () => {
    setStatus("uploading");
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setStatus("success");
      }
    }, 200);
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setStatus("idle");
    setUploadProgress(0);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="upload-wrapper">
        <div className="container">
          
          <main className="main-card">
            <header className="card-header">
              <div className="header-leading">
                <Link to="/admin" className="btn-icon">
                  <ArrowLeft size={18} />
                </Link>
                <h1 className="card-title">Upload Lesson Content</h1>
              </div>
              <div className="tag">v2.4 Draft</div>
            </header>

            <div className="card-content">
              {/* Title Input */}
              <div className="form-group">
                <div className="label-container">
                  <label htmlFor="lesson-title">Lesson Title</label>
                  {title.length > 0 && <span className="drop-text-sub">{title.length}/80</span>}
                </div>
                <input 
                  id="lesson-title"
                  className="input-material" 
                  placeholder="Enter a descriptive title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                />
              </div>

              {/* Enhanced Drop Zone */}
              <div className="form-group">
                <div className="label-container">
                  <label>Content Asset</label>
                  {file && <button onClick={() => setFile(null)} className="drop-text-sub" style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--m-error)'}}>Remove</button>}
                </div>

                {!file ? (
                  <div 
                    className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                      accept=".pdf,video/*"
                    />
                    <div className="upload-icon-wrapper">
                      <Upload size={20} />
                    </div>
                    <span className="drop-text-main">Click or drag file to upload</span>
                    <span className="drop-text-sub">Support for PDF and MP4 (Max 500MB)</span>
                  </div>
                ) : (
                  <div className={`drop-zone has-file`}>
                    <div className="file-preview">
                      <div className="upload-icon-wrapper" style={{margin: 0}}>
                        {file.type === 'video' ? <Film size={20}/> : <FileText size={20}/>}
                      </div>
                      <div className="file-info" style={{textAlign: 'left'}}>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{file.size} • Ready to process</span>
                      </div>
                      {status === 'success' && <CheckCircle2 size={20} color="var(--m-success)" />}
                    </div>
                    {status === 'uploading' && (
                      <div className="loading-bar" style={{ width: `${uploadProgress}%` }} />
                    )}
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div className="meta-item" style={{margin: 0}}>
                  <ShieldCheck size={14} className="meta-icon" />
                  <span className="drop-text-sub">Encrypted</span>
                </div>
                <div className="meta-item" style={{margin: 0}}>
                  <Clock size={14} className="meta-icon" />
                  <span className="drop-text-sub">Auto-save active</span>
                </div>
              </div>
            </div>
          </main>

          <aside className="sidebar">
            <div className="side-panel">
              <h2 className="panel-title">Publishing</h2>
              <button 
                className="btn-primary" 
                disabled={!file || !title || status === 'uploading'}
                onClick={handleUpload}
              >
                {status === 'uploading' ? 'Processing...' : status === 'success' ? 'Published' : 'Publish Now'}
                {status !== 'uploading' && <Sparkles size={16} />}
              </button>
              
              <button className="btn-outline" onClick={reset}>
                Save as Draft
              </button>
            </div>

            <div className="side-panel">
              <h2 className="panel-title">
                <Settings size={14} /> Requirements
              </h2>
              <div className="meta-item">
                <CheckCircle2 size={14} color={title ? "var(--m-success)" : "#ccc"} />
                <span style={{ color: title ? 'var(--m-text)' : 'var(--m-text-muted)' }}>Descriptive Title</span>
              </div>
              <div className="meta-item">
                <CheckCircle2 size={14} color={file ? "var(--m-success)" : "#ccc"} />
                <span style={{ color: file ? 'var(--m-text)' : 'var(--m-text-muted)' }}>Valid Resource File</span>
              </div>
              <div className="meta-item">
                <CheckCircle2 size={14} color="#ccc" />
                <span style={{ color: 'var(--m-text-muted)' }}>Thumbnail (Optional)</span>
              </div>
            </div>

            <div className="side-panel" style={{ background: 'var(--m-bg)', borderStyle: 'dashed' }}>
              <p className="drop-text-sub" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                By publishing, you agree to the Content Provider Terms and confirm you have rights to distribute this material.
              </p>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}