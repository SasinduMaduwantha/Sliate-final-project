import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Alert, Button, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking , FlatList} from 'react-native';
import { ScrollView } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import {getDocs,query,where,updateDoc, arrayRemove, deleteDoc} from 'firebase/firestore';


import { db } from '../../config/firebaseConfig'; // adjust path as needed

const DeliveryDetail = () => {
    const router = useRouter();
    const [shopImage, setShopImage] = useState<string | null>(null);

  const {
    billNo,
    shopName,
    ownerName,
    contactNo,
    address,
  } = useLocalSearchParams();

  const [shopCoords, setShopCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState('Pending');
  const [rejectionReason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const [employeeNo, setEmployeeNo] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const geo = await Location.geocodeAsync(address as string);
      if (geo.length > 0) {
        setShopCoords({
          latitude: geo[0].latitude,
          longitude: geo[0].longitude,
        });
      } else {
        console.warn('Could not geocode address');
      }

      // Get employeeNo from AsyncStorage using email
      const empNo = await AsyncStorage.getItem('employeeNo');
        if (empNo) {
         setEmployeeNo(empNo);
        } else {
     console.warn('employeeNo not found in AsyncStorage');
        }

      setLoading(false);
    })();
  }, []);

  const openDirections = () => {
    if (!shopCoords || !userLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${shopCoords.latitude},${shopCoords.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

 const handleSave = async () => {
  if (deliveryStatus === 'Rejected' && rejectionReason.trim() === '') {
    Alert.alert('Validation Error', 'Please provide a reason for rejection.');
    return;
  }

  try {
    const billNoNumber = Number(billNo); // Ensure type matches

    // Save to `deliverystatus` collection
    await setDoc(doc(db, 'deliverystatus', billNo as string), {
      billNo,
      deliveryStatus,
      shopName,
      timestamp: serverTimestamp(),
    });

    // Save to `history` and update/delete assignedDeliveries
    if (deliveryStatus === 'Completed' || deliveryStatus === 'Rejected') {
      // Save to `history`
      await setDoc(doc(db, 'history', billNo as string), {
        billNo,
        address,
        contactNo,
        ownerName,
        shopName,
        deliveryStatus,
        employeeNo,
        completedAt: serverTimestamp(),
        ...(deliveryStatus === 'Rejected' && { rejectionReason }),
      });

      // Query assignedDeliveries by array-contains
      const assignedDeliveriesRef = collection(db, 'assignedDeliveries');
      const q = query(assignedDeliveriesRef, where('billNos', 'array-contains', billNoNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`No assignedDeliveries found with billNo: ${billNoNumber}`);
      } else {
        // Process all matching documents
        const updateTasks = querySnapshot.docs.map(async (docSnapshot) => {
          const currentData = docSnapshot.data();
          const updatedBillNos = currentData.billNos.filter((b: number) => b !== billNoNumber);

          if (updatedBillNos.length === 0) {
            // Delete the entire document if billNos is now empty
            await deleteDoc(docSnapshot.ref);
            console.log(`Deleted document ${docSnapshot.id} from assignedDeliveries`);
            router.push('/deliveries');
          } else {
            // Otherwise, update the array
            await updateDoc(docSnapshot.ref, {
              billNos: updatedBillNos,
            });
            console.log(`Updated billNos in document ${docSnapshot.id}`);
          }
        });

        await Promise.all(updateTasks);
      }
    }

    Alert.alert('Success', 'Delivery status updated.');

  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Failed to save data.');
  }
};




  if (loading || !shopCoords) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading map...</Text>
      </View>
    );
  }


  const fetchShopImage = async () => {
  try {
    const normalizedShopName = Array.isArray(shopName)
  ? shopName[0]?.trim().toLowerCase()
  : shopName?.trim().toLowerCase();
    if (!normalizedShopName) return;

    const shopRef = doc(db, 'shops', normalizedShopName);
    const shopSnap = await getDoc(shopRef);

    if (shopSnap.exists()) {
      const data = shopSnap.data();
      if (data.shopImage) {
        setShopImage(data.shopImage);
      }
    } else {
      console.warn('No such shop found for image.');
    }
  } catch (error) {
    console.error('Error fetching shop image:', error);
  }
};

fetchShopImage();

  return (
  <FlatList
    data={[{ key: 'unique' }]}  // single-item array
    keyExtractor={(item) => item.key}
    keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ paddingBottom: 20, backgroundColor: '#fff'  }}
    renderItem={() => (
      <>
        <Text style={styles.header}>Delivery Details</Text>
        <View style={styles.card}>
          <Text><Text style={styles.label}>Bill No:</Text> {billNo}</Text>
          <Text><Text style={styles.label}>Shop Name:</Text> {shopName}</Text>
          <Text><Text style={styles.label}>Owner:</Text> {ownerName}</Text>
          <Text><Text style={styles.label}>Contact:</Text> {contactNo}</Text>
          <Text><Text style={styles.label}>Address:</Text> {address}</Text>
        </View>

        {/* Status Dropdown */}
        <View style={[styles.statusContainer, { zIndex: 3000 }]}>
          <Text style={styles.label}>Delivery Status:</Text>
          <DropDownPicker
            open={open}
            value={deliveryStatus}
            items={[
              { label: 'Pending', value: 'Pending' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Rejected', value: 'Rejected' },
            ]}
            setOpen={setOpen}
            setValue={setDeliveryStatus}
            containerStyle={{ marginVertical: 10 }}
            style={{ zIndex: 10000 }}
            dropDownContainerStyle={{ zIndex: 10000 }}
          />
        </View>

        {/* Reason TextBox (only if Rejected) */}
        {deliveryStatus === 'Rejected' && (
          <View style={styles.reasonContainer}>
            <Text style={styles.label}>Reason for Rejection:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reason"
              value={rejectionReason}
              onChangeText={setReason}
              multiline
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button title="Save" color="green" onPress={handleSave} />
        </View>

        <MapView
          style={styles.map}
          initialRegion={{
            latitude: shopCoords.latitude,
            longitude: shopCoords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={shopCoords} title="Shop Location" pinColor="red" />
          {userLocation && <Marker coordinate={userLocation} title="Your Location" pinColor="blue" />}
        </MapView>

        <View style={styles.buttonContainer}>
          <Button title="Get Directions" onPress={openDirections} />
        </View>

        {shopImage && (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Shop Image</Text>
            <Image
              source={{ uri: shopImage }}
              style={{ width: 350, height: 230, borderRadius: 10, marginTop: 5 }}
              resizeMode="cover"
            />
          </View>
        )}
      </>
    )}
  />
);
};

export default DeliveryDetail;

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: '#fff'  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    elevation: 3,
  },
  label: { fontWeight: 'bold' },
  map: {
    height: 300,
    marginHorizontal: 10,
    borderRadius: 10,
    marginTop:20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 20,
    marginLeft: 15,
  },
  buttonContainer: {
    marginHorizontal: 10,
    marginTop: 10,
  },
  reasonContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
    minHeight: 60,
  },
  statusContainer: {
  marginHorizontal: 10,
  zIndex: 3000,
  elevation: 5,
  marginBottom: 20,
},

  save:{
    marginHorizontal: 10,
    marginTop: 10,
    
 
  },
});
