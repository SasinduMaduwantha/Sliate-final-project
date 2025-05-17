import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

interface HistoryItem {
  billNo: string;
  status: string;
  completedAt?: Date;
  shopName?: string;
  reason?: string;
}

const HistoryScreen = () => {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const empNo = await AsyncStorage.getItem('employeeNo');
        if (!empNo) {
          console.warn('Employee number not found');
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, 'history'),
          where('employeeNo', '==', empNo)
        );

        const snapshot = await getDocs(q);
        const results: HistoryItem[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.deliveryStatus === 'Completed' || data.deliveryStatus === 'Rejected') {
            results.push({
              billNo: data.billNo,
              status: data.deliveryStatus,
              completedAt: data.completedAt?.toDate(),
              shopName: data.shopName || 'N/A',
              reason: data.rejectionReason || '',
            });
          }
        });

        // Sort by completedAt (latest first)
        results.sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));
        setHistoryData(results);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Delivery History</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : historyData.length === 0 ? (
        <Text>No history records found.</Text>
      ) : (
        historyData.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text><Text style={styles.label}>Bill No:</Text> {item.billNo}</Text>
            <Text><Text style={styles.label}>Shop Name:</Text> {item.shopName}</Text>
            <Text><Text style={styles.label}>Status:</Text> {item.status}</Text>
            {item.status === 'Rejected' && item.reason ? (
              <Text><Text style={styles.label}>Reason:</Text> {item.reason}</Text>
            ) : null}
            <Text><Text style={styles.label}>Completed At:</Text> {item.completedAt?.toLocaleString() || 'N/A'}</Text>

            <View style={styles.buttonContainer}>
                      <Button title="UNDO" color="orange" />
                    </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
  },

  buttonContainer: {
    
    marginTop: 10,
    width:80,
    marginLeft:260,
    
  },
});
