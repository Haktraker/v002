// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPmGnMSaUk5ohvM2KSGup1ltQ958G0LIM",
  authDomain: "fir-bda4c.firebaseapp.com",
  projectId: "fir-bda4c",
  storageBucket: "fir-bda4c.firebasestorage.app",
  messagingSenderId: "1068192327894",
  appId: "1:1068192327894:web:df6b4b4f22f62be8fd0177"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export the app for potential future use
export default app; 