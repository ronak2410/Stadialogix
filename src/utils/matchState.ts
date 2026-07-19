// In-Memory Live Match Engine
export type MatchEvent = {
  time: string;
  type: 'goal' | 'foul' | 'card' | 'sub' | 'info';
  team: string;
  player?: string;
  description: string;
};

let liveMatchState = {
  homeTeam: 'USA',
  awayTeam: 'Mexico',
  homeScore: 2,
  awayScore: 1,
  clockSeconds: 84 * 60 + 12, // 84:12
  half: 2,
  status: 'live', // live, halftime, fulltime
  events: [] as MatchEvent[]
};

let matchInterval: NodeJS.Timeout | null = null;

function initMatchEngine() {
  if (matchInterval) return;

  matchInterval = setInterval(() => {
    if (liveMatchState.status === 'live') {
      liveMatchState.clockSeconds += 1;
      
      // Random events
      if (Math.random() < 0.005) { // Rare chance of an event per second
        const isHome = Math.random() > 0.5;
        liveMatchState.events.push({
          time: formatClock(liveMatchState.clockSeconds),
          type: 'foul',
          team: isHome ? liveMatchState.homeTeam : liveMatchState.awayTeam,
          description: `Foul committed by ${isHome ? liveMatchState.homeTeam : liveMatchState.awayTeam}.`
        });
      }

      if (liveMatchState.clockSeconds >= 90 * 60) {
        liveMatchState.status = 'fulltime';
        clearInterval(matchInterval!);
      }
    }
  }, 1000); // Ticks every real second
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getLiveMatchState() {
  if (!matchInterval) {
    initMatchEngine();
  }
  return {
    ...liveMatchState,
    clockDisplay: formatClock(liveMatchState.clockSeconds)
  };
}
