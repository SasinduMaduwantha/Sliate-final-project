import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import "./Register.css";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJk8U5Hr8CMwI0Mgr45LHsk2IQqEiPeOw",
  authDomain: "exapp-c6ee7.firebaseapp.com",
  projectId: "exapp-c6ee7",
  storageBucket: "exapp-c6ee7.firebasestorage.app",
  messagingSenderId: "95563416478",
  appId: "1:95563416478:web:6c08202411d43a5869cc8f",
  measurementId: "G-KT01GYD4QV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function AdminRegister() {
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultProfileImage = "https://avatar.iran.liara.run/public/35";

  const handleClear = () => {
    setAdminName("");
    setContactNumber("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!adminName || !contactNumber || !email || !password || !confirmPassword) {
      alert("All fields are required.");
      return;
    }

    if (contactNumber.length !== 10 || !/^\d+$/.test(contactNumber)) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create user with entered password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user details (not password) in Firestore
      await addDoc(collection(db, "users"), {
        name: adminName,
        contactNo: contactNumber,
        email: email,
        jobType: "Distributor",
        profileImage: defaultProfileImage,
        isVerified: false,
      });

      // Send verification email
      await sendEmailVerification(user);

      alert("Registration successful. Please verify your email.");
      handleClear();
      navigate("/");

    } catch (error) {
      console.error("Error during registration:", error);
      alert("This account is already registered.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Admin Register</h2>
      <input
        type="text"
        placeholder="Admin Name"
        value={adminName}
        onChange={(e) => setAdminName(e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Contact Number"
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
        className="input-field"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input-field"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="input-field"
      />
      <div className="actions">
        <button onClick={handleRegister} disabled={isSubmitting}>Register</button>
        <button onClick={handleClear}>Clear</button>
      </div>
    </div>
  );
}

export default AdminRegister;
