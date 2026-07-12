import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Substitua pelos valores do SEU projeto Firebase
// (Console > Configurações do projeto > Geral > Seus apps)
const firebaseConfig = {
  apiKey: "AIzaSyCGvDPNH6qILOr3OB12VR9yBD1hAgPqkY8",
  authDomain: "meuciclodeestudo.firebaseapp.com",
  projectId: "meuciclodeestudo",
  storageBucket: "meuciclodeestudo.firebasestorage.app",
  messagingSenderId: "202997630435",
  appId: "1:202997630435:web:21bdc185b5174fc1cd0cd6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
