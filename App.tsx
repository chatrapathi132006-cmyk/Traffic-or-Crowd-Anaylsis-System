
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Alert, AnalysisResult, ZoneData } from './types';
import { analyzeFrame } from './services/geminiService';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'privacy'>('dashboard');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Use number for setInterval reference in browser environment instead of NodeJS.Timeout
  const analysisIntervalRef = useRef<number | null>(null);

  // Initialize camera
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: 1280, height: 720 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied or unavailable. Please enable permissions.");
      }
    };
    setupCamera();
  }, []);

  const performAnalysis = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isAnalyzing) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Privacy feature: Blur faces roughly before sending (simplified for demo)
    // Real implementation would use a local model for blurring before cloud processing
    // For now, we rely on Gemini's prompt to not ID individuals.

    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      const result = await analyzeFrame(base64Image);
      setHistory(prev => {
        const newHistory = [...prev, result];
        return newHistory.slice(-20); // Keep last 20 readings
      });

      // Generate alerts based on results
      if (result.riskScore > 75) {
        const newAlert: Alert = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          type: result.peopleCount > 10 ? 'OVERCROWDING' : 'CONGESTION',
          severity: result.riskScore > 90 ? 'CRITICAL' : 'WARNING',
          message: `${result.summary}. Prediction: ${result.prediction}`,
          zone: 'Primary Node A1'
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 10));
      }
    } catch (err) {
      console.error("Analysis loop error:", err);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    if (isAnalyzing) {
      // Fix: Use window.setInterval to explicitly use the browser's timer and avoid NodeJS namespace errors
      analysisIntervalRef.current = window.setInterval(performAnalysis, 5000);
    } else {
      if (analysisIntervalRef.current) {
        window.clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    }
    return () => {
      if (analysisIntervalRef.current) {
        window.clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isAnalyzing, performAnalysis]);

  const toggleAnalysis = () => setIsAnalyzing(!isAnalyzing);

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            OmniVision AI
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter font-semibold">Smart Traffic & Crowd OS</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="font-medium">Analytics Center</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative ${activeTab === 'alerts' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="font-medium">Incident Logs</span>
            {alerts.length > 0 && <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>

          <button 
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'privacy' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span className="font-medium">Privacy Compliance</span>
          </button>
        </nav>

        <div className="p-4">
           <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
             <div className="flex items-center justify-between mb-2">
               <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Live Engine</span>
               <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
             </div>
             <button 
              onClick={toggleAnalysis}
              className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${isAnalyzing ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'}`}
             >
               {isAnalyzing ? 'TERMINATE SESSION' : 'INITIALIZE ENGINE'}
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-900">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-[2px] bg-slate-700"></div>
            <h2 className="text-sm font-semibold text-slate-300">
              {activeTab === 'dashboard' ? 'Real-time System Dashboard' : activeTab === 'alerts' ? 'Active Alerts & Incident Response' : 'Privacy & Ethical Data Protocol'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleTimeString()}</span>
            <div className="flex space-x-2">
              <span className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-mono">LAT: 40.7128</span>
              <span className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-mono">LON: -74.0060</span>
            </div>
          </div>
        </header>

        {/* Dynamic Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Live Feed Component */}
                <div className="xl:col-span-1 space-y-4">
                  <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl group">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className={`w-full aspect-video object-cover transition-opacity duration-500 ${!isAnalyzing ? 'opacity-40 grayscale' : 'opacity-100'}`} 
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {!isAnalyzing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </div>
                          <p className="text-sm text-slate-400 font-medium">Feed Standby</p>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-4 left-4 flex space-x-2">
                       <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-mono border border-white/10">CAM_01_SEC_A</span>
                       <span className="px-2 py-1 bg-red-600/80 backdrop-blur-md rounded text-[10px] text-white font-bold animate-pulse">LIVE</span>
                    </div>

                    {isAnalyzing && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-xs font-medium tracking-wide">AI Vision Processor Active</span>
                          </div>
                          <span className="text-[10px] opacity-70">SENSING 4096p ...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {history.length > 0 && (
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Active Intelligence Summary</h4>
                      <p className="text-sm text-slate-200 leading-relaxed italic">
                        "{history[history.length-1].summary}"
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                         <span className="text-[11px] text-slate-400">Prediction Engine:</span>
                         <span className="text-[11px] text-blue-400 font-bold">{history[history.length-1].prediction}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="xl:col-span-2">
                  <Dashboard history={history} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">System Alerts History</h3>
                <div className="flex space-x-4">
                   <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs font-medium text-slate-300">Critical: {alerts.filter(a => a.severity === 'CRITICAL').length}</span>
                   </div>
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-3xl p-16 text-center">
                   <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                      <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <h4 className="text-slate-300 font-semibold mb-1">No active incidents</h4>
                   <p className="text-slate-500 text-sm">System environment is currently optimal</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-5 rounded-2xl border transition-all ${alert.severity === 'CRITICAL' ? 'bg-red-900/10 border-red-500/30' : 'bg-slate-800/80 border-slate-700'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex space-x-4">
                          <div className={`mt-1 p-2 rounded-lg ${alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${alert.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}`}>
                                {alert.type}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                              <span className="text-xs text-slate-400 font-medium">— {alert.zone}</span>
                            </div>
                            <p className="text-slate-200 font-medium leading-relaxed">{alert.message}</p>
                          </div>
                        </div>
                        <button className="text-slate-500 hover:text-white transition-colors">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-top-4 duration-500">
               <div className="bg-slate-800/40 p-10 rounded-[32px] border border-slate-700/50 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-8 border border-emerald-500/20">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h3 className="text-4xl font-bold text-white mb-6">Our Privacy Commitment</h3>
                  <p className="text-xl text-slate-400 leading-relaxed mb-10">
                    OmniVision AI is designed from the ground up for ethical urban monitoring. We leverage high-precision computer vision to improve city life while strictly adhering to privacy-by-design principles.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                          Anonymized Detection
                        </h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Our algorithms focus on aggregate flow and density. We do not use facial recognition, gait analysis, or any technique that could identify an individual.
                        </p>
                     </div>
                     <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                          No Metadata Retention
                        </h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          We store numerical metrics for historical analysis but do not retain any visual source data beyond the immediate processing window.
                        </p>
                     </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-700/50 flex items-center justify-between">
                     <span className="text-slate-500 text-xs font-mono">GDPR & CCPA COMPLIANT CORE v2.4</span>
                     <button className="text-blue-400 font-bold text-sm hover:underline">Download Ethics Whitepaper &rarr;</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
