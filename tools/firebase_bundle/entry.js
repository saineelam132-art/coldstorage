// Only the parts of the Firebase SDK the site uses -> window.KKFirebase (plain script, works from file:// too).
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, collection, getDoc, getDocs, setDoc, updateDoc, addDoc,
  onSnapshot, query, where, orderBy, limit, runTransaction, serverTimestamp, increment, writeBatch,
} from 'firebase/firestore';
window.KKFirebase = {
  initializeApp, getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator,
  getFirestore, connectFirestoreEmulator, doc, collection, getDoc, getDocs, setDoc, updateDoc, addDoc,
  onSnapshot, query, where, orderBy, limit, runTransaction, serverTimestamp, increment, writeBatch,
};
