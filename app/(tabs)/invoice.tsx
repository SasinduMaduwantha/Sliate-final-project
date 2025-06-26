import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import {  collection, getDocs, query, doc, getDoc, setDoc, where } from 'firebase/firestore';

import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../config/firebaseConfig';


export default function InvoiceScreen() {
    const router = useRouter();
  
    const [shopDetails, setShopDetails] = useState<any>(null);
    const [searchShopName, setSearchShopName] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [itemNo, setItemNo] = useState('');
    const [quantity, setQuantity] = useState('');
    const [addedItems, setAddedItems] = useState<any[]>([]);
    const [sellerEmpNo, setSellerEmpNo] = useState('');
  
    // Fetch sellerEmpNo from AsyncStorage
    useEffect(() => {
      const fetchEmployeeNo = async () => {
        try {
          const userEmail = await AsyncStorage.getItem('userEmail');
          if (userEmail) {
            const q = query(collection(db, 'users'), where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              setSellerEmpNo(userData.employeeNo || '');
            }
          }
        } catch (error) {
          console.error("Error fetching sellerEmpNo:", error);
        }
      };
  
      fetchEmployeeNo();
    }, []);

    const goToDashboard = () => {
      router.replace('/dashboard'); // this reloads the dashboard screen
    };
  
    // Fetch inventory items
    useEffect(() => {
      const fetchItems = async () => {
        try {
          const q = query(collection(db, "inventory"));
          const querySnapshot = await getDocs(q);
          const itemList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setItems(itemList);
        } catch (error) {
          console.error("Error fetching inventory:", error);
        }
      };
  
      fetchItems();
    }, []);
  
    const handleSearchShop = async () => {
      if (!searchShopName.trim()) {
        Alert.alert('Error', 'Please enter a shop name.');
        return;
      }
  
      try {
        const shopRef = doc(db, "shops", searchShopName.trim().toLowerCase());
        const shopSnap = await getDoc(shopRef);
  
        if (shopSnap.exists()) {
          setShopDetails(shopSnap.data());
        } else {
          Alert.alert('Error', 'Shop not found.');
        }
      } catch (error) {
        console.error("Error searching shop:", error);
      }
    };
  
    const handleAddItem = () => {
      if (!itemNo || !quantity) {
        Alert.alert('Error', 'Enter item number and quantity.');
        return;
      }
  
      const selectedItem = items.find(i => i.itemNo.toLowerCase() === itemNo.trim().toLowerCase());
  
      if (!selectedItem) {
        Alert.alert('Error', 'Item not found.');
        return;
      }
  
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        Alert.alert('Error', 'Quantity must be a positive number.');
        return;
      }
  
      if (qty > selectedItem.quantity) {
        Alert.alert('Error', 'Not enough stock.');
        return;
      }
  
      const total = parseFloat(selectedItem.price) * qty;
  
      const itemToAdd = {
        itemNo: selectedItem.itemNo,
        itemName: selectedItem.itemName,
        price: selectedItem.price,
        quantity: qty,
        total,
      };
  
      setAddedItems(prev => [...prev, itemToAdd]);
      setItemNo('');
      setQuantity('');
    };
  
    const handleRemoveItem = (index: number) => {
      const updatedItems = [...addedItems];
      updatedItems.splice(index, 1);
      setAddedItems(updatedItems);
    };
  
    const handleSubmitInvoice = async () => {
      if (!shopDetails || addedItems.length === 0) {
        Alert.alert('Error', 'Shop and items required.');
        return;
      }
    
      const totalAmount = addedItems.reduce((sum, item) => sum + item.total, 0);
    
      try {
        // Step 1: Reference to the counter document
        const counterRef = doc(db, 'counters', 'invoiceCounter');
    
        // Step 2: Get the current counter value
        const counterSnap = await getDoc(counterRef);
        let currentBillNo = 1;
    
        if (counterSnap.exists()) {
          currentBillNo = counterSnap.data().latest + 1;
        }
    
        // Step 3: Update the counter
        await setDoc(counterRef, { latest: currentBillNo });
    
        // Step 4: Create invoice with generated billNo
        const invoiceRef = doc(collection(db, 'invoices'));
        await setDoc(invoiceRef, {
          billNo: currentBillNo,
          shopName: shopDetails.shopName,
          sellerEmpNo,
          items: addedItems,
          totalAmount,
          createdAt: new Date(),
        });
    
        // Step 5: Update inventory
        for (const item of addedItems) {
          const itemQuery = query(
            collection(db, 'inventory'),
            where('itemNo', '==', item.itemNo)
          );
          const itemSnapshot = await getDocs(itemQuery);
    
          if (!itemSnapshot.empty) {
            const itemDoc = itemSnapshot.docs[0];
            const currentStock = itemDoc.data().quantity || 0;
            const newStock = currentStock - item.quantity;
    
            await setDoc(itemDoc.ref, { ...itemDoc.data(), quantity: newStock });
          }
        }
    
        // 🔥 Step 6: Update employee achievement in employeeTargets
        const q = query(collection(db, 'employeeTargets'), where('employeeNo', '==', sellerEmpNo));
        const querySnapshot = await getDocs(q);
    
        if (!querySnapshot.empty) {
          const targetDoc = querySnapshot.docs[0];
          const currentAchievement = targetDoc.data().achievement || 0;
          const updatedAchievement = currentAchievement + totalAmount;
    
          await setDoc(targetDoc.ref, {
            ...targetDoc.data(),
            achievement: updatedAchievement
          });
        }
    
        Alert.alert('Success', `Invoice submitted! [Bill No:${currentBillNo}] `, [
          {
            text: 'OK',
            onPress: () => {
              setAddedItems([]);
              setShopDetails(null);
              setSearchShopName('');
              router.replace('/dashboard'); // Go back and reload
            },
          },
        ]);
        
        setAddedItems([]);
        setShopDetails(null);
        setSearchShopName('');
      } catch (error) {
        console.error("Submit invoice error:", error);
        Alert.alert('Error', 'Could not submit invoice.');
      }
    };
    
    
    
  
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Invoice</Text>
  
        {/* Search Shop */}
        <View style={styles.rowInline}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Search Shop by Name"
            value={searchShopName}
            onChangeText={setSearchShopName}
          />
          <TouchableOpacity style={styles.button} onPress={handleSearchShop}>
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>
  
        {shopDetails && (
          <View style={styles.shopDetails}>
            <Text>Shop: {shopDetails.shopName}</Text>
            <Text>Owner: {shopDetails.ownerName}</Text>
            <Text>Address: {shopDetails.address}</Text>
          </View>
        )}
  
        {/* Add Item */}
        <TextInput
          style={styles.input}
          placeholder="Item No"
          value={itemNo}
          onChangeText={setItemNo}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleAddItem}>
          <Text style={styles.buttonText}>Add Item</Text>
        </TouchableOpacity>
  
        {/* Invoice Table */}
        <Text style={styles.subHeading}>Added Items</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.header]}>Item No</Text>
          <Text style={[styles.cell, styles.header]}>Item Name</Text>
          <Text style={[styles.cell, styles.header]}>Price</Text>
          <Text style={[styles.cell, styles.header]}>Qty</Text>
          <Text style={[styles.cell, styles.header]}>Total</Text>
          <Text style={[styles.cell, styles.header]}>Remove</Text>
        </View>
  
        <FlatList
          data={addedItems}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.cell}>{item.itemNo}</Text>
              <Text style={styles.cell}>{item.itemName}</Text>
              <Text style={styles.cell}>{item.price}</Text>
              <Text style={styles.cell}>{item.quantity}</Text>
              <Text style={styles.cell}>{item.total}</Text>
              <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                <Text style={[styles.cell, { color: 'red' }]}>❌</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No items added.</Text>}
        />
  
        <Text style={styles.totalText}>
          Total: {addedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
        </Text>
  
        <TouchableOpacity style={styles.button} onPress={handleSubmitInvoice}>
          <Text style={styles.buttonText}>Submit Invoice</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: { padding: 16, flex: 1, backgroundColor: '#fff' },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    subHeading: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    input: {
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 10,
      paddingHorizontal: 10,
      height: 40,
    },
    button: {
      backgroundColor: '#007bff',
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginLeft: 0,
      marginBottom: 10,
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    rowInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    shopDetails: {
      padding: 10,
      backgroundColor: '#f0f0f0',
      marginBottom: 16,
      borderRadius: 6,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#007bff',
      paddingVertical: 10,
      borderRadius: 5,
    },
    row: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    cell: { flex: 1, fontSize: 12,  marginRight:3 },
    header: { color: '#fff', fontWeight: 'bold', textAlign: 'center'},
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
    totalText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 16,
      textAlign: 'right',
    },
  });