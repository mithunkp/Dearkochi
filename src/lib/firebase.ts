import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAza7wXO_pAY9OUjnttxtTWWxiOTjqozLk",
    authDomain: "dearkochi-83f45.firebaseapp.com",
    projectId: "dearkochi-83f45",
    storageBucket: "dearkochi-83f45.firebasestorage.app",
    messagingSenderId: "1055618333570",
    appId: "1:1055618333570:web:1887f6b618b04a45d52d9b",
    measurementId: "G-VNLK9ETK5Q"
};

// Initialize Firebase (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics only supported in browser
let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, googleProvider, analytics };
