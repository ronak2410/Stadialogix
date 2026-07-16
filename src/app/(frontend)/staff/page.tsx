'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Users, MapPin, Loader2, ArrowLeft, Activity, Thermometer } from 'lucide-react';
import Link from 'next/link';
import stadiumData from '@/data/stadium_data.json';
import dynamic from 'next/dynamic';

const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
});

export default function StaffDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveNodes, setLiveNodes] = useState<any[]>(stadiumData.nodes);
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [evacuationMode, setEvacuationMode] = useState(false);

  const fetchLiveFeed = async () => {
    try {
      const res = await fetch('/api/live');
      const data = await res.json();
      if (data.nodes) setLiveNodes(data.nodes);
      if (data.match) setLiveMatch(data.match);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/staff');
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
    fetchInsights();
    fetchLiveFeed();
    const interval = setInterval(() => {
      fetchInsights();
      fetchLiveFeed();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100svh] bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
      {/* Dark Theme Background */}
      <div className="absolute inset-0 bg-slate-950 -z-10"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
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
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 border ${evacuationMode ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              <AlertTriangle className="w-4 h-4" />
              {evacuationMode ? 'EVACUATION ACTIVE' : 'TRIGGER EVACUATION'}
            </button>
            <button onClick={fetchInsights} className="px-5 py-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)] flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Refresh System
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Real-time Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isLoading && alerts.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500 mb-2" />
              <p className="text-slate-400 text-sm">Generating Live Operational Predictions...</p>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <div key={index} className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors shadow-[0_0_20px_rgba(217,70,239,0.1)]">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : alert.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded-md text-slate-400 border border-slate-700">
                    {alert.time}
                  </span>
                </div>
                <h3 className="font-bold text-slate-200 mb-1">{alert.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{alert.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5" /> {alert.location}
                </div>
              </div>
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
                      <span className={`text-sm font-bold ${node.crowdDensity > 70 ? 'text-rose-400' : node.crowdDensity > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {node.crowdDensity}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${node.crowdDensity > 70 ? 'bg-rose-500' : node.crowdDensity > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${node.crowdDensity}%` }}></div>
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
          </div>
        </div>
      </main>
    </div>
  );
}
