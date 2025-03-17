export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  expiresAt: {
    seconds: number;
  };
}
