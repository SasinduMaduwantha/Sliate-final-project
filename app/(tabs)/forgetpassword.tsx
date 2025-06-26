import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ImageBackground } from 'react-native';
import {sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'expo-router';
import {  auth } from '../../config/firebaseConfig';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleClear = ()=>{
    setEmail ('');
  }
  const handleForgotPassword = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      Alert.alert("Validation Error", "Please enter your email.");
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent. Please check your inbox.");
      router.push('/');
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      if (error.code === 'auth/user-not-found') {
        Alert.alert("Error", "This email is not registered. Please check and try again.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Error", "The email address is badly formatted.");
      } else {
        Alert.alert("Error", error.message || "Something went wrong. Please try again.");
      }
    }
  };

  return (
    <ImageBackground source={require('@/assets/images/scback1.png')} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
          <Text style={styles.buttonText}>Send Reset Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearbutton} onPress={handleClear}>
          <Text style={styles.clearbuttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  container: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: 'blue',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearbutton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor:'black',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  clearbuttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
