import { StadiumNode } from '@/types';

export const createMarkerHtml = (node: StadiumNode, isActive: boolean) => {
  let bgColor = 'bg-slate-600';
  let icon = '📍';
  let pulseDiv = '';

  if (isActive) {
    pulseDiv = '<div class="absolute -inset-2 rounded-full bg-rose-500 animate-ping opacity-60 pointer-events-none z-0"></div>';
  }

  switch (node.type) {
    case 'gate':
      bgColor = 'bg-rose-600 border border-rose-400 text-white shadow-[0_0_12px_rgba(225,29,72,0.8)]';
      icon = '🚪';
      break;
    case 'seating':
      bgColor = 'bg-indigo-600 border border-indigo-400 text-white shadow-[0_0_12px_rgba(79,70,229,0.8)]';
      icon = '💺';
      break;
    case 'vendor':
      bgColor = 'bg-amber-500 border border-amber-300 text-white shadow-[0_0_12px_rgba(245,158,11,0.8)]';
      if (node.id.includes('pizza')) icon = '🍕';
      else if (node.id.includes('taco')) icon = '🌮';
      else icon = '🛍️';
      break;
    case 'amenity':
      bgColor = 'bg-teal-500 border border-teal-300 text-white shadow-[0_0_12px_rgba(20,184,166,0.8)]';
      if (node.id.includes('club')) {
        bgColor = 'bg-yellow-600 border border-yellow-400 text-white shadow-[0_0_12px_rgba(202,138,4,0.8)]';
        icon = '👑';
      } else if (node.id.includes('restroom')) icon = '🚻';
      else if (node.id.includes('medical')) icon = '🏥';
      break;
    case 'logistics':
      if (node.id.includes('rideshare')) {
        bgColor = 'bg-emerald-600 border-2 border-white text-white shadow-lg shadow-emerald-500/30';
        icon = '🏇';
      } else if (node.id.includes('rail')) {
        bgColor = 'bg-blue-600 border-2 border-white text-white shadow-lg shadow-blue-500/30';
        icon = '🚆';
      } else if (node.id.includes('parking')) {
        bgColor = 'bg-blue-500 border border-blue-300 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]';
        icon = '🅿️';
      } else if (node.id.includes('highway') || node.id.includes('route')) {
        bgColor = 'bg-slate-700 border border-slate-500 text-white';
        icon = '🛣️';
      }
      break;
  }

  // Specific custom overrides to replicate Google Maps aesthetics
  if (node.id === 'highway-route3') {
    return `
      <div class="flex flex-col items-center justify-center">
        <div class="w-6 h-6 bg-white text-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center font-extrabold text-[10px] shadow-md z-10">3</div>
        <span class="text-[8px] font-bold text-white bg-slate-900/90 px-1 py-0.5 rounded border border-slate-700 whitespace-nowrap mt-0.5 z-10">Route 3</span>
      </div>
    `;
  }
  if (node.id === 'highway-route120') {
    return `
      <div class="flex flex-col items-center justify-center">
        <div class="w-6 h-6 bg-white text-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center font-extrabold text-[10px] shadow-md z-10">120</div>
        <span class="text-[8px] font-bold text-white bg-slate-900/90 px-1 py-0.5 rounded border border-slate-700 whitespace-nowrap mt-0.5 z-10">Route 120</span>
      </div>
    `;
  }
  if (node.id === 'highway-nj-turnpike') {
    return `
      <div class="flex flex-col items-center justify-center">
        <div class="w-6 h-6 bg-blue-900 text-white border border-white rounded-full flex items-center justify-center font-black text-[8px] shadow-md z-10">I-95</div>
        <span class="text-[8px] font-bold text-white bg-slate-900/90 px-1 py-0.5 rounded border border-slate-700 whitespace-nowrap mt-0.5 z-10">NJ Turnpike</span>
      </div>
    `;
  }
  if (node.name.toLowerCase().includes('nickelodeon')) {
    bgColor = 'bg-purple-600 border-2 border-white text-white shadow-lg shadow-purple-500/40';
    icon = '🎡';
  }
  if (node.name.toLowerCase().includes('werecoverdata')) {
    bgColor = 'bg-white border-2 border-red-500 text-red-500 shadow-lg';
    icon = '🔴';
  }
  if (node.name.toLowerCase().includes('jd sports')) {
    bgColor = 'bg-black border-2 border-white text-white shadow-lg';
    icon = '👟';
  }

  const activeClasses = isActive ? 'scale-125 z-50' : '';

  const densityIndicator = node.crowdDensity && node.crowdDensity > 80 
    ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 animate-pulse rounded-full border border-white"></div>' 
    : '';

  let waitTimeBadge = '';
  if (node.currentQueueTime !== undefined && (node.type === 'vendor' || node.type === 'restroom' || node.type === 'gate')) {
    waitTimeBadge = `
      <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 font-black text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap border border-amber-300 z-50">
        Wait: ${node.currentQueueTime}m
      </div>
    `;
  }

  return `
    <div class="relative flex flex-col items-center group transition-all duration-300 ${activeClasses}">
      ${pulseDiv}
      ${waitTimeBadge}
      <div class="w-7 h-7 ${bgColor} rounded-full flex items-center justify-center text-[13px] shadow-md border-2 border-white transition-all transform group-hover:scale-110 z-10">
        <span class="text-sm">${icon}</span>
        ${densityIndicator}
      </div>
      <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white -mt-[1px] z-10"></div>
      
      <div class="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-950/80 text-white border border-slate-800/80 rounded px-1 py-0.5 text-[8px] font-extrabold whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none shadow z-50">
        ${node.name}
      </div>
    </div>
  `;
};
