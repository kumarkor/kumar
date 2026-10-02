/**
 * =========================================================================================
 * █▄▀ █░█ █▀▄▀█ ▄▀█ █▀█ ░ ▄▀█ █▀█ █ ░ █▄░█ █▀▀ ▀█▀ █░█ █▀█ █▀█ █▄▀
 * █░█ █▄█ █░▀░█ █▀█ █▀▄ ▄ █▀█ █▀▀ █ ▄ █░▀█ ██▄ ░█░ ▀▄▀ █▄█ █▀▄ █░█
 * 
 * MASTER BACKEND SERVER - VERSION 11.0 (ULTIMATE EDITION)
 * Architecture: Serverless API Gateway (Firebase Integrated)
 * Features: Type X Boosters, Global Admin Events, Mega Exams, Stacking Math
 * =========================================================================================
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update, set } from "firebase/database";

// 🔒 =======================================================================
// MODULE 1: SECURE FIREBASE CONFIGURATION
// =======================================================================
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

let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("[SYSTEM] Firebase Connected Successfully.");
} catch (err) {
    console.error("Firebase Error:", err);
}

// 🛠️ =======================================================================
// MODULE 2: HELPER FUNCTIONS (MULTIPLIER MATH & LOGS)
// =======================================================================

// Gets User's Personal Multiplier (Custom X)
const getUserBoosterX = (userData) => {
    if (userData && userData.booster && userData.booster.expires) {
        if (userData.booster.expires > Date.now()) {
            return parseInt(userData.booster.multiplier) || 1;
        }
    }
    return 1;
};

// Gets Global Event Multiplier from Database
const getGlobalEventX = async () => {
    try {
        const eventRef = ref(db, 'serverSettings/event');
        const snapshot = await get(eventRef);
        const eventData = snapshot.exists() ? snapshot.val() : null;
        
        if (eventData && eventData.active) {
            return parseInt(eventData.multiplier) || 1;
        }
        return 1;
    } catch (e) {
        return 1; // Fallback to 1x on error
    }
};

const generateTerminalLog = (action, userId) => {
    return `[${new Date().toISOString()}] AUTH:#${userId} | ACTION:${action} | SECURE:TRUE`;
};

// 🌐 =======================================================================
// MODULE 3: MASTER API HANDLER
// =======================================================================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: "Only POST allowed." });

    const { userId, action, num1, num2, operator, answer, n3, password, itemCode, customX, customH } = req.body;

    if (!action || !userId) {
        return res.status(400).json({ success: false, error: "Missing userId or action." });
    }

    try {
        // Fetch User Data
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.exists() ? snapshot.val() : null;

        // Fetch Both Multipliers
        const userX = getUserBoosterX(userData);
        const eventX = await getGlobalEventX();
        
        // 🚨 CRITICAL STACKING FORMULA: Total X = User Boost X * Global Event X
        const finalMultiplier = userX * eventX;

        // ==========================================
        // 🟢 ACTION 1: VERIFY USER
        // ==========================================
        if (action === "verifyUser") {
            if (userData && userData.password === password) {
                return res.status(200).json({ 
                    success: true, 
                    userId: userId,
                    terminal_log: generateTerminalLog("LOGIN", userId)
                });
            }
            return res.status(401).json({ success: false, error: "Access Denied." });
        }

        // ==========================================
        // 🔵 ACTION 2: GET SCORE
        // ==========================================
        if (action === "getScore") {
            if (userData) {
                return res.status(200).json({ 
                    success: true, 
                    score: userData.score || 0,
                    userMultiplier: userX,
                    eventMultiplier: eventX,
                    finalMultiplier: finalMultiplier,
                    terminal_log: generateTerminalLog("FETCH_SCORE", userId)
                });
            }
            return res.status(404).json({ success: false, error: "User not found." });
        }

        // ==========================================
        // 🟠 ACTION 3: GET QUESTION
        // ==========================================
        if (action === "getQuestion") {
            const ops = ['+', '-', '*'];
            const op = ops[Math.floor(Math.random() * ops.length)];
            let n1 = Math.floor(Math.random() * 50) + 10;
            let n2 = Math.floor(Math.random() * 20) + 1;
            
            if (op === '-' && n1 < n2) { let temp = n1; n1 = n2; n2 = temp; }
            
            let correctAns = 0;
            if (op === '+') correctAns = n1 + n2;
            if (op === '-') correctAns = n1 - n2;
            if (op === '*') correctAns = n1 * n2;

            let options = [correctAns];
            while(options.length < 4) {
                let fake = correctAns + Math.floor(Math.random() * 30) - 15;
                if(fake !== correctAns && !options.includes(fake) && fake >= 0) options.push(fake);
            }
            options.sort(() => Math.random() - 0.5);

            return res.status(200).json({ 
                success: true, 
                question: `${n1} ${op} ${n2} = ?`, 
                n1, n2, op, options,
                terminal_log: generateTerminalLog("GET_HACK", userId)
            });
        }

        // ==========================================
        // 🟣 ACTION 4: SUBMIT ANSWER (DYNAMIC REWARDS)
        // ==========================================
        if (action === "submitAnswer") {
            let correctAns = 0;
            const p1 = parseInt(num1), p2 = parseInt(num2);

            if (operator === '+') correctAns = p1 + p2;
            else if (operator === '-') correctAns = p1 - p2;
            else if (operator === '*') correctAns = p1 * p2;

            if (parseInt(answer) === correctAns) {
                // Base points is 10. Multiply by Stacked Multiplier.
                let earned = 10 * finalMultiplier; 
                let newScore = (userData ? userData.score || 0 : 0) + earned;
                
                await update(userRef, { score: newScore });
                
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    newScore: newScore,
                    earned: earned,          
                    multiplier: finalMultiplier,  
                    terminal_log: generateTerminalLog("SOLVE_HACK", userId)
                });
            } else {
                return res.status(200).json({ success: true, isCorrect: false, correctAnswer: correctAns });
            }
        }

        // ==========================================
        // 🔥 ACTION 5: GET MEGA EXAM
        // ==========================================
        if (action === "getMegaExam") {
            let n1 = Math.floor(Math.random() * 15) + 5;
            let n2 = Math.floor(Math.random() * 10) + 2;
            let n3 = Math.floor(Math.random() * 50) + 10;
            
            let correctAns = (n1 * n2) + n3;
            let options = [correctAns];
            while(options.length < 4) {
                let fake = correctAns + Math.floor(Math.random() * 50) - 25;
                if(fake !== correctAns && !options.includes(fake) && fake >= 0) options.push(fake);
            }
            options.sort(() => Math.random() - 0.5);

            return res.status(200).json({ success: true, question: `(${n1} * ${n2}) + ${n3} = ?`, n1, n2, n3, op: 'mega', options });
        }

        // ==========================================
        // 💥 ACTION 6: SUBMIT MEGA EXAM
        // ==========================================
        if (action === "submitMegaExam") {
            const p1 = parseInt(num1), p2 = parseInt(num2), p3 = parseInt(n3);
            let correctAns = (p1 * p2) + p3;

            if (parseInt(answer) === correctAns) {
                // Base points is 50. Multiply by Stacked Multiplier.
                let earned = 50 * finalMultiplier;
                let newScore = (userData ? userData.score || 0 : 0) + earned;
                
                await update(userRef, { score: newScore });
                
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    newScore: newScore,
                    earned: earned,
                    multiplier: finalMultiplier
                });
            } else {
                return res.status(200).json({ success: true, isCorrect: false, correctAnswer: correctAns });
            }
        }

        // ==========================================
        // 🛒 ACTION 7: BUY CUSTOM X BOOSTER
        // ==========================================
        if (action === "buyCustomBooster") {
            let reqX = parseInt(customX) || 2;
            let reqH = parseInt(customH) || 1;

            if(reqX < 2) reqX = 2;
            if(reqX > 10) reqX = 10;

            const baseRate = reqH === 1 ? 75 : 250;
            let cost = reqX * baseRate;

            let currentScore = userData ? userData.score || 0 : 0;
            if (currentScore < cost) {
                return res.status(200).json({ success: false, error: `Insufficient Points. Need ${cost}.` });
            }

            const expiresAt = Date.now() + (reqH * 60 * 60 * 1000);
            let newScore = currentScore - cost;

            await update(userRef, { score: newScore, booster: { multiplier: reqX, expires: expiresAt } });

            return res.status(200).json({ 
                success: true, 
                message: `✅ ${reqX}x Booster Activated for ${reqH}H!`, 
                newScore: newScore 
            });
        }

        return res.status(400).json({ success: false, error: "Invalid Action." });

    } catch (error) {
        console.error("Vercel Error:", error);
        return res.status(500).json({ success: false, error: "Server Error", details: error.message });
    }
}
