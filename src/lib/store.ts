'use client';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import type { Match } from './types';

const MATCHES_COLLECTION = 'matches';

// This function gets the user-specific collection reference
const getMatchesCollection = (userId: string) => {
    return collection(db, 'users', userId, MATCHES_COLLECTION);
}

export const getMatches = async (userId: string): Promise<Match[]> => {
    const matchesCol = getMatchesCollection(userId);
    const q = query(matchesCol, orderBy('createdAt', 'desc'));
    const matchSnapshot = await getDocs(q);
    const matchList = matchSnapshot.docs.map(doc => {
        const data = doc.data();
        // Exclude the large image data from the list view
        delete data.scoreboardImage; 
        return { id: doc.id, ...data } as Match;
    });
    return matchList;
};

export const getMatchById = async (userId: string, id: string): Promise<Match | null> => {
    const matchDocRef = doc(db, 'users', userId, MATCHES_COLLECTION, id);
    const matchDoc = await getDoc(matchDocRef);

    if (matchDoc.exists()) {
        const data = matchDoc.data();
        // The document path already ensures it belongs to the user, no need for an additional check here.
        return { id: matchDoc.id, ...data } as Match;
    }
    return null;
};

export const createMatch = async (userId: string, player1Name: string, player2Name: string, createdAt?: Date): Promise<Match> => {
    const matchesCol = getMatchesCollection(userId);
    const now = (createdAt || new Date()).toISOString();
    const newMatchData = {
        player1Name,
        player2Name,
        frames: [],
        player1TotalFoulPoints: 0,
        player2TotalFoulPoints: 0,
        status: 'playing' as const,
        createdAt: now,
        modifiedAt: now,
    };

    const docRef = await addDoc(matchesCol, newMatchData);
  
    return {
        id: docRef.id,
        ...newMatchData,
    } as Match;
};

export const updateMatch = async (userId: string, updatedMatch: Match): Promise<Match> => {
    const matchDocRef = doc(db, 'users', userId, MATCHES_COLLECTION, updatedMatch.id);
    // The `userId` property should not be part of the match document itself.
    const { id, userId: matchUserId, ...matchData } = updatedMatch;
    
    const dataToUpdate = {
        ...matchData,
        modifiedAt: new Date().toISOString(),
    };

    await updateDoc(matchDocRef, dataToUpdate);
    return { ...updatedMatch, modifiedAt: dataToUpdate.modifiedAt };
};


export const deleteMatch = async (userId: string, id: string): Promise<void> => {
    const matchDocRef = doc(db, 'users', userId, MATCHES_COLLECTION, id);
    await deleteDoc(matchDocRef);
};
