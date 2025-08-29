'use client';

import type { Match, Frame } from './types';

const STORE_KEY = 'snooker-matches';

const getInitialMatches = (): Match[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedMatches = localStorage.getItem(STORE_KEY);
  if (storedMatches) {
    return JSON.parse(storedMatches);
  }

  // Seed with mock data if no data exists
  const mockMatches: Match[] = [
    {
      id: '1',
      player1Name: 'Ronnie O\'Sullivan',
      player2Name: 'Judd Trump',
      frames: [
        { player1Score: 65, player1FoulPoints: 12, player2Score: 45, player2FoulPoints: 4 },
        { player1Score: 40, player1FoulPoints: 0, player2Score: 75, player2FoulPoints: 2 },
        { player1Score: 82, player1FoulPoints: 0, player2Score: 12, player2FoulPoints: 0 },
      ],
      status: 'ended',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      player1Name: 'John Higgins',
      player2Name: 'Mark Selby',
      frames: [
        { player1Score: 55, player1FoulPoints: 4, player2Score: 68, player2FoulPoints: 8 },
        { player1Score: 102, player1FoulPoints: 0, player2Score: 5, player2FoulPoints: 0 },
      ],
      status: 'playing',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  localStorage.setItem(STORE_KEY, JSON.stringify(mockMatches));
  return mockMatches;
};

export const getMatches = (): Match[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  return getInitialMatches();
};

export const getMatchById = (id: string): Match | undefined => {
  const matches = getMatches();
  return matches.find((match) => match.id === id);
};

export const createMatch = (player1Name: string, player2Name: string): Match => {
  const matches = getMatches();
  const newMatch: Match = {
    id: new Date().getTime().toString(),
    player1Name,
    player2Name,
    frames: [],
    status: 'playing',
    createdAt: new Date().toISOString(),
  };
  const updatedMatches = [...matches, newMatch];
  localStorage.setItem(STORE_KEY, JSON.stringify(updatedMatches));
  return newMatch;
};

export const updateMatch = (updatedMatch: Match): Match => {
  let matches = getMatches();
  matches = matches.map((match) => (match.id === updatedMatch.id ? updatedMatch : match));
  localStorage.setItem(STORE_KEY, JSON.stringify(matches));
  return updatedMatch;
};
