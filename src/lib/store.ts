'use client';
import { db, ensureSignedIn } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import type { Match, Frame } from './types';

const MATCHES_COLLECTION = 'matches';

// Ensure we are signed in before any operation
const getDb = async () => {
    await ensureSignedIn();
    return db;
}

export const getMatches = async (): Promise<Match[]> => {
    const db = await getDb();
    const matchesCol = collection(db, MATCHES_COLLECTION);
    const q = query(matchesCol, orderBy('createdAt', 'desc'));
    const matchSnapshot = await getDocs(q);
    const matchList = matchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
    return matchList;
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  const db = await getDb();
  const matchDocRef = doc(db, MATCHES_COLLECTION, id);
  const matchDoc = await getDoc(matchDocRef);
  if (matchDoc.exists()) {
    return { id: matchDoc.id, ...matchDoc.data() } as Match;
  }
  return null;
};

export const createMatch = async (player1Name: string, player2Name: string, createdAt?: Date): Promise<Match> => {
  const db = await getDb();
  const newMatchData = {
    player1Name,
    player2Name,
    frames: [],
    player1TotalFoulPoints: 0,
    player2TotalFoulPoints: 0,
    status: 'playing' as const,
    createdAt: (createdAt || new Date()).toISOString(),
  };

  const docRef = await addDoc(collection(db, MATCHES_COLLECTION), newMatchData);
  
  return {
    id: docRef.id,
    ...newMatchData,
  };
};

export const updateMatch = async (updatedMatch: Match): Promise<Match> => {
    const db = await getDb();
    const matchDocRef = doc(db, MATCHES_COLLECTION, updatedMatch.id);
    const { id, ...matchData } = updatedMatch;
    await updateDoc(matchDocRef, matchData);
    return updatedMatch;
};


export const deleteMatch = async (id: string): Promise<void> => {
    const db = await getDb();
    const matchDocRef = doc(db, MATCHES_COLLECTION, id);
    await deleteDoc(matchDocRef);
};
