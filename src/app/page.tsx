import Link from 'next/link';
import { MapPin, ShieldAlert, Navigation } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-50 font-sans p-4 relative overflow-hidden">
      <div className="max-w-3xl text-center space-y-8 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-fuchsia-500/30">
             <MapPin className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
          StadiaLogix
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          GenAI-Powered Tournament Operations & Fan Experience Platform for the 2026 World Cup.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-16 text-left">
          {/* Fan Mode Card */}
          <Link href="/fan" className="group block p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-fuchsia-500/50 hover:bg-slate-800/80 transition-all shadow-lg hover:shadow-fuchsia-500/20">
            <div className="w-14 h-14 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all">
              <Navigation className="w-7 h-7 text-fuchsia-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-fuchsia-400 transition-colors">Fan Mode</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Interactive smart assistant. Features an intelligent audio guide and a real-time synchronized stadium map for accessible routing.
            </p>
          </Link>

          {/* Staff Mode Card */}
          <Link href="/staff" className="group block p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all shadow-lg hover:shadow-cyan-500/20">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
              <ShieldAlert className="w-7 h-7 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-cyan-400 transition-colors">Staff Ops Dashboard</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Command center view. Watch the AI analyze raw stadium data to generate predictive crowd alerts and real-time operational decisions.
            </p>
          </Link>
        </div>
      </div>
      
      {/* 3D Animated Background */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>
    </div>
  );
}
