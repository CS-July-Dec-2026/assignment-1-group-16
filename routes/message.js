const express = require("express");
const router = express.Router();
const db = require("../db");
const { page } = require("../views");

router.get("/set-message", (req, res) => {
  if (!req.cookies.username) {
    return res.redirect("/");
  }

  res.send(page("Set My Message", `
    <h1>✏️ Set My Message</h1>
    <p class="subtitle">This will be encrypted in your browser before it's saved.</p>
    <form id="msg-form">
      <label>Your password</label>
      <input type="password" id="pwd" placeholder="Your password" required autofocus>
      <label>Your message</label>
      <input type="text" id="msg" placeholder="Say something fun!" required>
      <button type="submit" class="btn btn-yellow">Encrypt &amp; Save 💾</button>
    </form>
    <a href="/account" class="btn btn-pink" style="margin-top: 14px; display:inline-block;">Back</a>
    <script src="/public/crypto.js"></script>
    <script>
      document.getElementById("msg-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("pwd").value;
        const plaintext = document.getElementById("msg").value;

        const { ciphertext, iv } = await encryptMessage(password, plaintext);

        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/set-message";

        [["ciphertext", ciphertext], ["iv", iv]].forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      });
    </script>
  `));
});

router.post("/set-message", (req, res) => {
  if (!req.cookies.username) {
    return res.redirect("/");
  }

  db.prepare("UPDATE accounts SET message = ?, message_iv = ? WHERE username = ?").run(
    req.body.ciphertext,
    req.body.iv,
    req.cookies.username
  );

  res.redirect("/account");
});

module.exports = router;
