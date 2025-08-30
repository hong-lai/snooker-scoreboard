'use client';
import type { Match } from './types';

const MATCHES_KEY = 'snooker-matches';

const getMatchesFromStorage = (): Match[] => {
  if (typeof window === 'undefined') return [];
  const matchesJson = localStorage.getItem(MATCHES_KEY);
  return matchesJson ? JSON.parse(matchesJson) : [];
};

const saveMatchesToStorage = (matches: Match[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
};

export const getMatches = (): Match[] => {
  const matches = getMatchesFromStorage();
  return matches.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getMatchById = (id: string): Match | undefined => {
  const matches = getMatchesFromStorage();
  return matches.find((match) => match.id === id);
};

export const createMatch = (player1Name: string, player2Name: string, createdAt?: Date): Match => {
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

  const matches = getMatchesFromStorage();
  matches.push(newMatch);
  saveMatchesToStorage(matches);
  
  return newMatch;
};

export const updateMatch = (updatedMatch: Match): Match => {
    let matches = getMatchesFromStorage();
    matches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    saveMatchesToStorage(matches);
    return updatedMatch;
};


export const deleteMatch = (id: string): void => {
    let matches = getMatchesFromStorage();
    matches = matches.filter(m => m.id !== id);
    saveMatchesToStorage(matches);
};
