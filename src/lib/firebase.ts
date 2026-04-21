import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, collection, query, where, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, getDocFromServer, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

type FirebaseEnvConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId: string;
  measurementId?: string;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'firestoreDatabaseId'] as const;

const missingFirebaseKeys = requiredFirebaseKeys
  .filter((key) => !firebaseConfig[key])
  .map((key) => key);

const validatedFirebaseConfig: FirebaseEnvConfig =
  missingFirebaseKeys.length === 0
    ? (firebaseConfig as FirebaseEnvConfig)
    : {
        apiKey: firebaseConfigJson.apiKey,
        authDomain: firebaseConfigJson.authDomain,
        projectId: firebaseConfigJson.projectId,
        storageBucket: firebaseConfigJson.storageBucket,
        messagingSenderId: firebaseConfigJson.messagingSenderId,
        appId: firebaseConfigJson.appId,
        firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId,
        measurementId: firebaseConfigJson.measurementId,
      };

if (missingFirebaseKeys.length > 0) {
  console.warn(
    `Falling back to firebase-applet-config.json because these env vars are missing: ${missingFirebaseKeys.join(', ')}`
  );
}

// Initialize Firebase SDK
const app = initializeApp(validatedFirebaseConfig);
export const db = getFirestore(app, validatedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const user = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerInfo: user?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation function as per instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is reporting offline.");
    }
  }
}

testConnection();

export { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  doc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs 
};
export type { User };
