// Firebase Client-only exports - Compatible with browser environments
// This file excludes firebase-admin and server-only modules
export * from './client';
export * from './config';
export * from './performance';
// Re-export Firebase types and functions for convenience
export { createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
export { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';
export { deleteObject, getDownloadURL, listAll, ref, uploadBytes, uploadString } from 'firebase/storage';
