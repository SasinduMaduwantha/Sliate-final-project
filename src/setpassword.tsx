import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import './ForgetPassword.css';  // Optional: Add styling for the component

function ForgetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting] = useState(false);

  // Function to send verification email
  const sendVerificationEmail = async () => {
    const auth = getAuth();
    try {
      if (!email) {
        setErrorMessage("Please enter your email.");
        return;
      }
      
      // Send the password reset email
      await sendPasswordResetEmail(auth, email);
      alert("Verification email sent! Please check your inbox.");
      navigate("/");
    } catch (error) {
      console.error("Error sending verification email:", error);
      setErrorMessage("Error sending verification email. Please try again.");
    }
  };

  // Function to handle clear button
  const handleClear = () => {
    setEmail("");
    setErrorMessage("");
  };

  return (
    <div className="forget-password-page">
    <div className="reset-password-container">
      <h2>Forget Password</h2>

      {/* Email input */}
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
      />

      {/* Error message */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Reset Password Button */}
      <button 
        onClick={sendVerificationEmail} 
        disabled={isSubmitting || !email}
        className="action-button"
      >
        Send Reset Email
      </button>

      {/* Clear Button */}
      <button 
        onClick={handleClear} 
        disabled={isSubmitting}
        className="action-button"
      >
        Clear
      </button>
      <div className="back-to-login" onClick={() => navigate("/")}>
      Back to Login
    </div>
      
    </div>
    
    </div>
  );
}

export default ForgetPassword;
