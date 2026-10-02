/**
 * =========================================================================================
 * KUMAR API NETWORK - MASTER BACKEND SERVER
 * File: api/bot.js
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

// Check if user has an active booster
const getBoosterMultiplier = (userData) => {
    if (userData && userData.booster && userData.booster.expires) {
        if (userData.booster.expires > Date.now()) {
            return userData.booster.multiplier || 1;
        }
    }
    return 1;
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

        // 🟢 1. VERIFY USER
        if (action === "verifyUser") {
            if (userData && userData.password === password) {
                return res.status(200).json({ success: true, userId: userId });
            }
            return res.status(401).json({ success: false, error: "Access Denied." });
        }

        // 🔵 2. GET SCORE
        if (action === "getScore") {
            if (userData) {
                return res.status(200).json({ success: true, score: userData.score || 0 });
            }
            return res.status(404).json({ success: false, error: "User not found." });
        }

        // 🟠 3. GET MATH QUESTION (Normal)
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

            return res.status(200).json({ success: true, question: `${n1} ${op} ${n2} = ?`, n1, n2, op, options });
        }

        // 🟣 4. SUBMIT MATH ANSWER (Normal)
        if (action === "submitAnswer") {
            let correctAns = 0;
            const p1 = parseInt(num1), p2 = parseInt(num2);

            if (operator === '+') correctAns = p1 + p2;
            else if (operator === '-') correctAns = p1 - p2;
            else if (operator === '*') correctAns = p1 * p2;

            if (parseInt(answer) === correctAns) {
                let earned = 10 * multiplier; // 🔥 BOOSTER APPLIED HERE
                let newScore = (userData ? userData.score || 0 : 0) + earned;
                
                await update(userRef, { score: newScore });
                
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    newScore: newScore,
                    message: multiplier > 1 ? `✅ BOOSTER ACTIVE! +${earned} Points!` : `✅ +${earned} Points!`
                });
            } else {
                return res.status(200).json({ success: true, isCorrect: false, correctAnswer: correctAns });
            }
        }

        // 🔥 5. GET MEGA EXAM
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

        // 💥 6. SUBMIT MEGA EXAM
        if (action === "submitMegaExam") {
            const p1 = parseInt(num1), p2 = parseInt(num2), p3 = parseInt(n3);
            let correctAns = (p1 * p2) + p3;

            if (parseInt(answer) === correctAns) {
                let earned = 50 * multiplier; // 🔥 BOOSTER APPLIED HERE
                let newScore = (userData ? userData.score || 0 : 0) + earned;
                
                await update(userRef, { score: newScore });
                
                return res.status(200).json({ 
                    success: true, 
                    isCorrect: true, 
                    newScore: newScore,
                    message: `🔥 MEGA WIN! +${earned} Points!`
                });
            } else {
                return res.status(200).json({ success: true, isCorrect: false, correctAnswer: correctAns });
            }
        }

        // 🛒 7. BUY BOOSTER FROM BOT
        if (action === "buyItem") {
            let cost = 0, hours = 0;
            if (itemCode === "boost_1h") { cost = 150; hours = 1; }
            else if (itemCode === "boost_24h") { cost = 500; hours = 24; }
            else return res.status(400).json({ success: false, error: "Invalid item." });

            let currentScore = userData ? userData.score || 0 : 0;
            if (currentScore < cost) return res.status(200).json({ success: false, error: "Insufficient Points." });

            const expiresAt = Date.now() + (hours * 60 * 60 * 1000);
            let newScore = currentScore - cost;

            await update(userRef, { score: newScore, booster: { multiplier: 2, expires: expiresAt } });

            return res.status(200).json({ success: true, message: `✅ Booster Activated for ${hours}H!`, newScore: newScore });
        }

        return res.status(400).json({ success: false, error: "Invalid Action." });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Server Error", details: error.message });
    }
}
