import { NextRequest, NextResponse } from 'next/server';
import { addIncident } from '@/utils/iotState';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const newIncident = {
      type: 'FAN REPORTED',
      severity: 'HIGH',
      title: 'Fan Incident Report',
      description: data.description,
      action: 'Review immediately and dispatch staff if necessary.',
      time: new Date().toLocaleTimeString(),
      location: data.location || 'Unknown Location'
    };

    addIncident(newIncident);

    return NextResponse.json({ success: true, incident: newIncident });
  } catch (error) {
    console.error('Error reporting incident', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
