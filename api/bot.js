import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, get, set, update } from "firebase/database";

// 🔒 TUMCHE FIREBASE CONFIGURATION
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
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getDatabase(app);
} catch (err) {
  console.error("Firebase Connection Error:", err);
}

export default async function handler(req, res) {
  // CORS Headers (Website aani Bot doghansathi)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // GET kiva POST madhun data ghene
    const data = req.method === "POST" ? req.body || {} : req.query || {};
    const action = String(data.action || req.query.action || "").trim();
    const account = String(data.account || data.userId || req.query.account || req.query.userId || "").trim();
    const password = String(data.password || req.query.password || "").trim();
    const name = String(data.name || req.query.name || "").trim();
    const coins = parseInt(data.coins ?? req.query.coins ?? 0, 10);

    // 1. CREATE NEW ACCOUNT (Name + 5 Number Account + 4 Number Password)
    if (action === "register") {
      if (!name) {
        return res.status(400).json({
          status: "error",
          message: "Krupaya tumche Nav (Name) taka!"
        });
      }
      if (!/^\d{5}$/.test(account)) {
        return res.status(400).json({
          status: "error",
          message: "Account ID barobar 5 number cha asayla hava!"
        });
      }
      if (!/^\d{4}$/.test(password)) {
        return res.status(400).json({
          status: "error",
          message: "Password barobar 4 number cha asayla hava!"
        });
      }

      const userRef = ref(db, `users/${account}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        return res.status(400).json({
          status: "error",
          message: "Ha 5 number cha Account adhich tayar ahe! Dusra number taka."
        });
      }

      const newUser = {
        name: name,
        account: account,
        password: password,
        coins: 0,
        createdAt: Date.now()
      };

      await set(userRef, newUser);

      return res.status(200).json({
        status: "success",
        message: "Account yashasvipane tayar jhale!",
        user: {
          name: newUser.name,
          account: newUser.account,
          coins: newUser.coins
        }
      });
    }

    // 2. LOGIN ACCOUNT (5 Number Account + 4 Number Password)
    if (action === "login") {
      if (!/^\d{5}$/.test(account) \vert{}\vert{} !/^\d{4}$/.test(password)) {
        return res.status(400).json({
          status: "error",
          message: "5 number cha Account ID aani 4 number cha Password taka!"
        });
      }

      const userRef = ref(db, `users/${account}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        return res.status(404).json({
          status: "error",
          message: "Account sapadla nahi! Pahile Create New Account kara."
        });
      }

      const currentUser = snapshot.val();

      if (String(currentUser.password) !== password) {
        return res.status(401).json({
          status: "error",
          message: "Chukicha Password! Barobar 4 number password taka."
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Login yashasvi jhale!",
        user: {
          name: currentUser.name || "Player",
          account: account,
          coins: Number(currentUser.coins || 0)
        }
      });
    }

    // 3. GAME COINS UPDATE KARNE (Firebase madhe coins save karne)
    if (action === "update_coins") {
      if (!/^\d{5}$/.test(account)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid Account ID!"
        });
      }

      const userRef = ref(db, `users/${account}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        return res.status(404).json({
          status: "error",
          message: "Account sapadla nahi!"
        });
      }

      const updatedCoins = isNaN(coins) ? 0 : coins;
      await update(userRef, { coins: updatedCoins });

      const userData = snapshot.val();
      return res.status(200).json({
        status: "success",
        message: "Coins Firebase madhe save jhale!",
        user: {
          name: userData.name || "Player",
          account: account,
          coins: updatedCoins
        }
      });
    }

    // 4. BOT REQUEST (Jevha Bot website la request takel tevha Firebase madhun uttar deil)
    if (action === "bot_get" || account) {
      const userRef = ref(db, `users/${account}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        return res.status(200).json({
          status: "error",
          message: "Ha 5 number cha Account ajun website var banavlela nahi!"
        });
      }

      const user = snapshot.val();

      // Jar Bot ne password pan pathavla asel tar to check kara
      if (password && String(user.password) !== password) {
        return res.status(200).json({
          status: "error",
          message: "Password chukicha ahe!"
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Account data milala!",
        name: user.name || "Player",
        account: account,
        coins: Number(user.coins || 0)
      });
    }

    // Default Uttar (API check karnyasathi)
    return res.status(200).json({
      status: "online",
      message: "Firebase Game API chalu ahe! Bot aani Website connect karnyasathi tayar."
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server Error: " + error.message
    });
  }
}
