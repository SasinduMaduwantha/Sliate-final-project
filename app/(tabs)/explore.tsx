import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ImageBackground, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { db, auth } from '../../config/firebaseConfig';

export default function RegistrationScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [employeeNo, setEmployeeNo] = useState('');
  const [jobType, setJobType] = useState('Seller');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const defaultProfileImage = "https://avatar.iran.liara.run/public/35";

  const clearFields = () => {
    setName('');
    setEmployeeNo('');
    setJobType('Seller');
    setEmail('');
    setContactNo('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !employeeNo || !jobType || !email || !contactNo || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    if (contactNo.length !== 10 || !/^\d+$/.test(contactNo)) {
      Alert.alert('Error', 'Contact number must be 10 digits.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      // Check if employee number or email already exists
      const empQuery = query(collection(db, "users"), where("employeeNo", "==", employeeNo));
      const emailQuery = query(collection(db, "users"), where("email", "==", email));

      const [empSnapshot, emailSnapshot] = await Promise.all([
        getDocs(empQuery),
        getDocs(emailQuery)
      ]);

      if (!empSnapshot.empty || !emailSnapshot.empty) {
        Alert.alert('Error', 'This account is already registered.');
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Save user to Firestore
      await addDoc(collection(db, "users"), {
        name,
        employeeNo,
        jobType,
        email,
        contactNo,
        profileImage: defaultProfileImage,
        uid: userCredential.user.uid,
        isVerified: false,
      });

      // Send verification email
      await sendEmailVerification(userCredential.user);

      Alert.alert('Success', 'Registration successful. Please verify your email.');
      router.push('/');
    } catch (e: any) {
      console.error("Registration Error:", e);
      Alert.alert('Error', e.message || 'Registration failed.');
    }
  };

  return (
    <ImageBackground source={require('@/assets/images/scback1.png')} style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Sign Up</Text>

        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Employee No" value={employeeNo} onChangeText={setEmployeeNo} />

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Job Type:</Text>
          <Picker selectedValue={jobType} onValueChange={setJobType} style={styles.picker}>
            <Picker.Item label="Seller" value="Seller" />
            <Picker.Item label="Deliverer" value="Deliverer" />
          </Picker>
        </View>

        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Contact No" value={contactNo} onChangeText={setContactNo} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearFields}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/')} style={styles.signInContainer}>
          <Text style={styles.signIn}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  formContainer: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 20, borderRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { width: '100%', padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 10 },
  pickerContainer: { marginBottom: 10 },
  pickerLabel: { fontWeight: 'bold', marginBottom: 5 },
  picker: { width: '100%' },
  button: { backgroundColor: 'blue', padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: 'white', fontSize: 16 },
  clearButton: { borderColor: 'black', borderWidth: 1, padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  clearButtonText: { fontSize: 16 },
  signInContainer: { alignItems: 'center' },
  signIn: { color: 'blue', marginTop: 10 },
});
