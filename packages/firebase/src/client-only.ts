// Firebase Client-only exports - Compatible with browser environments
// This file excludes firebase-admin and server-only modules

export * from './client';
export * from './config';
export * from './performance';

// Re-export Firebase types and functions for convenience
export {
  createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, type User,
  type UserCredential
} from 'firebase/auth';

export {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc,
  getDoc,
  getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter, updateDoc, where, type CollectionReference, type DocumentData, type DocumentReference, type DocumentSnapshot, type Query, type QuerySnapshot
} from 'firebase/firestore';

export {
  deleteObject, getDownloadURL, listAll, ref,
  uploadBytes,
  uploadString, type StorageReference,
  type UploadResult
} from 'firebase/storage'; 