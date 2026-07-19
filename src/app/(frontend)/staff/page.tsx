'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Users, MapPin, Loader2, ArrowLeft, Activity, Thermometer, Bot, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getIoTState } from '@/utils/iotState';

import dynamic from 'next/dynamic';
import { AlertCard } from '@/components/staff/AlertCard';

const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
});

interface StadiumAlert {
  type: string;
  severity: string;
  title: string;
  description: string;
  action?: string;
  time?: string;
  location?: string;
}

interface StadiumNode {
  id: string;
  name: string;
  type: string;
  crowdDensity?: number;
  currentQueueTime?: number;
  wasteBinLevel?: number;
  offerings?: string[];
  location?: string;
  details?: string;
  isAccessible?: boolean;
  dynamicRouting?: string;
}

interface LiveMatch {
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  time: string;
}

export default function StaffDashboard() {
  const [alerts, setAlerts] = useState<StadiumAlert[]>([]);
  const [userAlerts, setUserAlerts] = useState<StadiumAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveNodes, setLiveNodes] = useState<StadiumNode[]>([]);
  const [liveMatch, setLiveMatch] = useState<LiveMatch | null>(null);
  const [evacuationMode, setEvacuationMode] = useState(false);

  const fetchLiveFeed = async () => {
    try {
      const res = await fetch('/api/live');
      const data = await res.json();
      if (data.nodes) setLiveNodes(data.nodes);
      if (data.match) setLiveMatch(data.match);
      if (data.incidents) setUserAlerts(data.incidents);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInsights = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const res = await fetch('/api/staff', {
        headers: {
          'Authorization': 'Bearer mock-secure-token'
        }
      });
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(false);
    fetchLiveFeed();
    const interval = setInterval(() => {
      fetchInsights(true);
      fetchLiveFeed();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="main-content" className="min-h-[100svh] bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
      {/* Dark Theme Background */}
      <div className="absolute inset-0 bg-slate-950 -z-10"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 rounded-lg border border-slate-700/50">
              <ShieldAlert className="w-6 h-6 text-fuchsia-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">StadiaLogix Ops</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                Digital Twin Command Center
                {liveMatch && <span className="px-2 py-0.5 bg-slate-800 rounded-full text-[9px] text-fuchsia-300 font-mono border border-slate-700">LIVE: {liveMatch.team1} {liveMatch.score1} - {liveMatch.score2} {liveMatch.team2} ({liveMatch.time})</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const confirmed = window.confirm("CRITICAL WARNING: Are you sure you want to trigger a stadium-wide evacuation protocol? All fan apps will be overridden.");
                if (confirmed) setEvacuationMode(!evacuationMode);
              }}
              aria-pressed={evacuationMode} aria-label="Toggle stadium evacuation protocol" className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 border ${evacuationMode ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              <AlertTriangle className="w-4 h-4" />
              {evacuationMode ? 'EVACUATION ACTIVE' : 'TRIGGER EVACUATION'}
            </button>
            <button onClick={() => fetchInsights(true)} className="px-5 py-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)] flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Refresh System
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Real-time Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isLoading && alerts.length === 0 && userAlerts.length === 0 ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-2xl p-5 animate-pulse h-48 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
                    <div className="w-16 h-6 bg-slate-800 rounded-md"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 bg-slate-800 rounded-md"></div>
                    <div className="w-full h-4 bg-slate-800 rounded-md"></div>
                    <div className="w-5/6 h-4 bg-slate-800 rounded-md"></div>
                  </div>
                  <div className="w-1/2 h-4 bg-slate-800 rounded-md mt-auto pt-2"></div>
                </div>
              ))}
            </>
          ) : (
            [...userAlerts, ...alerts].map((alert, index) => (
              <AlertCard key={index} alert={alert} />
            ))
          )}
        </div>

        {/* Digital Twin Map Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-4 left-4 z-[1000] bg-slate-950/80 backdrop-blur border border-slate-700 p-3 rounded-xl pointer-events-none shadow-lg">
               <h3 className="text-sm font-bold text-fuchsia-400 flex items-center gap-2">
                 <Activity className="w-4 h-4 animate-pulse" /> Live Crowd Density
               </h3>
               <p className="text-xs text-slate-400 mt-1">Digital Twin Sensor Feed</p>
               {evacuationMode && (
                 <div className="mt-2 bg-red-500/20 border border-red-500 p-2 rounded text-red-400 text-xs font-bold animate-pulse">
                   EVACUATION ROUTING ACTIVE
                 </div>
               )}
            </div>
            {/* The StadiumMap component is used as the Digital Twin visualizer */}
            <div className={`h-[600px] w-full bg-slate-950 transition-colors duration-1000 ${evacuationMode ? 'bg-red-950/30' : ''}`}>
              <StadiumMap activeLocation="" showHeatmap={true} evacuationMode={evacuationMode} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" /> Live Sector Status
              </h3>
              <div className="space-y-4">
                {liveNodes.slice(0, 5).map((node, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-300">{node.name}</p>
                      <p className="text-xs text-slate-500">{node.type}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-bold ${(node.crowdDensity ?? 0) > 70 ? 'text-rose-400' : (node.crowdDensity ?? 0) > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {node.crowdDensity ?? 0}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${(node.crowdDensity ?? 0) > 70 ? 'bg-rose-500' : (node.crowdDensity ?? 0) > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${node.crowdDensity ?? 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-rose-400" /> Environment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Temperature</p>
                  <p className="text-xl font-bold text-slate-200">72°F</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">AQI</p>
                  <p className="text-xl font-bold text-emerald-400">45 (Good)</p>
                </div>
              </div>
            </div>

            {/* Phase 2: Crowd Sentiment & Acoustic Analysis */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-fuchsia-400" /> Acoustic Sentiment
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Excitement Metric</p>
                    <p className="text-3xl font-extrabold text-white flex items-center gap-2">
                      87<span className="text-lg text-slate-500">/100</span>
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                    </p>
                  </div>
                  <div className="flex gap-1 h-8 items-end">
                    {[40, 65, 80, 50, 90, 100, 85].map((h, i) => (
                      <div key={i} className="w-2 bg-gradient-to-t from-fuchsia-600 to-cyan-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-300 font-medium">Suggestion: Crowd energy is peaking. Queue synchronized light show for the next goal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
