import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import AdminRegister from "./Register"; // Import the AdminRegister component
import './App.css';

// Firebase Firestore initialization
const db = getFirestore();

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Function to handle login
  const handleLogin = async () => {
    const auth = getAuth();
    
    try {
      // Query the Firestore Authentication table for the entered email
      const q = query(collection(db, "Authentication"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("Not registered. Please sign up first.");
        return;
      }

      let storedPassword: string | undefined = '';
      querySnapshot.forEach((doc) => {
        storedPassword = doc.data().password; // Get the password stored in Firestore
      });

      // Check if the entered password matches the stored password
      if (storedPassword !== password) {
        alert("Incorrect password. Please try again.");
        return;
      }

      // Now, check if the email is verified
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the email is verified
      if (!user.emailVerified) {
        alert("Please verify your email first.");
        return;
      }

      // If login is successful
      alert("Login successful!");
      console.log('Logged in successfully with email:', email);
      // Navigate to dashboard or next page after successful login (add your redirection logic here)

    } catch (error: unknown) {
      // Type guard to check if error is an instance of Error
      if (error instanceof Error) {
        console.error("Error during login:", error.message);
        alert("Login failed. Please check your credentials.");
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
              placeholder="Enter Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Enter Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <div className="actions">
              <button onClick={handleLogin}>Login</button>
              <button onClick={handleClear}>Clear</button>
            </div>
            <div className="links">
              <a href="#">Forgot Password?</a>
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
