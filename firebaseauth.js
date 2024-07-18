// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyBoW8PBB34KJATnqXqT9dSOl5Fl5iJ9yVk",
    authDomain: "newdb-719e2.firebaseapp.com",
    projectId: "newdb-719e2",
    storageBucket: "newdb-719e2.appspot.com",
    messagingSenderId: "151706210941",
    appId: "1:151706210941:web:6c557d88bd32a79447d714"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

async function createHardcodedAdmin() {
    const adminEmail = "admin@example.com";
    const adminPassword = "adminPassword123!";
    const adminFirstName = "Admin";
    const adminLastName = "User";

    // Check if admin already exists
    const querySnapshot = await getDocs(query(collection(db, "users"), where("email", "==", adminEmail)));
    if (!querySnapshot.empty) {
        console.log("Admin account already exists with this email");
        return;
    }

    createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
    .then((userCredential) => {
        // Admin account creation success
        const user = userCredential.user;
        const userData = {
            email: adminEmail,
            firstName: adminFirstName,
            lastName: adminLastName,
            isAdmin: true
        };
        const docRef = doc(db, "users", user.uid);
        setDoc(docRef, userData)
        .then(() => {
            console.log("Admin account created successfully");
        })
        .catch((error) => {
            console.error("Error setting admin document:", error);
        });
    })
    .catch((error) => {
        console.error("Error creating admin account:", error);
    });
}

function showMessage(message, divId) {
    var messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(function() {
        messageDiv.style.opacity = 0;
    }, 5000);
}

const signUp = document.getElementById('submitSignUp');
signUp.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;

    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        const userData = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            isAdmin: false // Regular users are not admins
        };
        showMessage('Account Created Successfully', 'signUpMessage');
        const docRef = doc(db, "users", user.uid);
        setDoc(docRef, userData)
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error("Error writing document", error);
        });
    })
    .catch((error) => {
        const errorCode = error.code;
        if (errorCode == 'auth/email-already-in-use') {
            showMessage('Email Address Already Exists !!!', 'signUpMessage');
        } else {
            showMessage('Unable to create User', 'signUpMessage');
        }
    });
});

const signIn = document.getElementById('submitSignIn');
signIn.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        const docRef = doc(db, "users", user.uid);
        getDoc(docRef).then((docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                localStorage.setItem('loggedInUserId', user.uid);
                localStorage.setItem('isAdmin', userData.isAdmin);
                showMessage('Login successful', 'signInMessage');
                if (userData.isAdmin) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'homepage.html';
                }
            }
        });
    })
    .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/invalid-credential') {
            showMessage('Incorrect Email or Password', 'signInMessage');
        } else {
            showMessage('Account does not Exist', 'signInMessage');
        }
    });
});


