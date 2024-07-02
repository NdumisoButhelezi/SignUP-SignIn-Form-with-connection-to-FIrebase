import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBEwPq1-u1qL4vW499YjkqkGKjH67d0-T0",
    authDomain: "newproto-49e08.firebaseapp.com",
    projectId: "newproto-49e08",
    storageBucket: "newproto-49e08.appspot.com",
    messagingSenderId: "255983493498",
    appId: "1:255983493498:web:7f94fc55a83607268f76c3",
    measurementId: "G-040K87PQ9T"
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
