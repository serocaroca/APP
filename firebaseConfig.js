import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGxTvVqWv7F0senzGVMDRNxsC79Nim6UU",
  authDomain: "plan-de-tratamiento-ad656.firebaseapp.com",
  projectId: "plan-de-tratamiento-ad656",
  storageBucket: "plan-de-tratamiento-ad656.appspot.com",
  messagingSenderId: "1006380630278",
  appId: "1:1006380630278:web:301a39b85e26cbdd219e87"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
