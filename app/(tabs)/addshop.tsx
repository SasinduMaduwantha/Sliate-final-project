import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import {  doc, setDoc, getDoc, collection, query, where, getDocs,deleteDoc } from "firebase/firestore";
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { db } from '../../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';


export default function AddShopScreen() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [shopImage, setShopImage] = useState<string | null>(null);
  const [searchShopName, setSearchShopName] = useState(''); // Search shop name state
  const [shopDetails, setShopDetails] = useState<any>(null); // State to hold the shop details for search result

  // Time picker states
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [isOpenTimePickerVisible, setOpenTimePickerVisible] = useState(false);
  const [isCloseTimePickerVisible, setCloseTimePickerVisible] = useState(false);
  const [jobType, setJobType] = useState('');


  // Weekday selector state
  const [closeDate, setCloseDate] = useState('None');

  const clearFields = () => {
    setSearchShopName(''),
    setOwnerName('');
    setShopName('');
    setContactNo('');
    setEmail('');
    setAddress('');
    setCity('');
    setOpenTime('');
    setCloseTime('');
    setCloseDate('None');
    setShopImage(null);
    setShopDetails(null); // Clear shop details on reset
  };

  useEffect(() => {
  const fetchJobType = async () => {
    const userEmail = await AsyncStorage.getItem('userEmail');
    if (!userEmail) return;

    const q = query(collection(db, 'users'), where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      setJobType(userData.jobType); // Set jobType for access control
    }
  };
  fetchJobType();
}, []);


