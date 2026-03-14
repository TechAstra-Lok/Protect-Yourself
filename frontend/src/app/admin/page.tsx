'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [dbData, setDbData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'protectadmin' && password === 'adminprotected') {
      setIsAuthenticated(true);
      setError('');
      fetchFullDatabase();
    } else {
      setError('Invalid admin credentials. Access Denied.');
    }
  };

  const fetchFullDatabase = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/v1/admin/db");
      const data = await res.json();
      setDbData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch database content.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-900/40 rounded-full blur-[120px]"></div>
        </div>
        
        <form onSubmit={handleLogin} className="glass-panel w-full max-w-md relative z-10 border border-slate-700 p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white text-center mb-2 tracking-wide uppercase">Admin Operations</h1>
          <p className="text-slate-400 text-sm text-center mb-8">Restricted Database Access Portal</p>
          
          {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 text-red-200 text-xs rounded animate-pulse">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Admin ID</label>
              <input 
                type="text" 
                value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded p-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm"
                placeholder="Enter System ID..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Passcode</label>
              <input 
                type="password" 
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded p-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                placeholder="••••••••••••"
                required
              />
            </div>
            <button type="submit" className="w-full mt-6 btn-danger uppercase tracking-widest font-bold py-3">
              Unlock Terminal
            </button>
            <div className="text-center mt-4">
              <Link href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">← Return to Public Dashboard</Link>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-8 text-white font-sans relative">
      <div className="max-w-[1400px] mx-auto relative z-10">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Master Database View</h1>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl">Connected directly to the backend SQLite matrix. All 5 primary tables are dumped directly for admin visibility and auditing.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchFullDatabase} className="btn-outline text-sm">↻ Refresh Database</button>
            <button onClick={() => setIsAuthenticated(false)} className="btn-danger text-sm">Lock Terminal</button>
            <Link href="/" className="btn-primary text-sm flex items-center">Main App ↗</Link>
          </div>
        </header>

        {isLoading || !dbData ? (
          <div className="flex flex-col items-center justify-center p-24">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-mono animate-pulse">Querying SQLite Core...</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Phishing Table */}
            <div className="dashboard-card bg-slate-900/50 border-slate-800">
              <h2 className="text-xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">Table: PhishingAlerts</h2>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Target URL</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Analyzed Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.phishing_alerts.map((row: any) => (
                      <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500">#{row.id}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${row.status === 'Critical' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>{row.status}</span></td>
                        <td className="px-4 py-3 text-blue-300 max-w-[200px] truncate" title={row.url}>{row.url || 'N/A'}</td>
                        <td className="px-4 py-3 font-mono">{(row.confidence * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-slate-300 max-w-[400px] truncate" title={row.details}>{row.details}</td>
                      </tr>
                    ))}
                    {dbData.phishing_alerts.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-600">No records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scan Report Table */}
            <div className="dashboard-card bg-slate-900/50 border-slate-800">
              <h2 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wider">Table: ScanReports</h2>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Filename</th>
                      <th className="px-4 py-3">Size (Bytes)</th>
                      <th className="px-4 py-3">Anomalies Hit</th>
                      <th className="px-4 py-3">Model Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.scan_reports.map((row: any) => (
                      <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500">#{row.id}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium">{row.filename}</td>
                        <td className="px-4 py-3 font-mono">{row.size_bytes.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`font-bold ${row.anomalies_detected > 0 ? 'text-red-400' : 'text-green-400'}`}>{row.anomalies_detected}</span></td>
                        <td className="px-4 py-3 font-mono">{row.model_accuracy}</td>
                      </tr>
                    ))}
                    {dbData.scan_reports.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-600">No records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spam Table */}
            <div className="dashboard-card bg-slate-900/50 border-slate-800">
              <h2 className="text-xl font-bold text-yellow-500 mb-4 uppercase tracking-wider">Table: SpamStats</h2>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3">Blocked Count</th>
                      <th className="px-4 py-3">Junk Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.spam_stats.map((row: any) => (
                      <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500">#{row.id}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 font-black text-white">{row.blocked_count}</td>
                        <td className="px-4 py-3 font-black text-slate-300">{row.junk_count}</td>
                      </tr>
                    ))}
                    {dbData.spam_stats.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-600">No records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Anomalies Table */}
            <div className="dashboard-card bg-slate-900/50 border-slate-800">
              <h2 className="text-xl font-bold text-purple-400 mb-4 uppercase tracking-wider">Table: SystemAnomalies</h2>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Threat Vector Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.system_anomalies.map((row: any) => (
                      <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500">#{row.id}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold bg-opacity-20 ${row.severity === 'High' ? 'text-red-400 bg-red-500' : 'text-orange-400 bg-orange-500'}`}>{row.severity}</span></td>
                        <td className="px-4 py-3 font-medium max-w-[400px] truncate" title={row.type}>{row.type}</td>
                      </tr>
                    ))}
                    {dbData.system_anomalies.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-600">No records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Security Alerts Table */}
            <div className="dashboard-card bg-slate-900/50 border-slate-800">
              <h2 className="text-xl font-bold text-red-500 mb-4 uppercase tracking-wider">Table: SecurityAlerts</h2>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Threat Signature</th>
                      <th className="px-4 py-3">Hash Mask</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.security_alerts.map((row: any) => (
                      <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500">#{row.id}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold bg-opacity-20 ${row.severity === 'Critical' ? 'text-red-500 bg-red-900 border border-red-500/50' : 'text-yellow-400 bg-yellow-900'}`}>{row.severity}</span></td>
                        <td className="px-4 py-3 text-xs uppercase text-slate-400 tracking-wide">{row.status}</td>
                        <td className="px-4 py-3 font-medium">{row.title}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.hash_match}</td>
                      </tr>
                    ))}
                    {dbData.security_alerts.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-600">No records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-[1] opacity-10 mix-blend-screen pointer-events-none">
          <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-cyan-900/30 rounded-full blur-[150px] animate-float"></div>
      </div>
    </div>
  );
}
