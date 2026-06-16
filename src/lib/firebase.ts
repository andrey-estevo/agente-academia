// 🔥 Firebase completo (Auth + Firestore)

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyCuDd95ZBUTEabvxs3X9Oe33yHEwXBqtGU",
  authDomain: "atendimento-academia.firebaseapp.com",
  projectId: "atendimento-academia",
  storageBucket: "atendimento-academia.appspot.com", // ⚠️ corrigido (padrão Firebase)
  messagingSenderId: "305343688413",
  appId: "1:305343688413:web:a72c36a642339683bcb534"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Autenticação
export const auth = getAuth(app);

// 🧠 Banco (Firestore)
export const db = getFirestore(app);

// (opcional) export default
export default app;