const handleDelete = async () => {
  if (!shopName) {
    Alert.alert('Error', 'Please search and select a shop to delete.', [{ text: 'OK' }]);
    return;
  }

  Alert.alert(
    'Confirm Delete',
    'Are you sure you want to delete this shop?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const normalizedShopName = shopName.trim().toLowerCase();
            await deleteDoc(doc(db, "shops", normalizedShopName));
            Alert.alert('Deleted', 'Shop deleted successfully.', [{ text: 'OK' }]);
            clearFields();
          } catch (error) {
            console.error("Error deleting shop: ", error);
            Alert.alert('Error', 'Failed to delete shop.', [{ text: 'OK' }]);
          }
        },
      },
    ]
  );
};


  const handleSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    if (period.toLowerCase() === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes; // Convert to minutes for comparison
  };

    if (!shopName || !ownerName || !contactNo || !address || !city && email) {
      Alert.alert('Error', 'Please fill out all fields.', [{ text: 'OK' }]);
      return;

    } else if (contactNo.length !== 10 || !/^\d+$/.test(contactNo)) {
      Alert.alert('Error', 'Please enter a valid 10-digit contact number.', [{ text: 'OK' }]);
      return;
    
    }else if(!openTime || !closeTime){
      Alert.alert('Error', 'Please set both open time and close time', [{ text: 'OK' }]);
      return;
    }
    if (email && !emailRegex.test(email)) {
    Alert.alert('Error', 'Please enter a valid email address.', [{ text: 'OK' }]);
    return;
  }
  const openTimeInMinutes = parseTime(openTime);
  const closeTimeInMinutes = parseTime(closeTime);

  if (openTimeInMinutes >= closeTimeInMinutes) {
    Alert.alert('Error', 'Open time must be before close time.', [{ text: 'OK' }]);
    return;
  }
  
    const normalizedShopName = shopName.trim().toLowerCase();
    const normalizedAddress = address.trim().toLowerCase();
  
    try {
      const shopRef = doc(db, "shops", normalizedShopName);
      const shopSnap = await getDoc(shopRef);
  
      if (shopSnap.exists()) {
        // If shop already exists, allow updating it
        await setDoc(shopRef, {
          ownerName,
          shopName: normalizedShopName,
          contactNo,
          email,
          address: normalizedAddress,
          city,
          openTime,
          closeTime,
          closeDate,
          shopImage,
        }, { merge: true }); // Merge ensures only updates are made
  
        Alert.alert('Success', 'Shop details updated successfully!', [{ text: 'OK' }]);
        clearFields();
        return;
      }
  
      // Check if a shop with the same address exists (but a different name)
      const shopQuery = await getDocs(
        query(collection(db, "shops"), where("address", "==", normalizedAddress))
      );
  
      if (!shopQuery.empty) {
        Alert.alert('Error', 'This shop already exists.', [{ text: 'OK' }]);
        return;
      }
  
      // If no conflict, save the new shop
      await setDoc(shopRef, {
        ownerName,
        shopName: normalizedShopName,
        contactNo,
        email,
        address: normalizedAddress,
        city,
        openTime,
        closeTime,
        closeDate,
        shopImage,
      });
  
      Alert.alert('Success', 'Shop details saved successfully!', [{ text: 'OK' }]);
      clearFields();
    } catch (error) {
      console.error("Error saving shop details: ", error);
      Alert.alert('Error', 'Failed to save shop details.', [{ text: 'OK' }]);
    }
  };
  
  

  // Search function to get shop details by name
  const handleSearch = async () => {
    if (!searchShopName) {
      Alert.alert('Error', 'Please enter a shop name to search.', [{ text: 'OK' }]);
      return;
    }
    const normalizedSearchName = searchShopName.trim().toLowerCase(); // Convert to lowercase
    try {
      const shopRef = doc(db, "shops", normalizedSearchName);
      const shopSnap = await getDoc(shopRef);

      if (shopSnap.exists()) {
        setShopDetails(shopSnap.data());
        // Populate the form fields with the shop details
        const shopData = shopSnap.data();
        setOwnerName(shopData.ownerName);
        setShopName(shopData.shopName);
        setContactNo(shopData.contactNo);
        setEmail(shopData.email);
        setAddress(shopData.address);
        setCity(shopData.city);
        setOpenTime(shopData.openTime);
        setCloseTime(shopData.closeTime);
        setCloseDate(shopData.closeDate);
        setShopImage(shopData.shopImage || null);
      } else {
        Alert.alert('Error', 'Shop not found.', [{ text: 'OK' }]);
        setShopDetails(null);
      }
    } catch (error) {
      console.error("Error fetching shop details: ", error);
      Alert.alert('Error', 'Failed to fetch shop details.', [{ text: 'OK' }]);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [5, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setShopImage(result.assets[0].uri); 
    }
  };

  // Time picker handlers
  const handleConfirmOpenTime = (date: Date) => {
    setOpenTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    setOpenTimePickerVisible(false);
  };

  const handleConfirmCloseTime = (date: Date) => {
    setCloseTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    setCloseTimePickerVisible(false);
  };

  return (
    <View style={styles.container}>
        <Text style={styles.heading}>Shop</Text>
        

    <View style={styles.searchContainer}>
      {/* Search Shop Input */}
      <TextInput
        style={styles.searchinput}
        placeholder="Search Shop by Name"
        value={searchShopName}
        onChangeText={setSearchShopName}
      />
      <TouchableOpacity style={styles.searchbutton} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      {/* Display Shop Details in the form if found */}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Owner Name"
        value={ownerName}
        onChangeText={setOwnerName}
      />
      <TextInput
        style={styles.input}
        placeholder="Shop Name (ex:- happy shop gampaha)"
        value={shopName}
        onChangeText={setShopName}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact No"
        value={contactNo}
        onChangeText={setContactNo}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />

      {/* Open Time Picker */}
      <View style={styles.timeContainer}>
  <TouchableOpacity style={styles.timeButton} onPress={() => setOpenTimePickerVisible(true)}>
    <Text style={styles.buttonText}>{openTime ? `Open Time: ${openTime}` : "Set Open Time"}</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.timeButton} onPress={() => setCloseTimePickerVisible(true)}>
    <Text style={styles.buttonText}>{closeTime ? `Close Time: ${closeTime}` : "Set Close Time"}</Text>
  </TouchableOpacity>
</View>

<DateTimePickerModal
  isVisible={isOpenTimePickerVisible}
  mode="time"
  onConfirm={handleConfirmOpenTime}
  onCancel={() => setOpenTimePickerVisible(false)}
/>

<DateTimePickerModal
  isVisible={isCloseTimePickerVisible}
  mode="time"
  onConfirm={handleConfirmCloseTime}
  onCancel={() => setCloseTimePickerVisible(false)}
/>
        <Text style={styles.label}>Shop Close Date:</Text>
      {/* Weekday Selector */}
      <Picker selectedValue={closeDate} onValueChange={(itemValue) => setCloseDate(itemValue)} style={styles.picker}>
        {["None","Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
          <Picker.Item key={day} label={day} value={day} />
        ))}
      </Picker>

      {/* Upload Shop Image */}
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Upload Shop Image</Text>
      </TouchableOpacity>
      {shopImage && <Image source={{ uri: shopImage }} style={styles.image} />}

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitbutton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit / Update</Text>
      </TouchableOpacity>

      {jobType === 'Distributor' && (
  <TouchableOpacity style={[styles.submitbutton, { backgroundColor: 'blue' }]} onPress={handleDelete}>
    <Text style={styles.buttonText}>Delete Shop</Text>
  </TouchableOpacity>
      )}


      {/* Clear All Button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearFields}>
        <Text style={styles.clearButtonText}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:'#f5f5f5',
    flex: 1,
    padding: 20,
    
  },
  heading:{
    textAlign: 'left',
    fontSize: 20,
    color:'black',
    marginTop:16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
  },
  searchContainer:{
    marginTop:20,
    width:250,
    flexDirection: 'row',  // Arrange items horizontally
    justifyContent: 'space-evenly',  // Push buttons to the left and right
    alignItems: 'center',
  },
  searchbutton:{
    backgroundColor: '#007bff',
    padding: 10,
    width:185,
    borderRadius: 5,
    marginBottom: 10,},
    searchinput:{
        height: 40,
        width:185,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    },
  timeContainer: {
    flexDirection: 'row',  // Arrange items horizontally
    justifyContent: 'space-between',  // Push buttons to the left and right
    alignItems: 'center',
    marginBottom: 10,
  },
  timeButton: {
    flex: 1,  // Each button takes equal space
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5, // Add some spacing between buttons
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },

  submitbutton:{
   
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginTop:10,
    marginBottom: 10,
    borderColor:'#000000',
    borderWidth: 1, },

  clearButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    borderColor:'#000000',
    borderWidth: 1, 
    color:'#00ff00',
    marginTop: 8,
  },
  clearButtonText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 18,
  },
  image: {
    width: 200,
    height: 100,
    marginTop: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  picker: {
    marginBottom: 10,
  },
});
