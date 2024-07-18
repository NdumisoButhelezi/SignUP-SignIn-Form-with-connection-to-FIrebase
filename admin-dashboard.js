import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBoW8PBB34KJATnqXqT9dSOl5Fl5iJ9yVk",
    authDomain: "newdb-719e2.firebaseapp.com",
    projectId: "newdb-719e2",
    storageBucket: "newdb-719e2.appspot.com",
    messagingSenderId: "151706210941",
    appId: "1:151706210941:web:6c557d88bd32a79447d714"
}
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    loadUsers();

    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            localStorage.removeItem('loggedInUserId');
            localStorage.removeItem('isAdmin');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    });
});

async function loadUsers() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const userElement = document.createElement('div');
        userElement.textContent = `${userData.firstName} ${userData.lastName} (${userData.email}) - Admin: ${userData.isAdmin}`;
        userList.appendChild(userElement);
    });
}
