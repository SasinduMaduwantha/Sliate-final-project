import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebaseConfig'; 


export default function StockScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(collection(db, "inventory"));
        const querySnapshot = await getDocs(q);
        const itemList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(itemList.reverse());
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = items.filter(item =>
    item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleItems = showAll ? filteredItems : filteredItems.slice(0, 15);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Inventory Stock</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by item name or number"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.header]}>Item No</Text>
        <Text style={[styles.cell, styles.header]}>Item Name</Text>
        <Text style={[styles.cell, styles.header]}>Price</Text>
        <Text style={[styles.cell, styles.header]}>Qty</Text>
      </View>

      <FlatList
        data={visibleItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.itemNo}</Text>
            <Text style={styles.cell}>{item.itemName}</Text>
            <Text style={styles.cell}>{item.price}</Text>
            <Text style={styles.cell}>{item.quantity}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
      />

      {filteredItems.length > 15 && (
        <TouchableOpacity onPress={() => setShowAll(prev => !prev)}>
          <Text style={styles.toggleText}>
            {showAll ? 'Show Less ▲' : 'Show More ▼'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    flex: 1,
  },
  heading: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  header: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
  toggleText: {
    textAlign: 'center',
    color: '#007bff',
    marginTop: 10,
    fontWeight: '600',
  },
});
