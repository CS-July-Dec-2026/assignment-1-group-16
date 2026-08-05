const express = require("express");
const router = express.Router();
const db = require("../db");
const { page } = require("../views");

router.get("/account", (req, res) => {
  if (!req.cookies.username) return res.redirect("/");

  const me = db.prepare("SELECT * FROM accounts WHERE username = ?").get(req.cookies.username);
  if (!me) { res.clearCookie("username"); return res.redirect("/"); }

  let messageSection;
  if (me.message && me.message_iv) {
    messageSection = `
      <div class="message-box" id="msg-locked">
        🔒 Your message is locked.<br><br>
        <label>Enter your password to unlock:</label>
        <input type="password" id="unlock-pwd" placeholder="Your password">
        <button class="btn btn-yellow" onclick="unlockMessage()">🔓 Unlock</button>
        <p id="unlock-error" style="color:red;display:none;">❌ Wrong password!</p>
      </div>
      <div class="message-box" id="msg-revealed" style="display:none;"></div>
    `;
  } else {
    messageSection = `<div class="message-box empty">💬 No message set yet.</div>`;
  }

  res.send(page("My Page", `
    <h1>👋 Hi, ${me.display_name}!</h1>
    ${messageSection}
    <div class="button-row">
      <a href="/set-message" class="btn btn-yellow">✏️ Set My Message</a>
      <a href="/change-password" class="btn btn-green">🔑 Change Password</a>
    </div>
    <a href="/logout" class="btn btn-pink" style="margin-top:14px;display:inline-block;">Log Out</a>

    <script src="/public/crypto.js"></script>
    <script>
      const CIPHERTEXT = ${JSON.stringify(me.message || "")};
      const IV = ${JSON.stringify(me.message_iv || "")};

      async function unlockMessage() {
        const password = document.getElementById("unlock-pwd").value;
        if (!password) return;
        try {
          const plaintext = await decryptMessage(password, CIPHERTEXT, IV);
          document.getElementById("msg-locked").style.display = "none";
          const box = document.getElementById("msg-revealed");
          box.innerHTML = "💬 " + plaintext;
          box.style.display = "block";
        } catch (err) {
          document.getElementById("unlock-error").style.display = "block";
        }
      }
    </script>
  `));
});

router.get("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
});

module.exports = router;
