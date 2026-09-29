import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, update } from "firebase/database";

// 🔒 1. SECURE FIREBASE CONFIGURATION (Hidden from users)
const firebaseConfig = {
    apiKey: "AIzaSyDkmoIzcYsYTBYwIk2A_8hUXWW5znyeTaY",
    authDomain: "newkumarbot.firebaseapp.com",
    databaseURL: "https://newkumarbot-default-rtdb.firebaseio.com",
    projectId: "newkumarbot",
    storageBucket: "newkumarbot.firebasestorage.app",
    messagingSenderId: "1006933600404",
    appId: "1:1006933600404:web:1df122474a7598a25fec81",
    measurementId: "G-PMQ8SCYQC9"
};

// Initialize Firebase Admin
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🚀 2. THE MAIN API GATEWAY (Handles all Bot requests)
export default async function handler(req, res) {
    // CORS Headers for secure cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        const { userId, password, action, num1, num2, operator, answer } = req.body;

        try {
            // ==========================================
            // ACTION 1: VERIFY USER (Login verification)
            // ==========================================
            if (action === "verifyUser") {
                const snapshot = await get(ref(db, `users/${userId}`));
                if (snapshot.exists() && snapshot.val().password === password) {
                    return res.status(200).json({ success: true, message: "Access Granted" });
                }
                return res.status(401).json({ success: false, error: "Invalid ID or Password" });
            }

            // ==========================================
            // ACTION 2: GET SCORE (Fetch points)
            // ==========================================
            if (action === "getScore") {
                const snapshot = await get(ref(db, `users/${userId}`));
                if (snapshot.exists()) {
                    return res.status(200).json({ success: true, score: snapshot.val().score || 0 });
                }
                return res.status(404).json({ success: false, error: "User not found" });
            }

            // ==========================================
            // ACTION 3: GENERATE MATH QUESTION FOR BOT
            // ==========================================
            if (action === "getQuestion") {
                const ops = ['+', '-', '*'];
                const op = ops[Math.floor(Math.random() * ops.length)];
                let n1 = Math.floor(Math.random() * 20) + 5;
                let n2 = Math.floor(Math.random() * 10) + 1;
                
                // Prevent negative answers
                if (op === '-' && n1 < n2) { let temp = n1; n1 = n2; n2 = temp; }
                
                return res.status(200).json({ 
                    success: true, 
                    question: `${n1} ${op} ${n2} = ?`,
                    n1: n1, 
                    n2: n2, 
                    op: op 
                });
            }

            // ==========================================
            // ACTION 4: SUBMIT & VERIFY ANSWER FROM BOT
            // ==========================================
            if (action === "submitAnswer") {
                let correctAnswer = 0;
                if (operator === '+') correctAnswer = num1 + num2;
                if (operator === '-') correctAnswer = num1 - num2;
                if (operator === '*') correctAnswer = num1 * num2;

                if (parseInt(answer) === correctAnswer) {
                    // Update Firebase Score
                    const userRef = ref(db, `users/${userId}`);
                    const snapshot = await get(userRef);
                    let currentScore = snapshot.exists() ? (snapshot.val().score || 0) : 0;
                    let newScore = currentScore + 10; // +10 points for correct answer
                    
                    await update(userRef, { score: newScore });
                    
                    return res.status(200).json({ success: true, isCorrect: true, newScore: newScore });
                } else {
                    return res.status(200).json({ success: true, isCorrect: false, correctAnswer: correctAnswer });
                }
            }

            return res.status(400).json({ success: false, error: "Invalid Action Requested" });

        } catch (error) {
            return res.status(500).json({ success: false, error: "Server Database Error: " + error.message });
        }
    }
    
    // Default GET response
    res.status(200).json({ status: "Kumar API Network is Online & Secure. Only POST requests allowed." });
}
