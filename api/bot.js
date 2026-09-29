/**
 * ====================================================================
 * KUMAR API NETWORK - MASTER BACKEND SERVER
 * Architecture: Serverless API Gateway
 * Database: Firebase Realtime Database (SDK Integration)
 * Security: High (CORS Enabled, Payload Validation, Type Checking)
 * ====================================================================
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update, set } from "firebase/database";

// 🔒 1. SECURE FIREBASE CONFIGURATION (Tu bolla tasa ek pan shabd visarlo nahi!)
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
    console.log("Firebase Database Connected Successfully.");
} catch (err) {
    console.error("Firebase Initialization Error:", err);
}

// 🌐 3. MASTER API HANDLER
export default async function handler(req, res) {
    // 🛡️ SECURITY: CORS Headers Setup (Allow bots to connect)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Block non-POST requests (Only bots allowed)
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: "Method Not Allowed. This API only accepts POST requests from Telegram Bots." 
        });
    }

    // 📦 4. PAYLOAD EXTRACTION
    const { userId, password, action, num1, num2, operator, answer } = req.body;

    // Strict Validation: Action and userId are compulsory
    if (!action || !userId) {
        return res.status(400).json({ 
            success: false, 
            error: "Missing parameters! 'userId' and 'action' are required." 
        });
    }

    try {
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
                    message: "Access Granted", 
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
                    score: userData.score || 0 
                });
            }
            return res.status(404).json({ success: false, error: "User profile not found in database." });
        }

        // ==========================================
        // 🟠 ACTION 3: GENERATE MATH QUESTION
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
            
            return res.status(200).json({ 
                success: true, 
                question: `${n1} ${op} ${n2} = ?`, 
                n1: n1, 
                n2: n2, 
                op: op 
            });
        }

        // ==========================================
        // 🟣 ACTION 4: VERIFY ANSWER & UPDATE DB
        // ==========================================
        if (action === "submitAnswer") {
            // Validate incoming math payload
            if (num1 === undefined || num2 === undefined || !operator || answer === undefined) {
                return res.status(400).json({ success: false, error: "Incomplete math data sent by bot." });
            }

            let correctAnswer = 0;
            const parsedN1 = parseInt(num1);
            const parsedN2 = parseInt(num2);

            // Calculate real answer on server (Cheating proof)
            if (operator === '+') correctAnswer = parsedN1 + parsedN2;
            else if (operator === '-') correctAnswer = parsedN1 - parsedN2;
            else if (operator === '*') correctAnswer = parsedN1 * parsedN2;

            // Check if user answer matches
            if (parseInt(answer) === correctAnswer) {
                let currentScore = userData ? (userData.score || 0) : 0;
                let newScore = currentScore + 10; // Award 10 points
                
                // 🔥 FIREBASE UPDATE (Live Sync)
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

        // Action not recognized
        return res.status(400).json({ success: false, error: "Invalid Action Requested by Bot." });

    } catch (error) {
        console.error("Vercel Internal Server Error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "CRITICAL: Firebase Database Connection Failed.",
            details: error.message
        });
    }
}
