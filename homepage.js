import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, getDoc, doc, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const storage = getStorage();

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('pdf-file');
    const preview = document.getElementById('preview');
    const result = document.getElementById('result');
    const payButton = document.getElementById('pay-button');
    const logoutButton = document.getElementById('logout');

    onAuthStateChanged(auth, (user) => {
        const loggedInUserId = localStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            currentUser = user;
            console.log(user);
            const docRef = doc(db, "users", loggedInUserId);
            getDoc(docRef)
                .then((docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        document.getElementById('loggedUserFName').innerText = userData.firstName;
                        document.getElementById('loggedUserEmail').innerText = userData.email;
                        document.getElementById('loggedUserLName').innerText = userData.lastName;
                    } else {
                        console.log("No document found matching id");
                    }
                })
                .catch((error) => {
                    console.log("Error getting document:", error);
                });
        } else {
            console.log("User Id not Found in Local storage");
            window.location.href = 'index.html'; // Redirect to login if not authenticated
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('loggedInUserId');
        signOut(auth)
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Error Signing out:', error);
            });
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', function(e) {
        handleFile(this.files[0]);
    });

    payButton.addEventListener('click', function() {
        alert('Proceeding to payment... (This is a placeholder for the actual payment process)');
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropArea.classList.add('highlight');
    }

    function unhighlight(e) {
        dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }

    function handleFile(file) {
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();

            reader.onload = function(e) {
                const typedarray = new Uint8Array(e.target.result);

                pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                    const numPages = pdf.numPages;
                    const totalCost = numPages * 50;
                    result.innerHTML = `
                        Number of pages: ${numPages}<br>
                        Total cost: R${totalCost.toFixed(2)}
                    `;
                    payButton.style.display = 'inline-block';

                    // Render the first page as preview
                    pdf.getPage(1).then(function(page) {
                        const scale = 1.5;
                        const viewport = page.getViewport({ scale: scale });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        page.render(renderContext);

                        preview.innerHTML = '';
                        preview.appendChild(canvas);
                    });

                    // Upload file to Firebase Storage
                    uploadFileToStorage(file, numPages, totalCost);
                }).catch(function(error) {
                    console.error(error);
                    result.innerHTML = 'Error processing PDF. Please try again.';
                });
            };

            reader.readAsArrayBuffer(file);
        } else {
            alert('Please select a valid PDF file.');
        }
    }

    function uploadFileToStorage(file, numPages, totalCost) {
        if (!currentUser) {
            alert('Please log in to upload files.');
            return;
        }

        const storageRef = ref(storage, `pdfs/${currentUser.uid}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            },
            (error) => {
                console.error('Error uploading file:', error);
                alert('Error uploading file. Please try again.');
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log('File available at', downloadURL);
                    savePdfDetailsToFirestore(file, downloadURL, numPages, totalCost);
                });
            }
        );
    }

    function savePdfDetailsToFirestore(file, downloadURL, numPages, totalCost) {
        const pdfData = {
            filename: file.name,
            numPages: numPages,
            totalCost: totalCost,
            uploadTime: new Date(),
            downloadURL: downloadURL,
            userId: currentUser.uid
        };

        addDoc(collection(db, "pdfUploads"), pdfData)
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
                payButton.style.display = 'inline-block';
                alert('PDF uploaded successfully. You can now proceed to payment.');
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
                alert('Error saving PDF details. Please try again.');
            });
    }
});