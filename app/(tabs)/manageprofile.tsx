import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, query, where, collection, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../config/firebaseConfig';

export default function ProfileManagementScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch user data from Firestore using email stored in AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the email from AsyncStorage
        const userEmail = await AsyncStorage.getItem('userEmail');
        
        if (userEmail) {
          // Query Firestore for the user with the matching email
          const q = query(collection(db, 'users'), where('email', '==', userEmail));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setName(userData.name);
            setContactNo(userData.contactNo);
            setProfileImage(userData.profileImage || "https://avatar.iran.liara.run/public/35");
          } else {
            console.log('No user found');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);


  
  // Handle profile image selection
  const handleProfileImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
      }
    } else {
      Alert.alert("Permission required", "You need to grant permission to access your photos.");
    }
  };

  // Save updated profile data
  const handleSaveChanges = async () => {
    if (!name || !contactNo) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }
    if (contactNo.length !== 10 || !/^\d+$/.test(contactNo)) {
          Alert.alert('Error', 'Contact number must be 10 digits.');
          return;
        }
   

    try {
      // Get the email from AsyncStorage
      const userEmail = await AsyncStorage.getItem('userEmail');

      if (userEmail) {
        // Query Firestore to find the user by email
        const userRef = query(collection(db, "users"), where("email", "==", userEmail));
        const querySnapshot = await getDocs(userRef);

        if (!querySnapshot.empty) {
          const userDocRef = querySnapshot.docs[0].ref;
          await updateDoc(userDocRef, {
            name,
            contactNo,
            profileImage: profileImage || "https://avatar.iran.liara.run/public/35",
          });

          Alert.alert('Success', 'Profile updated successfully.');
          router.push('/dashboard');
        } else {
          Alert.alert('Error', 'User not found.');
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Profile</Text>

      {profileImage && (
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
      )}

      <TouchableOpacity onPress={handleProfileImagePick} style={styles.button}>
        <Text style={styles.buttonText}>Change Profile Picture</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact No"
        value={contactNo}
        onChangeText={setContactNo}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleSaveChanges} >
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/dashboard')} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5' ,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  signOutButton: {
    marginTop: 20,
  },
  signOutText: {
    color: 'blue',
    fontSize: 16,
  },
});
