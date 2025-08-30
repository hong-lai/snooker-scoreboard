export interface Frame {
  player1Score: number;
  player2Score: number;
  tag?: string | null;
}

export interface Match {
  id: string;
  player1Name: string;
  player2Name:string;
  frames: Frame[];
  player1TotalFoulPoints: number;
  player2TotalFoulPoints: number;
  status: 'playing' | 'ended';
  createdAt: string;
  scoreboardImage?: string;
  userId?: string; // Optional because it's not stored in the doc itself, but useful on the client
}
