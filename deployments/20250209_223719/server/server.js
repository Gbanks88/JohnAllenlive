const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid authorization token' });
    }
};

// Create payment intent
app.post('/api/create-payment-intent', authenticateUser, async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 10000, // $100 in cents
            currency: 'usd',
            metadata: {
                userId: req.user.uid
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create enrollment
app.post('/api/enrollments', authenticateUser, async (req, res) => {
    try {
        const enrollmentData = {
            userId: req.user.uid,
            enrollmentDate: admin.firestore.FieldValue.serverTimestamp(),
            totalEarnings: 0,
            totalHoursLearned: 0,
            status: 'active'
        };

        await db.collection('enrollments').doc(req.user.uid).set(enrollmentData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start learning session
app.post('/api/learning-sessions/start', authenticateUser, async (req, res) => {
    try {
        const sessionData = {
            userId: req.user.uid,
            startTime: admin.firestore.FieldValue.serverTimestamp(),
            status: 'in_progress'
        };

        const sessionRef = await db.collection('learning_sessions').add(sessionData);
        res.json({ sessionId: sessionRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End learning session
app.post('/api/learning-sessions/:sessionId/end', authenticateUser, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const sessionRef = db.collection('learning_sessions').doc(sessionId);
        const session = await sessionRef.get();

        if (!session.exists) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const sessionData = session.data();
        if (sessionData.userId !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Calculate duration and earnings
        const endTime = admin.firestore.Timestamp.now();
        const duration = (endTime.seconds - sessionData.startTime.seconds) / 3600; // Convert to hours
        const earnings = Math.round(duration * 100) / 100; // $1 per hour, rounded to 2 decimals

        // Update session
        await sessionRef.update({
            endTime,
            duration,
            earnings,
            status: 'completed'
        });

        // Update user's total earnings
        await db.collection('users').doc(req.user.uid).update({
            totalEarnings: admin.firestore.FieldValue.increment(earnings),
            totalHoursLearned: admin.firestore.FieldValue.increment(duration)
        });

        res.json({ duration, earnings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's learning stats
app.get('/api/users/stats', authenticateUser, async (req, res) => {
    try {
        const userRef = db.collection('users').doc(req.user.uid);
        const user = await userRef.get();

        if (!user.exists) {
            return res.json({ totalEarnings: 0, totalHoursLearned: 0 });
        }

        const userData = user.data();
        res.json({
            totalEarnings: userData.totalEarnings || 0,
            totalHoursLearned: userData.totalHoursLearned || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
