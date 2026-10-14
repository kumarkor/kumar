// 🔒 TUMCHA FIREBASE DATABASE URL
const FIREBASE_DB_URL = "https://newkumarbot-default-rtdb.firebaseio.com";

// Firebase madhun user data vachnyasathi helper function
async function getUserFromFirebase(account) {
  const response = await fetch(`${FIREBASE_DB_URL}/users/${account}.json`);
  if (!response.ok) {
    throw new Error("Firebase Read Error");
  }
  return await response.json();
}

// Firebase madhe user data save/update karnyasathi helper function
async function saveUserToFirebase(account, userData) {
  const response = await fetch(`${FIREBASE_DB_URL}/users/${account}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    throw new Error("Firebase Write Error");
  }
  return await response.json();
}

// Firebase madhe fakt coins update karnyasathi helper function
async function updateUserFields(account, fields) {
  const response = await fetch(`${FIREBASE_DB_URL}/users/${account}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields)
  });
  if (!response.ok) {
    throw new Error("Firebase Update Error");
  }
  return await response.json();
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
    // Body string asel tar JSON madhe parse kara
    let bodyData = req.body || {};
    if (typeof bodyData === "string") {
      try {
        bodyData = JSON.parse(bodyData);
      } catch (e) {
        bodyData = {};
      }
    }

    const data = req.method === "POST" ? bodyData : req.query || {};
    const action = String(data.action || req.query?.action || "").trim();
    const account = String(data.account || data.userId || req.query?.account || req.query?.userId || "").trim();
    const password = String(data.password || req.query?.password || "").trim();
    const name = String(data.name || req.query?.name || "").trim();
    const coins = parseInt(data.coins ?? req.query?.coins ?? 0, 10);

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

      const existingUser = await getUserFromFirebase(account);
      if (existingUser) {
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

      await saveUserToFirebase(account, newUser);

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

      const currentUser = await getUserFromFirebase(account);

      if (!currentUser) {
        return res.status(404).json({
          status: "error",
          message: "Account sapadla nahi! Pahile Create New Account kara."
        });
      }

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

      const updatedCoins = isNaN(coins) ? 0 : coins;
      await updateUserFields(account, { coins: updatedCoins });

      return res.status(200).json({
        status: "success",
        message: "Coins Firebase madhe save jhale!",
        coins: updatedCoins
      });
    }

    // 4. BOT REQUEST (Jevha Bot website la request takel tevha Firebase madhun uttar deil)
    if (action === "bot_get" || account) {
      const user = await getUserFromFirebase(account);

      if (!user) {
        return res.status(200).json({
          status: "error",
          message: "Ha 5 number cha Account ajun website var banavlela nahi!"
        });
      }

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
