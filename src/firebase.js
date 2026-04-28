import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzrL9sSZsodUv2T_UsHX9I_DNxpYLUefk",
  authDomain: "biljard-app.firebaseapp.com",
  projectId: "biljard-app",
  storageBucket: "biljard-app.firebasestorage.app",
  messagingSenderId: "783669657656",
  appId: "1:783669657656:web:d10c1b1cda7617b065e6cd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);