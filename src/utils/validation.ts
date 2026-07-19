import { z } from 'zod';

export const StaffInsightRequestSchema = z.object({
  department: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional()
});

export const FanReportSchema = z.object({
  incidentType: z.enum(['Spill', 'Medical', 'Security', 'Maintenance', 'Other']),
  location: z.string().min(3).max(50),
  description: z.string().max(500).optional()
});

export const validateMockAuth = (req: Request) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer mock-secure-token')) {
    throw new Error('Unauthorized');
  }
  return true;
};
