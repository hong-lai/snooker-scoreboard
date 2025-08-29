export interface Frame {
  player1Score: number;
  player1FoulPoints: number;
  player2Score: number;
  player2FoulPoints: number;
}

export interface Match {
  id: string;
  player1Name: string;
  player2Name:string;
  frames: Frame[];
  status: 'playing' | 'ended';
  createdAt: string;
}
