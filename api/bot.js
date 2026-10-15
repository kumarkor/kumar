// 🔒 FIREBASE DATABASE URL
const FIREBASE_DB_URL = "https://newkumarbot-default-rtdb.firebaseio.com";

async function fbGet(path) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
  return await res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let bodyData = req.body || {};
    if (typeof bodyData === "string") {
      try {
        bodyData = JSON.parse(bodyData);
      } catch (e) {
        bodyData = {};
      }
    }

    const data = req.method === "POST" ? bodyData : req.query || {};
    const account = String(data.account || data.userId || req.query?.account || req.query?.userId || "").trim();
    const password = String(data.password || req.query?.password || "").trim();

    // Bot ने Account ID पाठवला तर युजरचा पूर्ण डेटा आणि ₹ Balance द्या
    if (account) {
      const user = await fbGet(`users/${account}`);
      const config = (await fbGet(`adminSettings`)) || {};
      const coinsPerRupee = Number(config.coinsPerRupee || 100);

      if (!user) {
        return res.status(200).json({
          status: "error",
          success: false,
          message: "Account not found!"
        });
      }

      if (password && String(user.password) !== password) {
        return res.status(200).json({
          status: "error",
          success: false,
          message: "Wrong password!"
        });
      }

      const coins = Number(user.coins || 0);
      const balanceRupees = (coins / coinsPerRupee).toFixed(2);

      return res.status(200).json({
        status: "success",
        success: true,
        name: user.name,
        account: user.account,
        telegramId: user.telegramId || "",
        coins: coins,
        rupees: balanceRupees,
        coinsPerRupee: coinsPerRupee
      });
    }

    return res.status(200).json({
      status: "online",
      success: true,
      message: "Earning Website Bot API is Online!"
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      success: false,
      message: err.message
    });
  }
}
