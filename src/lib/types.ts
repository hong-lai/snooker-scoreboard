export interface Frame {
  player1Score: number;
  player2Score: number;
  tag?: string;
}

export interface Match {
  id: string;
  userId: string;
  player1Name: string;
  player2Name:string;
  frames: Frame[];
  player1TotalFoulPoints: number;
  player2TotalFoulPoints: number;
  status: 'playing' | 'ended';
  createdAt: string;
  scoreboardImage?: string;
}
