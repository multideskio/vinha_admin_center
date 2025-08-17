// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDF7WXng-6lOYDlvjYIVNX6FIfzHYnnMp0",
  authDomain: "multidesk-portal.firebaseapp.com",
  projectId: "multidesk-portal",
  storageBucket: "multidesk-portal.appspot.com",
  messagingSenderId: "130104629672",
  appId: "1:130104629672:web:91563cb1a57b06f3efa59d",
  measurementId: "G-L8KZVHJT2W"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
