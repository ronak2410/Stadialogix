export interface StadiumNode {
  id: string;
  name: string;
  type: 'gate' | 'seating' | 'vendor' | 'amenity' | 'logistics' | 'restroom';
  location?: string;
  details?: string;
  description?: string;
  offerings?: string[];
  currentQueueTime?: number;
  crowdDensity?: number;
  wasteBinLevel?: number;
  isAccessible?: boolean;
  dynamicRouting?: string;
  coords?: [number, number];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
}

export interface ChatRequestPayload {
  messages: ChatMessage[];
}

export interface ChatResponsePayload {
  message?: string;
  error?: string;
}
