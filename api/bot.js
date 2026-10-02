/**
 * =========================================================================================
 * KUMAR API NETWORK - MASTER BACKEND SERVER
 * Architecture: Serverless API Gateway (Firebase Integrated)
 * Features: 2x Boosters, Dynamic Rewards, Mega Exams, Mota JSON Payload
 * =========================================================================================
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDkmoIzcYsYTBYwIk2A_8hUXWW5znyeTaY",
    authDomain: "newkumarbot.firebaseapp.com",
    databaseURL: "https://newkumarbot-default-rtdb.firebaseio.com",
    projectId: "newkumarbot",
    storageBucket: "newkumarbot.firebasestorage.app",
    messagingSenderId: "1006933600404",
    appId: "1:1006933600404:web:1df122474a7598a25fec81"
};

let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
} catch (err) {
    console.error("Firebase Error:", err);
}

const getBoosterMultiplier = (userData) => {
    if (userData && userData.booster && userData.booster.expires) {
        if (userData.booster.expires > Date.now()) {
            return userData.booster.multiplier || 1;
        }
    }
    return 1;
};

const generateTerminalLog = (action, userId) => {
    return `[${new Date().toISOString()}] AUTH:#${userId} | ACTION:${action} | SECURE:TRUE`;
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: "Only POST allowed." });

    const { userId, action, num1, num2, operator, answer, n3, password, itemCode } = req.body;

    if (!action || !userId) {
        return res.status(400).json({ success: false, error: "Missing userId or action." });
    }

    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.exists() ? snapshot.val() : null;

        const multiplier = getBoosterMultiplier(userData);

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

        if (action === "getScore") {
            if (userData) {
                return res.status(200).json({ 
                    success: true, 
                    score: userData.score || 0,
                    multiplier: multiplier,
                    terminal_log: generateTerminalLog("FETCH_SCORE", userId)
                });
            }
            return res.status(404).json({ success: false, error: "User not found." });
        }

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

        if (action === "submitAnswer") {
            let correctAns = 0;
            const p1 = parseInt(num1), p2 = parseInt(num2);

            if (operator === '+') correctAns = p1 + p2;
            else if (operator === '-') correctAns = p1 - p2;
            else if (operator === '*') correctAns = p1 * p2;

            if (parseInt(answer) === correctAns) {
                let earned = 10 * multiplier; // Dynamic Points Calculation
                let newScore = (userData ? userData.score || 0 : 0) + earned;
                
                await update(userRef, { score: newScore });
                
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    newScore: newScore,
                    earned: earned,          // SENDING REAL EARNED POINTS TO BOT
                    multiplier: multiplier,  // SENDING MULTIPLIER TO BOT
                    terminal_log: generateTerminalLog("SOLVE_HACK", userId)
                });
            } else {
                return res.status(200).json({ success: true, isCorrect: false, correctAnswer: correctAns });
            }
        }

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

        if (action === "submitMegaExam") {
            const p1 = parseInt(num1), p2 = parseInt(num2), p3 = parseInt(n3);
            let correctAns = (p1 * p2) + p3;

            if (parseInt(answer) === correctAns) {
                let earned = 50 * multiplier;
                let newScore = (userData ? userData.score || 0 : 0) + earned;
                
                await update(userRef, { score: newScore });
                
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    newScore: newScore,
                    earned: earned,
                    multiplier: multiplier
                });
            } else {
                return res.status(200).json({ success: true, isCorrect: false, correctAnswer: correctAns });
            }
        }

        return res.status(400).json({ success: false, error: "Invalid Action." });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Server Error", details: error.message });
    }
}
