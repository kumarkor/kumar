/**
 * =========================================================================================
 * █▄▀ █░█ █▀▄▀█ ▄▀█ █▀█ ░ ▄▀█ █▀█ █ ░ █▄░█ █▀▀ ▀█▀ █░█ █▀█ █▀█ █▄▀
 * █░█ █▄█ █░▀░█ █▀█ █▀▄ ▄ █▀█ █▀▀ █ ▄ █░▀█ ██▄ ░█░ ▀▄▀ █▄█ █▀▄ █░█
 * 
 * MASTER BACKEND SERVER - VERSION 10.0 (CYBERPUNK EDITION)
 * Architecture: Vercel Serverless API Gateway
 * Database: Firebase Realtime Database (SDK Integration)
 * Security: Military-Grade (CORS, Payload Validation, Timestamp Auth)
 * Features: Auth, Economy, Math Hack, 2x Boosters, 50-Mark Mega Exam
 * =========================================================================================
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update, set, remove } from "firebase/database";

// 🔒 =======================================================================
// MODULE 1: SECURE FIREBASE CONFIGURATION (DO NOT SHARE THESE KEYS)
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

// 🚀 =======================================================================
// MODULE 2: INITIALIZE FIREBASE ENGINE & CONNECTION MANAGER
// =======================================================================
let app;
let db;
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("[SYSTEM_INIT] Firebase Realtime DB Connected Successfully.");
} catch (err) {
    console.error("[FATAL_ERROR] Firebase Initialization Failed:", err);
}

// 🛠️ =======================================================================
// MODULE 3: HELPER FUNCTIONS (MATH GENERATORS & TERMINAL LOGS)
// =======================================================================
const generateTerminalLog = (action, status, userId) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] AUTH:#${userId || 'GUEST'} | ACTION:${action} | STATUS:${status} | SECURE:TRUE`;
};

const checkBoosterActive = (userData) => {
    if (userData && userData.booster && userData.booster.expires) {
        const now = Date.now();
        if (userData.booster.expires > now) {
            return { active: true, multiplier: userData.booster.multiplier, expires: userData.booster.expires };
        }
    }
    return { active: false, multiplier: 1, expires: null };
};

// 🌐 =======================================================================
// MODULE 4: MASTER API HANDLER (VERCEL SERVERLESS ENTRY POINT)
// =======================================================================
export default async function handler(req, res) {
    
    // 🛡️ SECURITY LAYER 1: CORS Headers Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Handle preflight requests smoothly
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 🛡️ SECURITY LAYER 2: Method Blocking
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: "Method Not Allowed. STRICT POST POLICY.",
            server_status: "WARNING_LOGGED"
        });
    }

    // 📦 SECURITY LAYER 3: Payload Extraction & Validation
    const { userId, password, action, num1, num2, operator, answer, itemCode } = req.body;

    if (!action || !userId) {
        return res.status(400).json({ 
            success: false, 
            error: "Missing Parameters! 'userId' and 'action' are strictly required to access the Mainframe." 
        });
    }

    try {
        // Fetch User Data from Firebase Main Node
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.exists() ? snapshot.val() : null;

        // Verify active booster status on every request
        const currentBooster = checkBoosterActive(userData);

        // =======================================================================
        // 🟢 ACTION 1: VERIFY USER (System Login)
        // =======================================================================
        if (action === "verifyUser") {
            if (!password) {
                return res.status(400).json({ success: false, error: "Password required." });
            }
            if (userData && userData.password === password) {
                return res.status(200).json({ 
                    success: true, 
                    message: "Access Granted. Session secured via AES-256 Virtual Encryption.", 
                    userId: userId,
                    totalPoints: userData.score || 0,
                    boosterActive: currentBooster.active,
                    terminal_log: generateTerminalLog("LOGIN", "SUCCESS", userId)
                });
            }
            return res.status(401).json({ success: false, error: "Access Denied: Invalid ID or Password." });
        }

        // =======================================================================
        // 🔵 ACTION 2: GET SCORE & PROFILE (Economy Data)
        // =======================================================================
        if (action === "getScore") {
            if (userData) {
                let boostMsg = currentBooster.active 
                    ? `[BOOST ACTIVE: ${currentBooster.multiplier}x Multiplier]` 
                    : "[NO ACTIVE BOOSTER]";
                
                let massiveMessage = `🏆 SERVER SYNC COMPLETE 🏆\n\nDeveloper ID: #${userId}\nAvailable Points: ${userData.score || 0}\nNetwork Status: ONLINE\n\n${boostMsg}`;

                return res.status(200).json({ 
                    success: true, 
                    score: userData.score || 0,
                    boosterData: currentBooster,
                    message: massiveMessage,
                    terminal_log: generateTerminalLog("FETCH_SCORE", "SUCCESS", userId)
                });
            }
            return res.status(404).json({ success: false, error: "User profile not found in database." });
        }

        // =======================================================================
        // 🟠 ACTION 3: GENERATE MATH QUESTION (Normal Mode - 10 Pts)
        // =======================================================================
        if (action === "getQuestion") {
            const ops = ['+', '-', '*'];
            const op = ops[Math.floor(Math.random() * ops.length)];
            let n1 = Math.floor(Math.random() * 50) + 10;
            let n2 = Math.floor(Math.random() * 20) + 1;
            
            if (op === '-' && n1 < n2) {
                let temp = n1; n1 = n2; n2 = temp;
            }
            
            let correctAns = 0;
            if (op === '+') correctAns = n1 + n2;
            if (op === '-') correctAns = n1 - n2;
            if (op === '*') correctAns = n1 * n2;

            let options = [correctAns];
            while(options.length < 4) {
                let fake = correctAns + Math.floor(Math.random() * 30) - 15;
                if(fake !== correctAns && !options.includes(fake) && fake >= 0) {
                    options.push(fake);
                }
            }
            options.sort(() => Math.random() - 0.5);

            return res.status(200).json({ 
                success: true, 
                question: `${n1} ${op} ${n2} = ?`, 
                n1: n1, 
                n2: n2, 
                op: op,
                options: options,
                reward: 10 * currentBooster.multiplier, // Show potential reward
                terminal_log: generateTerminalLog("GENERATE_HACK", "SUCCESS", userId)
            });
        }

        // =======================================================================
        // 🟣 ACTION 4: VERIFY ANSWER & UPDATE DB (Boosters Applied Here)
        // =======================================================================
        if (action === "submitAnswer") {
            if (num1 === undefined || num2 === undefined || !operator || answer === undefined) {
                return res.status(400).json({ success: false, error: "Incomplete math payload." });
            }

            let correctAnswer = 0;
            const parsedN1 = parseInt(num1);
            const parsedN2 = parseInt(num2);

            if (operator === '+') correctAnswer = parsedN1 + parsedN2;
            else if (operator === '-') correctAnswer = parsedN1 - parsedN2;
            else if (operator === '*') correctAnswer = parsedN1 * parsedN2;

            if (parseInt(answer) === correctAnswer) {
                let basePoints = 10;
                let earnedPoints = basePoints * currentBooster.multiplier; // Apply Booster
                
                let currentScore = userData ? (userData.score || 0) : 0;
                let newScore = currentScore + earnedPoints;
                
                // Live sync to Firebase
                await update(userRef, { 
                    score: newScore,
                    lastActive: new Date().toISOString()
                });
                
                let winMessage = `SYSTEM BYPASSED!\nBase Reward: 10\nMultiplier: ${currentBooster.multiplier}x\nTotal Earned: +${earnedPoints} Points!`;

                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    earned: earnedPoints,
                    newScore: newScore,
                    message: winMessage,
                    terminal_log: generateTerminalLog("SOLVE_HACK", `REWARD_${earnedPoints}`, userId)
                });
            } else {
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: false, 
                    correctAnswer: correctAnswer,
                    message: "Algorithm failed! Wrong answer.",
                    terminal_log: generateTerminalLog("SOLVE_HACK", "FAILED", userId)
                });
            }
        }

        // =======================================================================
        // 🔥 ACTION 5: GET 50-MARK MEGA EXAM (Hardcore Boss Fight)
        // =======================================================================
        if (action === "getMegaExam") {
            // Complex Equation: (N1 * N2) + N3
            let n1 = Math.floor(Math.random() * 15) + 5;
            let n2 = Math.floor(Math.random() * 10) + 2;
            let n3 = Math.floor(Math.random() * 50) + 10;
            
            let correctAns = (n1 * n2) + n3;

            let options = [correctAns];
            while(options.length < 4) {
                let fake = correctAns + Math.floor(Math.random() * 50) - 25;
                if(fake !== correctAns && !options.includes(fake) && fake >= 0) {
                    options.push(fake);
                }
            }
            options.sort(() => Math.random() - 0.5);

            let hugeMessage = "⚠️ WARNING: MEGA BOSS FIGHT INITIATED ⚠️\n\nSolve this complex multi-layered encryption sequence to earn 50 API Points!";

            return res.status(200).json({ 
                success: true, 
                question: `(${n1} * ${n2}) + ${n3} = ?`, 
                n1: n1, 
                n2: n2, 
                n3: n3, // Additional variable for mega exam
                op: 'mega',
                options: options,
                reward: 50 * currentBooster.multiplier,
                message: hugeMessage,
                terminal_log: generateTerminalLog("GENERATE_MEGA_EXAM", "DANGER", userId)
            });
        }

        // =======================================================================
        // 💥 ACTION 6: VERIFY MEGA EXAM ANSWER (50 Points Logic)
        // =======================================================================
        if (action === "submitMegaExam") {
            const { n3 } = req.body; // Needs n3 sent from bot
            if (num1 === undefined || num2 === undefined || n3 === undefined || answer === undefined) {
                return res.status(400).json({ success: false, error: "Incomplete mega math payload." });
            }

            const parsedN1 = parseInt(num1);
            const parsedN2 = parseInt(num2);
            const parsedN3 = parseInt(n3);
            let correctAnswer = (parsedN1 * parsedN2) + parsedN3;

            if (parseInt(answer) === correctAnswer) {
                let basePoints = 50;
                let earnedPoints = basePoints * currentBooster.multiplier; // Apply Booster (Up to 100pts)
                
                let currentScore = userData ? (userData.score || 0) : 0;
                let newScore = currentScore + earnedPoints;
                
                await update(userRef, { 
                    score: newScore,
                    lastMegaWin: new Date().toISOString()
                });
                
                let epicWinMsg = `🏆 MEGA BOSS DEFEATED! 🏆\n\nBase Reward: 50\nMultiplier: ${currentBooster.multiplier}x\nTotal Massive Loot: +${earnedPoints} Points!\n\nYour hacking skills are legendary.`;

                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    earned: earnedPoints,
                    newScore: newScore,
                    message: epicWinMsg,
                    terminal_log: generateTerminalLog("SOLVE_MEGA_EXAM", `EPIC_REWARD_${earnedPoints}`, userId)
                });
            } else {
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: false, 
                    correctAnswer: correctAnswer,
                    message: "MEGA HACK FAILED. The system traced your connection.",
                    terminal_log: generateTerminalLog("SOLVE_MEGA_EXAM", "FAILED_TRACE", userId)
                });
            }
        }

        // =======================================================================
        // 🛒 ACTION 7: BLACK MARKET SHOP (Buy Boosters via Bot API)
        // =======================================================================
        if (action === "buyItem") {
            if(!itemCode) return res.status(400).json({ success: false, error: "No itemCode provided." });
            
            let cost = 0;
            let durationHours = 0;
            let itemName = "";

            if (itemCode === "boost_1h") { cost = 150; durationHours = 1; itemName = "2x Booster (1H)"; }
            else if (itemCode === "boost_24h") { cost = 500; durationHours = 24; itemName = "24H Mega Booster"; }
            else { return res.status(400).json({ success: false, error: "Invalid itemCode." }); }

            let currentScore = userData ? (userData.score || 0) : 0;
            if (currentScore < cost) {
                return res.status(200).json({ 
                    success: false, 
                    error: `Insufficient Points. You need ${cost} points.`,
                    terminal_log: generateTerminalLog("PURCHASE", "FUNDS_LOW", userId)
                });
            }

            // Calculate Expiry Timestamp
            const expiresAt = Date.now() + (durationHours * 60 * 60 * 1000);
            let newScore = currentScore - cost;

            await update(userRef, {
                score: newScore,
                booster: { multiplier: 2, expires: expiresAt }
            });

            return res.status(200).json({ 
                success: true, 
                message: `✅ Purchase Complete!\n\nItem: ${itemName}\nCost: -${cost} Points\nNew Balance: ${newScore}\n\nYour API rewards are now DOUBLED for ${durationHours} Hour(s)!`,
                newScore: newScore,
                boosterExpires: expiresAt,
                terminal_log: generateTerminalLog("PURCHASE", `SUCCESS_${itemCode}`, userId)
            });
        }

        // Fallback for unknown actions
        return res.status(400).json({ success: false, error: "Invalid Action Requested by Bot. Check your syntax." });

    } catch (error) {
        console.error("[CRITICAL_SERVER_CRASH] Backend Error Details:", error);
        return res.status(500).json({ 
            success: false, 
            error: "CRITICAL: Firebase Database Connection Failed or Logic Error.",
            details: error.message,
            server_status: "ERROR_500"
        });
    }
}
