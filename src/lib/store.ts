'use client';

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Match } from './types';

const MATCHES_COLLECTION = 'matches';

export const getMatches = async (): Promise<Match[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, MATCHES_COLLECTION), where('userId', '==', user.uid));
  const querySnapshot = await getDocs(q);
  const matches: Match[] = [];
  querySnapshot.forEach((doc) => {
    matches.push({ id: doc.id, ...doc.data() } as Match);
  });
  return matches.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getMatchById = async (id: string): Promise<Match | undefined> => {
  const user = auth.currentUser;
  if (!user) return undefined;

  const docRef = doc(db, MATCHES_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const match = { id: docSnap.id, ...docSnap.data() } as Match;
    if (match.userId === user.uid) {
        return match;
    }
  }
  return undefined;
};

export const createMatch = async (player1Name: string, player2Name: string, createdAt?: Date): Promise<Match> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const newMatchData = {
    player1Name,
    player2Name,
    frames: [],
    player1TotalFoulPoints: 0,
    player2TotalFoulPoints: 0,
    status: 'playing' as const,
    createdAt: (createdAt || new Date()).toISOString(),
    userId: user.uid,
  };

  const docRef = await addDoc(collection(db, MATCHES_COLLECTION), newMatchData);
  return { id: docRef.id, ...newMatchData };
};

export const updateMatch = async (updatedMatch: Match): Promise<Match> => {
    const user = auth.currentUser;
    if (!user || user.uid !== updatedMatch.userId) {
        throw new Error("Unauthorized update attempt");
    }

    const matchRef = doc(db, MATCHES_COLLECTION, updatedMatch.id);
    const { id, ...matchData } = updatedMatch;
    await updateDoc(matchRef, matchData);
    return updatedMatch;
};

export const deleteMatch = async (id: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not logged in");
    }
    
    // Fetch the match first to verify ownership
    const matchRef = doc(db, MATCHES_COLLECTION, id);
    const matchSnap = await getDoc(matchRef);

    if (matchSnap.exists() && matchSnap.data().userId === user.uid) {
        await deleteDoc(matchRef);
    } else {
        throw new Error("Unauthorized delete attempt or match not found");
    }
};
