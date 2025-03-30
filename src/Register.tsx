import { useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import './Register.css';

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
  const [adminName, setAdminName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultProfileImage = "https://avatar.iran.liara.run/public/35"; // Default profile image

  const handleClear = () => {
    setAdminName("");
    setContactNumber("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleRegister = async () => {
    // Validate all fields are filled
    if (!adminName || !contactNumber || !email || !password || !confirmPassword) {
      alert("All fields are required.");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setIsSubmitting(true); // Set submitting state

    try {
      // Register the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Add the admin details to Firestore, but do not allow login yet
      await addDoc(collection(db, "users"), {
        name: adminName,
        contactNumber: contactNumber,
        email: email,
        jobType: "Distributor", // Set job type as Distributor
        profileImage: defaultProfileImage, // Default image
        isVerified: false, // User is not verified yet
      });

      // Add the password details to the Authentication collection (hashed password should be added in production)
      await addDoc(collection(db, "Authentication"), {
        email: email,
        password: password, // This should be hashed in production (not raw password)
        createdAt: new Date(),
        isVerified: false, // Initially, the user is not verified
      });

      alert("Registration successful. A verification email has been sent.");
      handleClear(); // Clear fields on successful registration
    } catch (error) {
      // Log the complete error message
      console.error("Error during registration:", error);

      // Check if error is an instance of Error
      if (error instanceof Error) {
        alert(`Error during registration: ${error.message}`);
      } else {
        alert("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false); // Reset submitting state
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
