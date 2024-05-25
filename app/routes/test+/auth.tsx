import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { FcGoogle } from 'react-icons/fc';
import { connectToFirebase } from '@/app/lib/firebase';
import { getAuth, onAuthStateChanged } from "firebase/auth";


export const loader = async () => {
  const { app } =  connectToFirebase()
  const auth = getAuth(app)
  return auth
};


import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
const provider = new GoogleAuthProvider();

import { initializeApp } from "firebase/app";


export default function Page() {
  const auth  = useLoaderData<typeof loader>();
  const user = auth.currentUser;
  console.log("auth > user", user)


  const handleGoogleLogin = async () => {
    console.log("Google login placeholder")
    const firebaseConfig = {
      apiKey: "AIzaSyDp1L2-bVUbJYeYloCTPi4jl_wIdPAE4p8",
      authDomain: "nellreader.firebaseapp.com",
      projectId: "nellreader",
      storageBucket: "nellreader.appspot.com",
      messagingSenderId: "918112064716",
      appId: "1:918112064716:web:e22f24b97b6d5915d75e69",
      measurementId: "G-95WQH2C8SB"
    };
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app)
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log("user post google auth", user)
        // IdP data available using getAdditionalUserInfo(result)
        // ...
      }).catch((error) => {
        // Handle Errors here.
        console.log("ERROR")
        console.error(error)
      });
  }


  return(
    <>
      <h1>Test Auth</h1>
      <br />
      <button
        onClick={handleGoogleLogin}
      >
        Login with Google
      </button>
    </>
  )
}