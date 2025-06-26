import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {  collection, getDocs, query, where } from 'firebase/firestore';
import {  signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db , auth } from '../../config/firebaseConfig';



export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

 const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter both email and password.');
    return;
  }

  try {
    // Firebase Auth Login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      Alert.alert('Email Not Verified', 'Please verify your email before logging in.');
      return;
    }

    // Fetch employeeNo from Firestore
    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);

    // If no matching user document found
    if (userSnapshot.empty) {
      Alert.alert('Account Suspended', 'Administrator suspended your account.');
      return;
    }

    // If found, save data to AsyncStorage
    const userData = userSnapshot.docs[0].data();
    const employeeNo = userData.employeeNo || 'Unknown';
    await AsyncStorage.setItem('userEmail', email);
    await AsyncStorage.setItem('employeeNo', employeeNo);

    router.push('/dashboard'); // Navigate to dashboard
  } catch (error: any) {
    let message = 'An error occurred during login.';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No user found with this email.';
        break;
      case 'auth/wrong-password':
      case 'auth/invalid-email':
      case 'auth/invalid-credential':
        message = 'Incorrect email or password. Please try again.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
      default:
        message = error.message || 'Something went wrong. Please try again later.';
        break;
    }

    Alert.alert('Login Failed', message);
  }
};

  
  

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/scback1.png')} style={styles.backgroundImage} />

      <View style={styles.formContainer}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={() => router.push('/forgetpassword')}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/explore')}>
          <Text style={styles.signUp}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version: 0.0.1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backgroundImage: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' },
  formContainer: { width: '80%', padding: 20, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  title: { fontSize: 35, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { width: '100%', padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 10 },
  forgotPassword: { color: 'blue', textAlign: 'right', marginBottom: 20 },
  button: { backgroundColor: 'blue', padding: 10, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16 },
  signUp: { textAlign: 'center', color: 'blue', marginTop: 20 },
  version: { textAlign: 'center', color: 'gray', marginTop: 15 },
});
