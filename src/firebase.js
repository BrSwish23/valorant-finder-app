// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCF14GW0uD2IrvtiPnOyHb2ZczxXXYEhGQ",
  authDomain: "valorant-queue-finder.firebaseapp.com",
  projectId: "valorant-queue-finder",
  storageBucket: "valorant-queue-finder.appspot.com",
  messagingSenderId: "724830117501",
  appId: "1:724830117501:web:29f4db1dd4018bc6395b14",
  measurementId: "G-0HX1WFHK5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, auth, db };