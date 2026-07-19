import React from 'react';
import { AlertTriangle, MapPin, Bot } from 'lucide-react';

export interface StadiumAlert {
  type: string;
  severity: string;
  title: string;
  description: string;
  action?: string;
  time?: string;
  location?: string;
}

interface AlertCardProps {
  alert: StadiumAlert;
}

export function AlertCard({ alert }: AlertCardProps) {
  return (
    <div className={`bg-slate-900/60 backdrop-blur-lg border rounded-2xl p-5 hover:border-slate-500 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(217,70,239,0.1)] ${alert.type === 'FAN REPORTED' ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'border-slate-700/50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${alert.severity === 'Critical' || alert.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : alert.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded-md text-slate-400 border border-slate-700">
            {alert.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {alert.type === 'FAN REPORTED' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded border border-rose-500/30 uppercase animate-pulse">
              Fan Reported
            </span>
          )}
        </div>
      </div>
      <h3 className="font-bold text-slate-200 mb-1">{alert.title}</h3>
      <p className="text-sm text-slate-400 mb-4">{alert.description}</p>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5" /> {alert.location || 'Stadium Wide'}
        </div>
        {alert.type === 'FAN REPORTED' && (
          <button 
            onClick={(e) => {
              const btn = e.currentTarget;
              btn.innerHTML = `<svg class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Dispatching...`;
              setTimeout(() => {
                btn.className = "flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg text-[10px] font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                btn.innerHTML = `<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg> Bot En Route`;
              }, 1500);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 hover:scale-105 text-[10px] font-bold transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
          >
            <Bot className="w-3.5 h-3.5" /> Dispatch Cleanup Bot
          </button>
        )}
      </div>
    </div>
  );
}
