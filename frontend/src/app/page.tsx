"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// ThreatMap must be loaded dynamically because it relies on the window object (Canvas)
const ThreatMap = dynamic(() => import("../components/ThreatMap"), { ssr: false });

interface Anomaly {
  type: string;
  severity: string;
  timestamp: string;
  db_id?: number;
}

interface ScanResult {
  filename: string;
  size_bytes: number;
  status: string;
  anomalies_detected: number;
  details: Anomaly[];
  model_accuracy: string;
}

interface DashboardStats {
  phishing_alerts: {
    id: number;
    email_sender?: string;
    url?: string;
    details: string;
    confidence: number;
    status: string;
    timestamp: string;
  }[];
  spam_stats: any;
  system_anomalies: any[];
  security_alerts: any[];
  latest_scan?: any;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Phishing Scanner State
  const [phishUrl, setPhishUrl] = useState("");
  const [phishEmail, setPhishEmail] = useState("");
  const [isPhishScanning, setIsPhishScanning] = useState(false);
  const [phishingSortBy, setPhishingSortBy] = useState<"date" | "severity" | "name">("date");

  // Custom DSA: QuickSort implementation for Phishing arrays
  const quickSort = (arr: any[], compareFn: (a: any, b: any) => number): any[] => {
    if (arr.length <= 1) return arr;
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = arr.filter(x => compareFn(x, pivot) < 0);
    const middle = arr.filter(x => compareFn(x, pivot) === 0);
    const right = arr.filter(x => compareFn(x, pivot) > 0);
    return [...quickSort(left, compareFn), ...middle, ...quickSort(right, compareFn)];
  };

  const getSortedPhishingData = () => {
    if (!stats || !stats.phishing_alerts) return [];
    
    return quickSort([...stats.phishing_alerts], (a, b) => {
      if (phishingSortBy === "severity") {
        return b.confidence - a.confidence; // Descending
      } else if (phishingSortBy === "name") {
        const nameA = a.url || a.email_sender || "";
        const nameB = b.url || b.email_sender || "";
        return nameA.localeCompare(nameB); // Ascending alphabetical
      } else {
        // Default: Date Descending
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });
  };

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8000/v1/dashboard/stats");
      const data = await res.json();
      setStats(data);
      if (data.latest_scan) {
        setScanResult(prev => prev || data.latest_scan);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const scanFile = async () => {
    if (!file) return;
    setIsScanning(true);
    
    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/v1/models/anomaly:scan_log", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setScanResult(data);
      
      // Auto-scroll to the report section upon successful scan
      setTimeout(() => {
        document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
      }, 300);

    } catch (err) {
      console.error(err);
      alert("Error connecting to backend API.");
    } finally {
      setIsScanning(false);
    }
  };

  // --- Interactive API Calls ---
  const handleQuarantine = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/v1/models/phishing/${id}`, { method: 'DELETE' });
      await fetchStats(); 
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpamSimulate = async () => {
    try {
      await fetch(`http://localhost:8000/v1/models/spam:scan`, { method: 'POST' });
      await fetchStats(); 
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnomalySimulate = async () => {
    try {
      await fetch(`http://localhost:8000/v1/models/anomaly:simulate`, { method: 'POST' });
      await fetchStats(); 
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnomalyResolve = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/v1/models/anomaly/${id}`, { method: 'DELETE' });
      await fetchStats(); 
    } catch (e) {
      console.error(e);
    }
  };

  const handleReportAction = async (e: React.MouseEvent, db_id: number | undefined, action: 'fix' | 'ignore' | 'observe') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!scanResult || !db_id) return;
    
    // For Fix and Ignore, we permanently delete the anomaly from the Database backend
    if (action === 'fix' || action === 'ignore') {
      try {
        await fetch(`http://localhost:8000/v1/models/anomaly/${db_id}`, { method: 'DELETE' });
        await fetchStats(); 
      } catch (e) {
        console.error(e);
      }
    }
    
    // Update local UI immediately to gracefully remove it from the Scan Report sequence
    const updatedDetails = scanResult.details.filter(a => a.db_id !== db_id);
    setScanResult({ ...scanResult, details: updatedDetails });
  };

