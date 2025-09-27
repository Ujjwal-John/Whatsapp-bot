const express = require("express");
const twilio = require("twilio");
require("dotenv").config();
const cors = require("cors");

const app = express();

// ✅ Allow your production domain + localhost for dev
app.use(cors({
  origin: "https://colabesports.in",
  methods: ["GET", "POST", "OPTIONS"], // include OPTIONS for preflight
  allowedHeaders: ["Content-Type"]
}));

// Parse JSON for /register
app.use("/register", express.json());

// Parse both URL-encoded and JSON data for /incoming webhook
app.use("/incoming", express.urlencoded({ extended: false }));
app.use("/incoming", express.json());

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
      from: "whatsapp",
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
  const from = req.body.From;       // Sender number
  const text = req.body.Body || ""; // Text message
  const numMedia = parseInt(req.body.NumMedia || "0");

  let media = [];
  for (let i = 0; i < numMedia; i++) {
    media.push({
      url: req.body[`MediaUrl${i}`],
      contentType: req.body[`MediaContentType${i}`]
    });
  }

  userMessages.push({ from, text, media, receivedAt: new Date() });
  console.log("Incoming WhatsApp message:", { from, text, media });

  res.set("Content-Type", "text/xml");
  res.send("<Response></Response>");
});

// Get all messages
app.get("/messages", (req, res) => {
  res.json(userMessages);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
