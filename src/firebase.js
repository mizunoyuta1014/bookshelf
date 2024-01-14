import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_QPv-l9lo_wmY9Rpc39u3E1o5SdBLU-M",
  authDomain: "books-management-4ab22.firebaseapp.com",
  projectId: "books-management-4ab22",
  storageBucket: "books-management-4ab22.appspot.com",
  messagingSenderId: "999439959325",
  appId: "1:999439959325:web:0dccccdad8326a62044df4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
