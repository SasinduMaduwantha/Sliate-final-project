import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, BackHandler } from 'react-native';
import { getDocs, query, collection, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebaseConfig';

interface Delivery {
  billNo: string;
  shopName: string;
  ownerName: string;
  contactNo: string;
  address: string;
  latitude: number;
  longitude: number;
}

const DeliveriesScreen = () => {
  const [deliveryData, setDeliveryData] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDeliveries = async () => {
      setLoading(true);
      try {
        const empNo = await AsyncStorage.getItem('employeeNo');
        if (!empNo) {
          console.warn('Employee number not found in AsyncStorage');
          setLoading(false);
          return;
        }

        const deliveryQuery = query(
          collection(db, 'assignedDeliveries'),
          where('deliverEmpNo', '==', empNo)
        );
        const deliverySnapshot = await getDocs(deliveryQuery);
        const results: Delivery[] = [];

        for (const doc of deliverySnapshot.docs) {
          const data = doc.data();
          const billNos = data.billNos;

          if (billNos && Array.isArray(billNos)) {
            for (const billNo of billNos) {
              const invoiceQuery = query(
                collection(db, 'assignedInvoices'),
                where('billNo', '==', billNo)
              );
              const invoiceSnapshot = await getDocs(invoiceQuery);
              if (!invoiceSnapshot.empty) {
                const invoiceData = invoiceSnapshot.docs[0].data();
                const shopName = invoiceData.shopName;

                const shopQuery = query(
                  collection(db, 'shops'),
                  where('shopName', '==', shopName)
                );
                const shopSnapshot = await getDocs(shopQuery);
                if (!shopSnapshot.empty) {
                  const shopData = shopSnapshot.docs[0].data();
                  results.push({
                    billNo,
                    shopName,
                    ownerName: shopData.ownerName || 'N/A',
                    contactNo: shopData.contactNo || 'N/A',
                    address: shopData.address || 'N/A',
                    latitude: shopData.latitude || 0,
                    longitude: shopData.longitude || 0,
                  });
                }
              }
            }
          }
        }

        setDeliveryData(results);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();

    // BackHandler for Android hardware back button
    const backAction = () => {
      router.push('/dashboard');
      return true; // prevent default behavior (exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    // Cleanup backHandler when component unmounts
    return () => backHandler.remove();
  }, []);

  const showLocation = (latitude: number, longitude: number, item: Delivery) => {
    router.push({
      pathname: '/DeliveryDetail',
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        billNo: item.billNo,
        shopName: item.shopName,
        ownerName: item.ownerName,
        contactNo: item.contactNo,
        address: item.address,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Assigned Deliveries</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : deliveryData.length === 0 ? (
        <Text>No deliveries assigned.</Text>
      ) : (
        deliveryData.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text>
              <Text style={styles.label}>Bill No:</Text> {item.billNo}
            </Text>
            <Text>
              <Text style={styles.label}>Shop Name:</Text> {item.shopName}
            </Text>
            <Text>
              <Text style={styles.label}>Owner:</Text> {item.ownerName}
            </Text>
            <Text>
              <Text style={styles.label}>Contact:</Text> {item.contactNo}
            </Text>
            <Text>
              <Text style={styles.label}>Address:</Text> {item.address}
            </Text>
            <Button title="More" onPress={() => showLocation(item.latitude, item.longitude, item)} />
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default DeliveriesScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontWeight: 'bold',
  },
});
