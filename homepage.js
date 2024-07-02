import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import{getFirestore, getDoc, doc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

 // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBEwPq1-u1qL4vW499YjkqkGKjH67d0-T0",
    authDomain: "newproto-49e08.firebaseapp.com",
    databaseURL: "https://newproto-49e08-default-rtdb.firebaseio.com",
    projectId: "newproto-49e08",
    storageBucket: "newproto-49e08.appspot.com",
    messagingSenderId: "255983493498",
    appId: "1:255983493498:web:dfeb79d79ca72b1e8f76c3",
    measurementId: "G-BT6PYW8ZV6"
  };
 
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const logoutButton = document.getElementById('logout');

// Authentication state change
onAuthStateChanged(auth, (user) => {
    if (user) {
        const loggedInUserId = localStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            const docRef = doc(db, "users", loggedInUserId);
            getDoc(docRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    document.getElementById('loggedUserFName').innerText = userData.firstName;
                    document.getElementById('loggedUserEmail').innerText = userData.email;
                    document.getElementById('loggedUserLName').innerText = userData.lastName;
                } else {
                    console.log("No document found matching ID");
                }
            })
            .catch((error) => {
                console.error("Error getting document:", error);
            });
        } else {
            console.log("User ID not found in local storage");
        }
    } else {
        window.location.href = 'index.html'; // Redirect to login if not authenticated
    }
});

// Logout functionality
logoutButton.addEventListener('click', async () => {
    await signOut(auth);
    localStorage.removeItem('loggedInUserId');
    window.location.href = 'index.html';
});
