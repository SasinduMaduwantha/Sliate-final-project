import express, { Request, Response, Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app: Application = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Function to generate a random 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Nodemailer transporter setup using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email from .env file
    pass: process.env.EMAIL_PASS, // Password from .env file
  },
});

// API endpoint to send OTP
app.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const otp = generateOtp();

  try {
    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender's email
      to: email, // Receiver's email
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`, // OTP message
    });

    res.status(200).json({ message: "OTP sent successfully", otp });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
