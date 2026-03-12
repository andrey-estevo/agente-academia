// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuDd95ZBUTEabvxs3X9Oe33yHEwXBqtGU",
  authDomain: "atendimento-academia.firebaseapp.com",
  projectId: "atendimento-academia",
  storageBucket: "atendimento-academia.firebasestorage.app",
  messagingSenderId: "305343688413",
  appId: "1:305343688413:web:a72c36a642339683bcb534"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);