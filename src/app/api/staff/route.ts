import { NextResponse } from 'next/server';
import { validateMockAuth } from '@/utils/validation';

export async function GET(request: Request) {
  try {
    // Phase 3: Security Validation 
    validateMockAuth(request);
    
    // Simulate complex predictive analytics processing
    await new Promise(r => setTimeout(r, 800));

    return NextResponse.json({
      alerts: [
        {
          type: 'PREDICTIVE',
          severity: 'High',
          title: 'Congestion Predicted at North Gate',
          description: 'Based on current ingress rates and transit arrivals, North Gate will exceed capacity in 12 minutes.',
          action: 'Reroute traffic to East Gate',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: 'North Gate'
        },
        {
          type: 'SYSTEM',
          severity: 'Warning',
          title: 'Temperature Anomaly Detected',
          description: 'Server room B temperature is 2 degrees above normal operating threshold.',
          action: 'Dispatch maintenance',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: 'Server Room B'
        },
        {
          type: 'FAN REPORTED',
          severity: 'Low',
          title: 'Spill reported in Section 114',
          description: 'A fan has reported a beverage spill on the stairs in Section 114.',
          action: 'Dispatch Cleanup Bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: 'Section 114'
        }
      ]
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
