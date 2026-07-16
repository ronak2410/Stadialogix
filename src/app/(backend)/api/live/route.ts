import { NextResponse } from 'next/server';
import stadiumData from '@/data/stadium_data.json';

// Simulate live IoT data fluctuations
export async function GET() {
  const liveNodes = stadiumData.nodes.map((node: any) => {
    // Randomize crowd density by +/- 15%
    const crowdFluctuation = Math.floor(Math.random() * 30) - 15;
    let newDensity = (node.crowdDensity || 50) + crowdFluctuation;
    newDensity = Math.max(0, Math.min(100, newDensity));

    // Randomize queue times by +/- 5 mins
    const queueFluctuation = Math.floor(Math.random() * 10) - 5;
    let newQueue = (node.currentQueueTime || 0) + queueFluctuation;
    newQueue = Math.max(0, newQueue);

    return {
      ...node,
      crowdDensity: newDensity,
      currentQueueTime: newQueue,
    };
  });

  // Mock live score
  const matchMinute = 84 + Math.floor(Math.random() * 5); // 84 to 89
  const matchSeconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');

  return NextResponse.json({
    stadium: stadiumData.stadium,
    capacity: stadiumData.capacity,
    nodes: liveNodes,
    match: {
      team1: 'USA',
      team2: 'Mexico',
      score1: 2,
      score2: 1,
      time: `${matchMinute}:${matchSeconds}`
    }
  });
}