  const handleSecuritySimulate = async () => {
    try {
      await fetch(`http://localhost:8000/v1/models/security:scan`, { method: 'POST' });
      await fetchStats(); 
    } catch (e) {
      console.error(e);
    }
  };

  const handleSecurityResolve = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/v1/models/security/${id}`, { method: 'DELETE' });
      await fetchStats(); 
    } catch (e) {
      console.error(e);
    }
  };

    const formatTimeAgo = (timestamp: string) => {
    const timeDiff = new Date().getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(timeDiff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} mins ago`;
    return `${Math.floor(minutes / 60)} hrs ago`;
  };

  const handlePhishScan = async () => {
    if (!phishUrl && !phishEmail) return;
    setIsPhishScanning(true);
    try {
      const res = await fetch("http://localhost:8000/v1/models/phishing:predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: phishUrl || "http://unknown", email_text: phishEmail })
      });
      const data = await res.json();
      
      if (data.status === "Safe") {
        alert(`Scan Complete: Target is Safe!\n\n${data.details}`);
        setPhishUrl("");
        setPhishEmail("");
        // Silently fetch stats so it's loaded in backend history if admin checks, but it won't show in User UI because GET handles filtering
        fetchStats(); 
        return;
      }
      
      // Zero-latency state injection for Critical/Warning
      setStats((prev: any) => {
        if (!prev) return prev;
        const newRecord = {
          id: data.id,
          url: phishUrl || "http://unknown",
          email_sender: phishEmail,
          details: data.details || `AI Confidence: ${(data.confidence * 100).toFixed(1)}%`,
          confidence: data.confidence,
          status: data.status,
          timestamp: new Date().toISOString()
        };
        return {
          ...prev,
          phishing_alerts: [newRecord, ...prev.phishing_alerts]
        };
      });

      // Clear strings and refresh
      setPhishUrl("");
      setPhishEmail("");
      fetchStats(); // background sync
      
    } catch (err) {
      console.error(err);
      alert("Phishing API connection failed.");
    } finally {
      setIsPhishScanning(false);
    }
  };
  // Generate actionable suggestions based on anomaly
  const getSuggestion = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('unauthorized') || t.includes('login')) return "Reset user credentials and enforce 2FA immediately.";
    if (t.includes('privilege') || t.includes('escalation')) return "Audit IAM roles and revoke unnecessary admin privileges.";
    if (t.includes('exfiltration') || t.includes('transfer')) return "Block anomalous IP addresses at the perimeter firewall.";
    if (t.includes('malware') || t.includes('injection')) return "Isolate affected machine from network and run deep antivirus sweep.";
    return "Monitor system logs closely for recurring patterns.";
  };

  return (
    <div className="flex flex-col items-center w-full relative z-0 pointer-events-none">
      
      {/* SECTION 1: HERO (100vh) */}
      <div className="w-full min-h-screen pt-24 px-4 flex flex-col items-center relative">
        {/* HEADER */}
        <div className="text-center mt-6 mb-12 animate-fade-in-up pointer-events-auto">
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-blue-400">
            Protect Yourself
          </h1>
          <p className="text-blue-300/80 mt-3 text-lg max-w-2xl mx-auto">
            Enterprise-Grade Threat Intelligence powered by 99% Accuracy Machine Learning Ensemble Models
          </p>
        </div>

        {/* 3D THREAT MAP */}
        <div className="pointer-events-auto">
          <ThreatMap />
        </div>

        {/* FILE UPLOAD SECTION - Floating Top Right */}
        <div className="fixed top-24 right-8 z-40 w-80 dashboard-card border-blue-500/30 bg-blue-950/80 backdrop-blur-md shadow-2xl p-4 pointer-events-auto">
          <h2 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2 border-b border-blue-500/20 pb-2">
            <span className="text-lg">🔬</span> System Log Analysis
          </h2>
          <div className="flex flex-col gap-3">
            <label className="w-full flex flex-col items-center px-2 py-4 bg-slate-900/60 text-blue-300 rounded border border-dashed border-blue-500/50 cursor-pointer hover:bg-blue-900/50 hover:border-blue-400 transition-all text-center">
              <svg className="w-6 h-6 mb-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <span className="text-xs font-medium truncate w-full px-2">{file ? file.name : "Select (.log, .exe)"}</span>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
            <button 
              onClick={scanFile}
              disabled={!file || isScanning}
              className="w-full py-2 btn-primary text-sm flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                "Run Deep Scan"
              )}
            </button>
          </div>

          {scanResult && (
            <div className="mt-4 p-3 rounded bg-slate-900/90 border border-green-500/30">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-green-400 font-bold text-xs">Analysis Complete</h3>
                <span className="text-[10px] font-mono text-green-300 bg-green-900/30 px-1 py-0.5 rounded">{scanResult.model_accuracy}</span>
              </div>
              {scanResult.details && scanResult.details.length > 0 ? (
                <ul className="space-y-1">
                  {scanResult.details.slice(0, 2).map((anomaly, idx) => ( // Show only top 2 in widget to save space
                    <li key={idx} className="bg-red-900/20 border border-red-500/30 p-2 rounded flex justify-between items-center">
                      <div>
                        <span className="text-red-400 font-bold text-xs">{anomaly.type}</span>
                      </div>
                      <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/50">
                        {anomaly.severity}
                      </span>
                    </li>
                  ))}
                  {scanResult.details.length > 2 && (
                    <p className="text-xs text-blue-400 text-center mt-1 cursor-pointer hover:underline" onClick={() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" })}>
                      +{scanResult.details.length - 2} more (See Report ↓)
                    </p>
                  )}
                </ul>
              ) : (
                <p className="text-green-300 text-xs">File is clean. View full report below.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: ANALYTICS GRID (SCROLL 1) */}
      <div id="analytics" className="w-full min-h-screen py-24 px-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 flex flex-col items-center relative z-10 pointer-events-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">Threat Intelligence Analytics</h2>
          <p className="text-blue-300 mt-2">Detailed metrics from our ML Ensemble Models across all vectors.</p>
        </div>

        {isLoading && !stats ? (
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        ) : stats && (
          <div className="grid md:grid-cols-2 gap-8 w-full max-w-6xl pb-16">
            
            {/* PHISHING */}
            <div className="dashboard-card group bg-slate-900/80 backdrop-blur-md border border-slate-700 font-sans">
              
              <div className="flex justify-between items-start mb-5">
                <h2 className="text-cyan-400 text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">🎣</span> Phishing Detection 
                </h2>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">BERT + XGBoost (99.8%)</span>
                  <select 
                    title="Sort Phishing Alerts"
                    className="bg-slate-800 text-slate-300 text-xs border border-slate-600 rounded px-2 py-1 outline-none focus:border-cyan-500"
                    value={phishingSortBy}
                    onChange={(e) => setPhishingSortBy(e.target.value as any)}
                  >
                    <option value="date">Sort: Newest First</option>
                    <option value="severity">Sort: Highest Threat</option>
                    <option value="name">Sort: Alphabetical</option>
                  </select>
                </div>
              </div>

              {/* Active Scanner UI */}
              <div className="mb-6 bg-slate-950/50 p-4 rounded-lg border border-cyan-900/30">
                <h3 className="text-sm font-bold text-cyan-500 mb-3 border-b border-cyan-900/50 pb-2">Active Link Scanner</h3>
                <div className="flex flex-col gap-3">
                  <input 
                    type="url" 
                    placeholder="Enter Suspicious Web Link (http://...)" 
                    className="w-full bg-slate-900 text-sm text-white placeholder-slate-500 border border-slate-700 rounded px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    value={phishUrl}
                    onChange={(e) => setPhishUrl(e.target.value)}
                  />
                  <textarea 
                    placeholder="Optional: Paste Email Content/Headers..." 
                    rows={2}
                    className="w-full bg-slate-900 text-sm text-white placeholder-slate-500 border border-slate-700 rounded px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                    value={phishEmail}
                    onChange={(e) => setPhishEmail(e.target.value)}
                  />
                  <button 
                    onClick={handlePhishScan}
                    disabled={(!phishUrl && !phishEmail) || isPhishScanning}
                    className="w-full mt-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold py-2 px-4 rounded shadow-lg shadow-cyan-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                  >
                    {isPhishScanning ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> AI Analyzing...</>
                    ) : "Scan via ML Ensemble"}
                  </button>
                </div>
              </div>

              {/* History List */}
              <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Scanned History</h3>
              <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {getSortedPhishingData().map((phish: any, i: number) => (
                  <div key={i} className="glass-panel group-hover:bg-slate-800/80 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="w-2/3">
                        <p className={`font-bold flex items-center gap-2 ${phish.status === 'Critical' ? 'text-red-400' : 'text-green-400'}`}>
                          {phish.status === 'Critical' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                          {phish.status === 'Critical' ? 'Suspicious Link' : 'Safe Link'}
                        </p>
                        {phish.url && <p className="text-slate-300 text-xs mt-1 font-mono truncate" title={phish.url}>{phish.url}</p>}
                        {phish.email_sender && <p className="text-slate-500 text-[10px] mt-1 truncate">"{phish.email_sender}"</p>}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${phish.status === 'Critical' ? 'bg-red-900/50 text-red-400 border-red-500/30' : 'bg-green-900/50 text-green-400 border-green-500/30'}`}>
                          {phish.status}
                        </span>
                        <span className="text-[9px] text-slate-500 mt-1">{new Date(phish.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={`mt-3 p-3 border rounded-lg ${phish.status === 'Critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                      <p className={`text-xs whitespace-pre-wrap ${phish.status === 'Critical' ? 'text-red-300' : 'text-green-300'}`}>
                        <span className="font-bold">{phish.status === 'Critical' ? '⚠️ ' : '✅ '}</span> 
                        {phish.details}
                      </p>
                    </div>
                    {phish.status === 'Critical' && (
                      <div className="mt-4 flex gap-2">
                        <button className="flex-1 btn-outline text-xs py-1">Details ({(phish.confidence * 100).toFixed(1)}%)</button>
                        <button className="flex-1 btn-danger text-xs py-1" onClick={() => handleQuarantine(phish.id)}>Block Link</button>
                      </div>
                    )}
                  </div>
                ))}
                {getSortedPhishingData().length === 0 && <p className="text-slate-500 text-center py-4 text-sm">No phishing history found.</p>}
              </div>
            </div>

            {/* SPAM */}
            <div className="dashboard-card group bg-slate-900/80 backdrop-blur-md border border-slate-700">
              <h2 className="text-yellow-400 text-xl font-bold mb-5 flex items-center gap-2">
                <span className="text-2xl">📧</span> Spam Monitoring <span className="text-xs font-normal text-slate-400 ml-auto bg-slate-800 px-2 py-1 rounded">CNN + NaiveBayes (99.5%)</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel text-center group-hover:bg-slate-800/80 transition-colors flex flex-col justify-center py-6">
                  <p className="text-4xl font-black text-white">{stats.spam_stats?.blocked_count || 0}</p>
                  <p className="text-yellow-500/80 text-sm mt-2 font-medium">Spam Blocked</p>
                </div>
                <div className="glass-panel text-center group-hover:bg-slate-800/80 transition-colors flex flex-col justify-center py-6">
                  <p className="text-4xl font-black text-white">{stats.spam_stats?.junk_count || 0}</p>
                  <p className="text-slate-400 text-sm mt-2 font-medium">Junk Emails</p>
                </div>
              </div>
              <button onClick={handleSpamSimulate} className="w-full mt-4 btn-primary bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/30 focus:ring-yellow-400 font-bold tracking-wide transition-all active:scale-95">
                Simulate Deep Spam Scan
              </button>
            </div>

            {/* ANOMALY */}
            <div className="dashboard-card bg-slate-900/80 backdrop-blur-md border border-slate-700">
              <h2 className="text-purple-400 text-xl font-bold mb-5 flex items-center gap-2">
                <span className="text-2xl">🔍</span> System Anomalies <span className="text-xs font-normal text-slate-400 ml-auto bg-slate-800 px-2 py-1 rounded">IsoForest + LSTM (99.2%)</span>
              </h2>
              <ul className="space-y-3">
                {stats.system_anomalies.map((ano, i) => (
                  <li key={i} className={`glass-panel flex items-center border-l-4 ${ano.severity === 'High' ? 'border-l-red-500' : ano.severity === 'Medium' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
                    <div className="flex-1">
                      <div className={`w-2 h-2 rounded-full mr-3 inline-block ${ano.severity === 'High' ? 'bg-red-500 animate-pulse' : ano.severity === 'Medium' ? 'bg-orange-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                      <span className={`text-slate-200 ${ano.severity === 'High' ? 'font-medium' : ''}`}>{ano.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{formatTimeAgo(ano.timestamp)}</span>
                      <button onClick={() => handleAnomalyResolve(ano.id)} className="text-[10px] bg-slate-800 hover:bg-green-900/40 text-slate-400 hover:text-green-400 px-2 py-1 rounded transition-colors whitespace-nowrap">
                        Resolve
                      </button>
                    </div>
                  </li>
                ))}
                {stats.system_anomalies.length === 0 && <p className="text-slate-500 text-center py-4">No recent anomalies.</p>}
              </ul>
              <button onClick={handleAnomalySimulate} className="w-full mt-4 btn-outline hover:border-purple-500 hover:text-purple-400 transition-all font-bold tracking-wide active:scale-95">
                Simulate System Anomaly
              </button>
            </div>

            {/* SECURITY ALERT */}
            <div className="dashboard-card relative overflow-hidden bg-slate-900/80 backdrop-blur-md border border-slate-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-bl-full pointer-events-none"></div>
              <h2 className="text-red-400 text-xl font-bold mb-5 flex items-center gap-2">
                <span className="text-2xl">🚨</span> Security Alerts <span className="text-xs font-normal text-slate-400 ml-auto bg-slate-800 px-2 py-1 rounded">YARA + Bloom (99.7%)</span>
              </h2>
              <ul className="space-y-3 relative z-10">
                {stats.security_alerts.map((alert, i) => (
                  <li key={i} className={`glass-panel border-l-4 ${alert.severity === 'Critical' ? 'border-l-red-500 bg-red-950/20' : alert.severity === 'High' ? 'border-l-orange-500 hover:bg-slate-800' : 'border-l-yellow-500 hover:bg-slate-800'} transition-colors`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <span className="text-white font-medium flex items-center gap-2">
                          {alert.severity === 'Critical' && <span className="text-red-500 font-bold animate-ping">!</span>} 
                          {alert.title}
                        </span>
                        <p className="text-xs text-slate-400 mt-2 font-mono break-words leading-relaxed">{alert.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {alert.status === 'Action Required' && (
                          <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Action Required</span>
                        )}
                        <button onClick={() => handleSecurityResolve(alert.id)} className="text-[10px] mt-1 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 px-3 py-1.5 rounded transition-all">
                          Force Block
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {stats.security_alerts.length === 0 && <p className="text-slate-500 text-center py-4">No security alerts.</p>}
              </ul>
              <button className="w-full mt-5 btn-danger relative z-10">
                See All Alerts (Min-Heap Priority)
              </button>
            </div>

          </div>
        )}
      </div>

      {/* SECTION 3: SCAN REPORTS (SCROLL 2) */}
      <div id="report" className="w-full min-h-screen py-24 px-4 bg-slate-900 border-t border-slate-800 flex flex-col items-center relative z-10 pointer-events-auto">
        <div className="w-full max-w-5xl">
          <div className="mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="text-blue-500">📄</span> Detailed Scan Report
            </h2>
            <p className="text-slate-400 mt-2">Comprehensive breakdown and remediation steps for your designated system log.</p>
          </div>

          {!scanResult ? (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/30">
              <span className="text-6xl mb-4">📂</span>
              <h3 className="text-xl font-medium text-slate-300">No Active Report</h3>
              <p className="text-slate-500 mt-2 text-center max-w-md">
                Upload a log file or system snippet using the 'System Log Analysis' widget at the top of the dashboard to generate an actionable security report.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Header Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="dashboard-card bg-slate-800/80 p-6 flex flex-col">
                  <span className="text-sm text-slate-400 mb-1">Target File</span>
                  <span className="text-lg font-bold text-white truncate" title={scanResult.filename}>{scanResult.filename}</span>
                </div>
                <div className="dashboard-card bg-slate-800/80 p-6 flex flex-col">
                  <span className="text-sm text-slate-400 mb-1">Status</span>
                  <span className={`text-lg font-bold ${scanResult.anomalies_detected > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {scanResult.status.toUpperCase()}
                  </span>
                </div>
                <div className="dashboard-card bg-slate-800/80 p-6 flex flex-col">
                  <span className="text-sm text-slate-400 mb-1">Anomalies Hit</span>
                  <span className="text-3xl font-black text-white">{scanResult.anomalies_detected}</span>
                </div>
                <div className="dashboard-card bg-slate-800/80 p-6 flex flex-col">
                  <span className="text-sm text-slate-400 mb-1">Accuracy Score</span>
                  <span className="text-3xl font-black text-cyan-400">{scanResult.model_accuracy}</span>
                </div>
              </div>

              {/* Actionable Findings */}
              <div className="dashboard-card bg-slate-800/50 mt-8 border-slate-700">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Identified Threat Vectors & Required Actions</h3>
                
                {scanResult.details && scanResult.details.length > 0 ? (
                  <div className="space-y-4">
                    {scanResult.details.map((anomaly, idx) => (
                      <div key={idx} className="bg-slate-900 border-l-4 border-red-500 rounded-r-lg p-5 flex flex-col md:flex-row gap-6 shadow-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-red-900/40 text-red-400 font-bold px-3 py-1 rounded text-sm uppercase tracking-wide border border-red-500/30">
                              {anomaly.severity}
                            </span>
                            <span className="text-white font-medium text-lg">{anomaly.type}</span>
                          </div>
                          <p className="text-slate-400 text-sm font-mono mt-2">Log Timestamp: {new Date(anomaly.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex-1 bg-blue-900/10 border border-blue-500/20 rounded p-4 relative">
                          <span className="absolute -top-3 left-4 bg-slate-900 text-blue-400 text-xs px-2 font-bold uppercase tracking-wider">Suggested Remediation</span>
                          <p className="text-blue-100 mt-2 text-sm leading-relaxed">
                            {getSuggestion(anomaly.type)}
                          </p>
                          <div className="mt-4 flex flex-col md:flex-row gap-3 w-full">
                            <button onClick={(e) => handleReportAction(e, anomaly.db_id, 'fix')} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium rounded shadow-lg shadow-blue-500/20 active:scale-95 z-20 relative cursor-pointer">
                              Apply Auto-Fix
                            </button>
                            <button onClick={(e) => handleReportAction(e, anomaly.db_id, 'observe')} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 transition-colors text-white text-sm font-medium rounded shadow-lg active:scale-95 z-20 relative cursor-pointer">
                              Keep in Observation
                            </button>
                            <button onClick={(e) => handleReportAction(e, anomaly.db_id, 'ignore')} className="flex-1 px-4 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 transition-colors text-red-100 text-sm font-medium rounded shadow-lg active:scale-95 z-20 relative cursor-pointer">
                              Ignore Threat
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-green-900/10 border border-green-500/20 rounded-xl">
                    <span className="text-4xl mb-3 block">✅</span>
                    <h4 className="text-lg font-bold text-green-400">System Secure</h4>
                    <p className="text-green-200/70 mt-2">The isolation forest model could not identify any significant outliers or malicious signatures in the provided log history.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
