import { initializeApp } from 'firebase/app'
import {
  getAuth, GithubAuthProvider, GoogleAuthProvider,
  signInWithPopup, signOut, onAuthStateChanged as _onAuthStateChanged,
  type Auth, type Unsubscribe, type NextOrObserver, type User,
} from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore'
import type { AppData } from './types'

const configured = !!(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID)

let _auth: Auth | undefined
let _db: Firestore | undefined

if (configured) {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  })
  _auth = getAuth(app)
  _db = getFirestore(app)
}

export const auth = _auth as Auth
export { GithubAuthProvider, GoogleAuthProvider, signInWithPopup, signOut }

export function onAuthStateChanged(a: Auth, cb: NextOrObserver<User>): Unsubscribe {
  if (!configured) {
    if (typeof cb === 'function') cb(null)
    return () => {}
  }
  return _onAuthStateChanged(a, cb)
}

export async function readUserData(uid: string): Promise<AppData | null> {
  if (!_db) return null
  const snap = await getDoc(doc(_db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as AppData
}

export async function writeUserData(uid: string, data: AppData): Promise<void> {
  if (!_db) return
  await setDoc(doc(_db, 'users', uid), data)
}
