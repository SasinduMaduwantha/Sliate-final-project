import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Item {
  itemName: string;
  itemNo: string;
  price: number;
  quantity: number;
}

export default function BillDataScreen() {
  const [billNo, setBillNo] = useState('');
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [shopDetails, setShopDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFind = async () => {
    if (!billNo.trim()) {
      Alert.alert('Validation', 'Please enter a bill number.');
      return;
    }

    setLoading(true);
    setInvoiceData(null);
    setShopDetails(null);

    try {
      // 1. Fetch invoice
      const invoiceQuery = query(
        collection(db, 'assignedInvoices'),
        where('billNo', '==', Number(billNo.trim()))
      );

      const snapshot = await getDocs(invoiceQuery);

      if (snapshot.empty) {
        Alert.alert('Not Found', 'No invoice found with that bill number.');
        setLoading(false);
        return;
      }

      const data = snapshot.docs[0].data();
        if (data.createdAt) {
         const createdAtDate = data.createdAt.toDate(); // convert Firestore Timestamp to JS Date
         data.createdAtFormatted = createdAtDate.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
  });
}
      setInvoiceData(data);

      // 2. Fetch related shop data
      const shopQuery = query(
        collection(db, 'shops'),
        where('shopName', '==', data.shopName)
      );
      const shopSnapshot = await getDocs(shopQuery);

      if (!shopSnapshot.empty) {
        const shopData = shopSnapshot.docs[0].data();
        setShopDetails(shopData);
      } else {
        console.warn('No matching shop found.');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch invoice or shop data.');
    } finally {
      setLoading(false);
    }
  };

  // Reset handler to clear all inputs and results
  const handleReset = () => {
    setBillNo('');
    setInvoiceData(null);
    setShopDetails(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Find Invoice Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Bill No"
        value={billNo}
        onChangeText={setBillNo}
        keyboardType="numeric"
      />

      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button title={loading ? 'Searching...' : 'Find'} onPress={handleFind} disabled={loading} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Reset" onPress={handleReset} disabled={loading} color="#ff5c5c" />
        </View>
      </View>

      {invoiceData && (
        <View style={styles.resultContainer}>
            {shopDetails && (
            <>
              <Text style={styles.resultText}>Bill No: {invoiceData.billNo}</Text>
              {invoiceData.createdAtFormatted && (
             <Text style={styles.resultText}>Order Date: {invoiceData.createdAtFormatted}</Text>
                )}
              <Text style={styles.resultText}>Owner Name: {shopDetails.ownerName}</Text>
              <Text style={styles.resultText}>Shop Name: {invoiceData.shopName}</Text>
              <Text style={styles.resultText}>Contact No: {shopDetails.contactNo}</Text>
              <Text style={styles.resultText}>Address: {shopDetails.address}</Text>
            </>
          )}
          
          
          

          

          <Text style={[styles.resultText, { marginTop: 10 }]}>Items:</Text>
          {invoiceData.items.map((item: Item, index: number) => (
            <View key={index} style={styles.itemCard}>
              <Text>Item No: {item.itemNo}</Text>
              <Text>Item Name: {item.itemName}</Text>
              <Text>Price: {item.price}.00</Text>
              <Text>Quantity: {item.quantity}</Text>
            </View>
          ))}

          <Text style={styles.resultText}>Total Amount: Rs.<Text style={{fontWeight: 'bold'}}>{invoiceData.totalAmount}.00</Text></Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop:15,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 5,
    marginTop:10,
  },
  itemCard: {
    padding: 10,
    backgroundColor: '#e6e6e6',
    borderRadius: 6,
    marginTop: 8,
  },
});
