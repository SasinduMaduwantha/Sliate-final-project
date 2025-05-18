import express, { Request, Response, Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import * as admin from "firebase-admin";

// Load environment variables
dotenv.config();

// Initialize Express
const app: Application = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Or use cert if needed
  });
}

// Function to generate a 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP API
app.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const otp = generateOtp();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent successfully", otp });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error });
  }
});

// Delete user from Firebase Auth API
app.post("/api/delete-user", async (req: Request, res: Response): Promise<void> => {
  const { uid } = req.body;

  if (!uid) {
    res.status(400).json({ success: false, error: "UID is required" });
    return;
  }

  try {
    await admin.auth().deleteUser(uid);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
