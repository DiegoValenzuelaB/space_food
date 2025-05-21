// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCe_d9DM5ErW8XXU3itu_U8VKDor0Bnsb0",
  authDomain: "spacefood-001.firebaseapp.com",
  projectId: "spacefood-001",
  storageBucket: "spacefood-001.firebasestorage.app",
  messagingSenderId: "225331446869",
  appId: "1:225331446869:web:25862f8123bf09c82240dc",
  measurementId: "G-Q69FB02FSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, auth, analytics };

window.auth = getAuth(app);
