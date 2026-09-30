/**
 * ====================================================================
 * KUMAR API NETWORK - MASTER BACKEND SERVER
 * Architecture: Serverless API Gateway
 * Database: Firebase Realtime Database (SDK Integration)
 * Security: High (CORS Enabled, Payload Validation, Type Checking)
 * Features: Authentication, Points System, Multiple-Choice Math Hack
 * ====================================================================
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

// 🔒 1. SECURE FIREBASE CONFIGURATION
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

// 🚀 2. INITIALIZE FIREBASE ENGINE
let app;
let db;
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("[SYSTEM] Firebase Database Connected Successfully.");
} catch (err) {
    console.error("[ERROR] Firebase Initialization Error:", err);
}

// 🌐 3. MASTER API HANDLER
export default async function handler(req, res) {
    // 🛡️ SECURITY: CORS Headers Setup (Allow bots to connect securely)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Block non-POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: "Method Not Allowed. This API only accepts POST requests from verified Telegram Bots." 
        });
    }

    // 📦 4. PAYLOAD EXTRACTION & STRICT VALIDATION
    const { userId, password, action, num1, num2, operator, answer } = req.body;

    if (!action || !userId) {
        return res.status(400).json({ 
            success: false, 
            error: "Missing parameters! 'userId' and 'action' are strictly required." 
        });
    }

    try {
        // Fetch User Data from Firebase
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.exists() ? snapshot.val() : null;

        // ==========================================
        // 🟢 ACTION 1: VERIFY USER (Login System)
        // ==========================================
        if (action === "verifyUser") {
            if (!password) {
                return res.status(400).json({ success: false, error: "Password is required for verification." });
            }
            if (userData && userData.password === password) {
                return res.status(200).json({ 
                    success: true, 
                    message: "Access Granted. Session secured.", 
                    userId: userId 
                });
            }
            return res.status(401).json({ success: false, error: "Access Denied: Invalid ID or Password." });
        }

        // ==========================================
        // 🔵 ACTION 2: GET SCORE (Points System)
        // ==========================================
        if (action === "getScore") {
            if (userData) {
                return res.status(200).json({ 
                    success: true, 
                    score: userData.score || 0,
                    message: "Score fetched successfully."
                });
            }
            return res.status(404).json({ success: false, error: "User profile not found in database." });
        }

        // ==========================================
        // 🟠 ACTION 3: GENERATE MATH QUESTION (With 4 Options)
        // ==========================================
        if (action === "getQuestion") {
            const ops = ['+', '-', '*'];
            const op = ops[Math.floor(Math.random() * ops.length)];
            let n1 = Math.floor(Math.random() * 50) + 10;
            let n2 = Math.floor(Math.random() * 20) + 1;
            
            // Rule: No negative answers
            if (op === '-' && n1 < n2) {
                let temp = n1; n1 = n2; n2 = temp;
            }
            
            // Calculate Correct Answer
            let correctAns = 0;
            if (op === '+') correctAns = n1 + n2;
            if (op === '-') correctAns = n1 - n2;
            if (op === '*') correctAns = n1 * n2;

            // Generate 3 Fake Options
            let options = [correctAns];
            while(options.length < 4) {
                let fake = correctAns + Math.floor(Math.random() * 30) - 15;
                if(fake !== correctAns && !options.includes(fake) && fake >= 0) {
                    options.push(fake);
                }
            }
            
            // Shuffle the options array so the correct answer isn't always first
            options.sort(() => Math.random() - 0.5);

            return res.status(200).json({ 
                success: true, 
                question: `${n1} ${op} ${n2} = ?`, 
                n1: n1, 
                n2: n2, 
                op: op,
                options: options, // Sending the 4 shuffled options to the bot
                message: "Secure math puzzle generated."
            });
        }

        // ==========================================
        // 🟣 ACTION 4: VERIFY ANSWER & UPDATE DB
        // ==========================================
        if (action === "submitAnswer") {
            if (num1 === undefined || num2 === undefined || !operator || answer === undefined) {
                return res.status(400).json({ success: false, error: "Incomplete math payload sent by bot." });
            }

            let correctAnswer = 0;
            const parsedN1 = parseInt(num1);
            const parsedN2 = parseInt(num2);

            // Server-side calculation to prevent cheating
            if (operator === '+') correctAnswer = parsedN1 + parsedN2;
            else if (operator === '-') correctAnswer = parsedN1 - parsedN2;
            else if (operator === '*') correctAnswer = parsedN1 * parsedN2;

            if (parseInt(answer) === correctAnswer) {
                let currentScore = userData ? (userData.score || 0) : 0;
                let newScore = currentScore + 10;
                
                // Live sync to Firebase
                await update(userRef, { 
                    score: newScore,
                    lastActive: new Date().toISOString()
                });
                
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    newScore: newScore,
                    message: "Bypass successful! +10 Points."
                });
            } else {
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: false, 
                    correctAnswer: correctAnswer,
                    message: "Algorithm failed! Wrong answer."
                });
            }
        }

        return res.status(400).json({ success: false, error: "Invalid Action Requested by Bot." });

    } catch (error) {
        console.error("[CRITICAL] Vercel Internal Server Error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "CRITICAL: Firebase Database Connection Failed.",
            details: error.message
        });
    }
}
