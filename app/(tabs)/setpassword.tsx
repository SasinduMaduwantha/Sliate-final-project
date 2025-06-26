import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ImageBackground, Alert, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';  
import {  collection, addDoc } from "firebase/firestore";
import { db } from '../../config/firebaseConfig';

export default function SetPasswordScreen() {
  const router = useRouter();
  const { email: passedEmail } = useLocalSearchParams(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (passedEmail) {
      setEmail(Array.isArray(passedEmail) ? passedEmail[0] : passedEmail);
    }
  }, [passedEmail]);

  // Disable back button until passwords are set
  useEffect(() => {
    const handleBackPress = () => {
      if (!password || !confirmPassword) {
        Alert.alert("Action Denied", "You must set your password before leaving this page.", [{ text: "OK" }]);
        return true; 
      }
      return false; 
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [password, confirmPassword]);

  const handleEmailChange = () => {
    Alert.alert("Email Locked", "You cannot change the email address.", [{ text: "OK" }]);
  };

  const validatePassword = (password: string): string | null => {
    const minLength = /.{8,}/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;
    const number = /[0-9]/;
    const specialChar = /[!@#$%^&*]/;
  
    if (!minLength.test(password)) return "Password must be at least 8 characters long.";
    if (!upperCase.test(password)) return "Password must contain at least one uppercase letter.";
    if (!lowerCase.test(password)) return "Password must contain at least one lowercase letter.";
    if (!number.test(password)) return "Password must contain at least one number.";
    if (!specialChar.test(password)) return "Password must contain at least one special character (!@#$%^&*).";
  
    return null;
  };

  const hashPassword = async (password: string): Promise<string> => {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
  };

  const handleRegister = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill out all fields.', [{ text: 'OK' }]);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.', [{ text: 'OK' }]);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('Weak Password', passwordError, [{ text: 'OK' }]);
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);

      await addDoc(collection(db, "Authentication"), {
        email: email,
        passwordHash: hashedPassword,
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Password set successfully! You can now sign in.');
      router.push('/');
    } catch (error) {
      console.error("Error saving password:", error);
      Alert.alert('Error', 'Failed to save data. Please try again.', [{ text: 'OK' }]);
    }
  };

  return (
    <ImageBackground source={require('@/assets/images/scback1.png')} style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Set Up Password</Text>

        <TextInput
          style={[styles.input, styles.disabledInput]}
          placeholder="Email"
          value={email}
          editable={false}
          onFocus={handleEmailChange}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  formContainer: { backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: 20, borderRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { width: '100%', padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 10 },
  disabledInput: { backgroundColor: '#e0e0e0' },
  button: { backgroundColor: 'blue', padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: 'white', fontSize: 16 },
});
