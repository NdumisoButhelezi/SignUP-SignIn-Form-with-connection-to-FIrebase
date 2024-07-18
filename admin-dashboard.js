import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBoW8PBB34KJATnqXqT9dSOl5Fl5iJ9yVk",
    authDomain: "newdb-719e2.firebaseapp.com",
    projectId: "newdb-719e2",
    storageBucket: "newdb-719e2.appspot.com",
    messagingSenderId: "151706210941",
    appId: "1:151706210941:web:6c557d88bd32a79447d714"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', async () => {
    const uploadButton = document.getElementById('uploadButton');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const logoutButton = document.getElementById('logoutButton');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await updateUploadedByHeader();
            await fetchAndDisplayUploads();
        } else {
            window.location.href = 'index.html'; // Redirect to login if not authenticated
        }
    });

    uploadButton.addEventListener('click', () => {
        const file = pdfFileInput.files[0];
        if (file && file.type === "application/pdf") {
            uploadPDF(file);
        } else {
            alert("Please select a valid PDF file.");
        }
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    });
});

async function updateUploadedByHeader() {
    const user = auth.currentUser;
    if (!user) {
        console.log("No user logged in");
        return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const uploadedByHeader = document.getElementById('uploadedByHeader');
        uploadedByHeader.textContent = `Uploaded by ${userData.firstName}`;
    } else {
        console.log("User data not found for UID:", user.uid);
    }
}

async function fetchAndDisplayUploads() {
    const uploadsList = document.getElementById('uploadsList');
    const querySnapshot = await getDocs(collection(db, 'pdfUploads'));
    let tableHTML = '';
    for (const doc of querySnapshot.docs) {
        const data = doc.data();
        let uploaderName = 'Unknown';  // Default name if user data can't be fetched

        if (data.uploaderId) {
            const userDocRef = doc(db, "users", data.uploaderId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                uploaderName = userData.firstName || 'Unknown';
            }
        }

        tableHTML += `
            <tr>
                <td>${data.filename}</td>
                <td>${data.numPages}</td>
                <td>R${data.totalCost.toFixed(2)}</td>
                <td>${uploaderName}</td>
                <td><button class="download-btn" data-url="${data.downloadURL}" data-filename="${data.filename}"><i class="fas fa-download"></i> Download</button></td>
            </tr>
        `;
    }
    uploadsList.innerHTML = tableHTML;

    // Attach event listeners to download buttons
    document.querySelectorAll('.download-btn').forEach(button => {
        button.addEventListener('click', function() {
            downloadPDF(this.getAttribute('data-url'), this.getAttribute('data-filename'));
        });
    });
}

function downloadPDF(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function uploadPDF(file) {
    const storageRef = ref(storage, `pdfs/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
        }, 
        (error) => {
            console.error('Upload failed:', error);
            alert('Upload failed, please try again.');
        }, 
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log('File available at', downloadURL);
                saveFileDataToFirestore(file.name, downloadURL);
            });
        }
    );
}

async function saveFileDataToFirestore(filename, downloadURL) {
    const fileMetadata = {
        filename: filename,
        downloadURL: downloadURL,
        uploadDate: new Date(),
        uploaderId: auth.currentUser.uid
    };

    try {
        const docRef = await addDoc(collection(db, "pdfUploads"), fileMetadata);
        console.log("Document written with ID: ", docRef.id);
        alert('PDF uploaded successfully and metadata saved!');
    } catch (error) {
        console.error("Error adding document: ", error);
        alert('Error saving PDF details. Please try again.');
    }
}
