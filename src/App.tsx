import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AdminRegister from "./Register"; // Import the AdminRegister component
import './App.css';

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
import { initializeApp } from "firebase/app";
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

db;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  // Function to handle login
  const handleLogin = async () => {
    const auth = getAuth();
    
    try {
      // Sign in with Firebase Authentication using email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the email is verified
      if (!user.emailVerified) {
        alert("Please verify your email first.");
        return;
      }

      // If login is successful
      console.log('Logged in successfully with email:', email);
      navigate("/dashboard");
      // Navigate to dashboard or next page after successful login (add your redirection logic here)

    } catch (error: unknown) {
      // Type guard to check if error is an instance of Error
      if (error instanceof Error) {
        console.error("Error during login:", error.message);
        alert("invalid email or password.");
      } else {
        console.error("An unknown error occurred:", error);
        alert("An unknown error occurred. Please try again.");
      }
    }
  };

  const handleClear = () => {
    setEmail('');
    setPassword('');
  };

  return (
    <div className="login-container">
      {!isRegistering ? (
        <div className="login-box">
          <>
            <h2>Login</h2>
            <input 
              type="email" 
              placeholder=" Enter Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder=" Enter Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <div className="actions">
              <button onClick={handleLogin}>Login</button>
              <button onClick={handleClear}>Clear</button>
            </div>
            <div className="links">
              <a href="#" onClick={() => navigate('/setpassword')}>Forgot Password?</a> {/* Navigate to setpassword page */}
              <span className="signup-link" onClick={() => setIsRegistering(true)}>Sign Up</span>
            </div>
          </>
        </div>
      ) : (
        <AdminRegister />
      )}
    </div>
  );
}

export default App;
