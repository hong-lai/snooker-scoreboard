'use client';

import type { Match, Frame } from './types';

const STORE_KEY = 'snooker-matches';

const getInitialMatches = (): Match[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedMatches = localStorage.getItem(STORE_KEY);
  if (storedMatches) {
    try {
      const parsed = JSON.parse(storedMatches);
      // Basic validation to ensure it's an array
      if (Array.isArray(parsed)) {
        return parsed.map(m => ({
          ...m,
          player1TotalFoulPoints: m.player1TotalFoulPoints || 0,
          player2TotalFoulPoints: m.player2TotalFoulPoints || 0,
          scoreboardImage: m.scoreboardImage || undefined,
        }))
      }
    } catch (e) {
      // If parsing fails, fall back to seeding
    }
  }

  // Seed with mock data if no data exists
  const mockMatches: Match[] = [
    {
      id: '1',
      player1Name: 'Ronnie O\'Sullivan',
      player2Name: 'Judd Trump',
      frames: [
        { player1Score: 65, player2Score: 45 },
        { player1Score: 40, player2Score: 75 },
        { player1Score: 82, player2Score: 12 },
      ],
      player1TotalFoulPoints: 12,
      player2TotalFoulPoints: 6,
      status: 'ended',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      player1Name: 'John Higgins',
      player2Name: 'Mark Selby',
      frames: [
        { player1Score: 55, player2Score: 68 },
        { player1Score: 102, player2Score: 5 },
      ],
      player1TotalFoulPoints: 4,
      player2TotalFoulPoints: 8,
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

export const createMatch = (player1Name: string, player2Name: string, createdAt?: Date): Match => {
  const matches = getMatches();
  const newMatch: Match = {
    id: new Date().getTime().toString(),
    player1Name,
    player2Name,
    frames: [],
    player1TotalFoulPoints: 0,
    player2TotalFoulPoints: 0,
    status: 'playing',
    createdAt: (createdAt || new Date()).toISOString(),
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

export const deleteMatch = (id: string): void => {
  let matches = getMatches();
  matches = matches.filter((match) => match.id !== id);
  localStorage.setItem(STORE_KEY, JSON.stringify(matches));
};
