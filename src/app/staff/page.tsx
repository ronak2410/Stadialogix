'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Users, MapPin, Loader2, ArrowLeft, Activity, Thermometer } from 'lucide-react';
import Link from 'next/link';
import stadiumData from '@/data/stadium_data.json';
import dynamic from 'next/dynamic';

// Dynamically import StadiumMap with ssr: false to prevent SSR Leaflet errors
const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
});

export default function StaffDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const interval = setInterval(fetchInsights, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-hidden">
      {/* Dark Theme Background */}
      <div className="absolute inset-0 bg-slate-950 -z-10"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 p-4 sticky top-0 z-20">
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
              <p className="text-xs text-slate-400">Command Center</p>
            </div>
          </div>
          <button onClick={fetchInsights} className="px-5 py-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white rounded-full text-sm font-bold transition-all shadow-md flex items-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Refresh Insights
          </button>
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
              <div key={index} className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors shadow-lg">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    alert.severity?.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    alert.severity?.toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">{alert.type}</span>
                      <span className="text-[9px] font-extrabold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">LIVE</span>
                    </div>
                    <div>
                      <h3 className="text-slate-100 font-extrabold text-base leading-snug">{alert.title}</h3>
                      <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">{alert.description}</p>
                    </div>
                    {alert.action && (
                      <div className="mt-3 p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                        <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest block mb-1">Response Protocol</span>
                        <p className="text-[11px] text-slate-300 leading-normal">{alert.action}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Map Area */}
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-3xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-fuchsia-400" /> Live Stadium Heatmap
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Integration Active
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-[450px] bg-slate-950/50 rounded-2xl border border-slate-800/80 overflow-hidden relative shadow-inner">
              <StadiumMap activeLocation="" />
            </div>
          </div>

          {/* Insights Panel */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-3xl p-6 shadow-xl h-fit">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-cyan-400" /> Node Status
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {stadiumData.nodes.map((node: any) => (
                <div key={node.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-200 text-sm">{node.name}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                      node.crowdDensity > 80 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      node.crowdDensity > 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {node.crowdDensity > 80 ? 'CRITICAL' : node.crowdDensity > 50 ? 'WARNING' : 'STABLE'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400 flex items-center gap-1"><Users className="w-3 h-3"/> Crowd Density</span>
                        <span className="text-slate-300 font-bold">{node.crowdDensity}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${node.crowdDensity > 80 ? 'bg-red-500' : node.crowdDensity > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${node.crowdDensity}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1"><Thermometer className="w-3 h-3"/> Operations State</span>
                      <span className="text-emerald-400 font-bold">Optimal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
