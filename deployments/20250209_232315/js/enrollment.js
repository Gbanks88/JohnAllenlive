// Enrollment and Payment Tracking System

class EnrollmentSystem {
    constructor() {
        this.enrollmentForm = document.getElementById('enrollmentForm');
        this.learningTimer = null;
        this.startTime = null;
        this.totalEarnings = 0;
        this.isTracking = false;
        this.userId = null;
        
        // Initialize Firebase Auth listener
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.userId = user.uid;
                this.loadUserData();
            }
        });
    }

    async loadUserData() {
        if (!this.userId) return;
        
        const userRef = firebase.firestore().collection('users').doc(this.userId);
        const doc = await userRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            this.totalEarnings = data.totalEarnings || 0;
            this.updateEarningsDisplay();
        }
    }

    async enroll() {
        try {
            // Create payment intent with Stripe
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: 10000, // $100 in cents
                    currency: 'usd'
                })
            });

            const { clientSecret } = await response.json();

            // Confirm payment with Stripe
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement('card'),
                    billing_details: {
                        email: firebase.auth().currentUser.email
                    }
                }
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            // Payment successful, create user enrollment
            await this.createEnrollment();
            
            // Show success message
            Swal.fire({
                title: 'Enrollment Successful!',
                text: 'Welcome to the AI Academy. Start learning and earning!',
                icon: 'success',
                confirmButtonText: 'Start Learning'
            }).then(() => {
                window.location.href = 'learn-ai.html';
            });

        } catch (error) {
            Swal.fire({
                title: 'Enrollment Failed',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        }
    }

    async createEnrollment() {
        const enrollmentData = {
            userId: this.userId,
            enrollmentDate: firebase.firestore.FieldValue.serverTimestamp(),
            totalEarnings: 0,
            totalHoursLearned: 0,
            status: 'active'
        };

        await firebase.firestore().collection('enrollments').doc(this.userId).set(enrollmentData);
    }

    startLearningSession() {
        if (!this.isTracking) {
            this.startTime = new Date();
            this.isTracking = true;
            
            // Update UI
            document.getElementById('startLearning').style.display = 'none';
            document.getElementById('stopLearning').style.display = 'block';
            
            // Start timer
            this.learningTimer = setInterval(() => {
                this.updateLearningTime();
            }, 1000);

            // Record session start
            this.recordSessionStart();
        }
    }

    stopLearningSession() {
        if (this.isTracking) {
            clearInterval(this.learningTimer);
            this.isTracking = false;
            
            // Calculate session duration
            const endTime = new Date();
            const duration = (endTime - this.startTime) / (1000 * 60 * 60); // Convert to hours
            
            // Update UI
            document.getElementById('startLearning').style.display = 'block';
            document.getElementById('stopLearning').style.display = 'none';
            
            // Record session end and earnings
            this.recordSessionEnd(duration);
        }
    }

    async recordSessionStart() {
        await firebase.firestore().collection('learning_sessions').add({
            userId: this.userId,
            startTime: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'in_progress'
        });
    }

    async recordSessionEnd(duration) {
        // Calculate earnings ($1 per hour)
        const earnings = Math.round(duration * 100) / 100; // Round to 2 decimal places
        
        // Update total earnings
        this.totalEarnings += earnings;
        
        // Update user record
        await firebase.firestore().collection('users').doc(this.userId).update({
            totalEarnings: firebase.firestore.FieldValue.increment(earnings),
            totalHoursLearned: firebase.firestore.FieldValue.increment(duration)
        });

        // Update UI
        this.updateEarningsDisplay();

        // Show session summary
        Swal.fire({
            title: 'Learning Session Complete!',
            html: `
                Duration: ${Math.round(duration * 100) / 100} hours<br>
                Earnings: $${earnings.toFixed(2)}<br>
                Total Earnings: $${this.totalEarnings.toFixed(2)}
            `,
            icon: 'success'
        });
    }

    updateLearningTime() {
        if (this.startTime && this.isTracking) {
            const currentTime = new Date();
            const duration = (currentTime - this.startTime) / 1000; // in seconds
            
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = Math.floor(duration % 60);
            
            document.getElementById('learningTime').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateEarningsDisplay() {
        const earningsDisplay = document.getElementById('totalEarnings');
        if (earningsDisplay) {
            earningsDisplay.textContent = `$${this.totalEarnings.toFixed(2)}`;
        }
    }
}

// Initialize enrollment system
const enrollmentSystem = new EnrollmentSystem();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const enrollButton = document.getElementById('enrollButton');
    if (enrollButton) {
        enrollButton.addEventListener('click', () => enrollmentSystem.enroll());
    }

    const startLearningBtn = document.getElementById('startLearning');
    if (startLearningBtn) {
        startLearningBtn.addEventListener('click', () => enrollmentSystem.startLearningSession());
    }

    const stopLearningBtn = document.getElementById('stopLearning');
    if (stopLearningBtn) {
        stopLearningBtn.addEventListener('click', () => enrollmentSystem.stopLearningSession());
    }
});
