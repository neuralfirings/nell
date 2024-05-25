// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
  
export function connectToFirebase() {
  // Initialize Firebase
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_APIKEY, 
    authDomain: process.env.FIREBASE_AUTHDOMAIN, 
    projectId: process.env.FIREBASE_PROJECTID, 
    storageBucket: process.env.FIREBASE_STORAGEBUCKET, 
    messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID, 
    appId: process.env.FIREBASE_APPID, 
    measurementId: process.env.FIREBASE_MEASUREMENTID
  };
  const app = initializeApp(firebaseConfig);
  // // const analytics = getAnalytics(app);
  
  // const auth = getAuth(app);
  // const provider = new GoogleAuthProvider();
  // let auth = {}

  return { app }
}