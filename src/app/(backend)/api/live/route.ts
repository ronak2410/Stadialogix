import { NextResponse } from 'next/server';
import { getIoTState } from '@/utils/iotState';
import { getLiveMatchState } from '@/utils/matchState';

// Now returns true live state from the state manager instead of simulated fluctuations
export async function GET() {
  const currentState = getIoTState();
  const currentMatch = getLiveMatchState();

  return NextResponse.json({
    stadium: currentState.stadium,
    capacity: currentState.capacity,
    nodes: currentState.nodes,
    incidents: currentState.incidents || [],
    flashSales: currentState.flashSales || [],
    match: {
      team1: currentMatch.homeTeam,
      team2: currentMatch.awayTeam,
      score1: currentMatch.homeScore,
      score2: currentMatch.awayScore,
      time: currentMatch.clockDisplay
    }
  });
}
