
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDct2prdI_aicJwPl5N9oinTtv6ZN92pZU",
  authDomain: "quizaf-a10bc.firebaseapp.com",
  projectId: "quizaf-a10bc",
  storageBucket: "quizaf-a10bc.appspot.com",
  messagingSenderId: "364854204759",
  appId: "1:364854204759:web:99db5e3fc89c4b30538612",
  measurementId: "G-D3VRCBZR59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export default app;