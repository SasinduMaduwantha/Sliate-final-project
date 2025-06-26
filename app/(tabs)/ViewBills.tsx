import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const ViewBills = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchBills = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) return;

      const userQuery = query(collection(db, 'users'), where('email', '==', userEmail));
      const userSnapshot = await getDocs(userQuery);
      

      if (!userSnapshot.empty) {
        const sellerEmpNo = userSnapshot.docs[0].data().employeeNo;
        

        const invoiceQuery = query(
          collection(db, 'invoices'),
          where('sellerEmpNo', '==', sellerEmpNo)
        );
        const invoiceSnapshot = await getDocs(invoiceQuery);

        let invoiceData = invoiceSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            billNo: data.billNo ?? 0, // fallback to 0 if undefined
            shopName: data.shopName ?? '',
            totalAmount: data.totalAmount ?? 0,
            createdAt: data.createdAt ?? { seconds: 0 },
            items: data.items ?? []
          };
        });

        // Sort by descending billNo
        invoiceData.sort((a, b) => Number(b.billNo) - Number(a.billNo));

        setBills(invoiceData);
      }
    } catch (error) {
     
        //console.error('Error fetching bills:', error);
      
    } finally {
      setLoading(false);
    }
  };

  fetchBills();
}, []);


  const renderItem = ({ item }: any) => (
  <View style={styles.billItem}>
    <Text style={styles.billTitle}>Bill No: {item.billNo}</Text>
    <Text>Shop: {item.shopName}</Text>
    <Text>Total: Rs. {item.totalAmount}</Text>
    <Text>Date: {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}</Text>
    <Text style={styles.itemsHeading}>Items:</Text>
    {item.items && item.items.length > 0 ? (
      item.items.map((itm: any, index: number) => (
        <Text key={index} style={styles.itemText}>
          • {itm.itemNo} - Qty: {itm.quantity} * {itm.price}
        </Text>
      ))
    ) : (
      <Text style={styles.itemText}>No items found.</Text>
    )}
  </View>
);


  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recently Submitted Bills</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={bills}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No bills found.</Text>}
        />
      )}
    </View>
  );
};

export default ViewBills;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop:20,
    textAlign: 'center',
  },
  billItem: {
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  billTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
  itemsHeading: {
  marginTop: 8,
  fontWeight: 'bold',
},
itemText: {
  marginLeft: 10,
},

});
