const express = require("express");
const twilio = require("twilio");
require('dotenv').config();

const app = express();

// Parse JSON for /register
app.use("/register", express.json());
// Parse URL-encoded data for /incoming webhook
app.use("/incoming", express.urlencoded({ extended: false }));

// Store incoming messages
let userMessages = [];

// Twilio credentials
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const client = twilio(accountSid, authToken);

app.get("/", (req, res) => {
  res.send("Hello! Server is running.");
});

// Register endpoint
app.post("/register", async (req, res) => {
  try {
    const { name, phone } = req.body;

    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${phone}`,
      body: `✅ Hi ${name}, thanks for registering! Please send the screenshot for verification.`
    });

    res.json({ success: true, message: "User registered & WhatsApp message sent!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Incoming WhatsApp webhook
app.post("/incoming", (req, res) => {
  const from = req.body.From;
  const message = req.body.Body;

  userMessages.push({ from, message, receivedAt: new Date() });
  console.log("Incoming WhatsApp message:", from, message);

  res.set("Content-Type", "text/xml");
  res.send("<Response></Response>");
});

// Get all messages
app.get("/messages", (req, res) => {
  res.json(userMessages);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
