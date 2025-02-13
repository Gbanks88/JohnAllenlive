// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "test1-157723.firebaseapp.com",
    projectId: "test1-157723",
    storageBucket: "test1-157723.appspot.com",
    messagingSenderId: "xxxxxxxxxxxx",
    appId: "1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxxxxxx",
    measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        document.body.classList.add('user-signed-in');
        updateUIForSignedInUser(user);
    } else {
        // User is signed out
        console.log('User is signed out');
        document.body.classList.remove('user-signed-in');
        updateUIForSignedOutUser();
    }
});

// Update UI based on auth state
function updateUIForSignedInUser(user) {
    const authButtons = document.querySelectorAll('.auth-dependent');
    authButtons.forEach(button => {
        button.style.display = 'block';
    });
    
    // Update user profile elements
    const userElements = document.querySelectorAll('.user-profile');
    userElements.forEach(element => {
        element.textContent = user.email;
    });
}

function updateUIForSignedOutUser() {
    const authButtons = document.querySelectorAll('.auth-dependent');
    authButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Clear user profile elements
    const userElements = document.querySelectorAll('.user-profile');
    userElements.forEach(element => {
        element.textContent = '';
    });
}
