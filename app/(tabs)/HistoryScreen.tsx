import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocs, query, where, collection, doc, writeBatch, Timestamp } from 'firebase/firestore';

import { db } from '../../config/firebaseConfig';

interface HistoryItem {
  billNo: string;
  status: string;
  completedAt?: Date;
  shopName?: string;
  reason?: string;
  undoDisabled?: boolean; // NEW
}

const HistoryScreen = () => {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

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
            const completedAtDate = data.completedAt?.toDate();
            results.push({
              billNo: data.billNo,
              status: data.deliveryStatus,
              completedAt: completedAtDate,
              shopName: data.shopName || 'N/A',
              reason: data.rejectionReason || '',
              undoDisabled: completedAtDate
                ? Date.now() - completedAtDate.getTime() > 60000
                : true,
            });
          }
        });

        results.sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));
        setHistoryData(results);

        // Start an interval to auto-disable undo after 1 min
        interval = setInterval(() => {
          setHistoryData((prev) =>
            prev.map((item) => {
              if (!item.completedAt || item.undoDisabled) return item;
              const timePassed = Date.now() - item.completedAt.getTime();
              return {
                ...item,
                undoDisabled: timePassed > 60000,
              };
            })
          );
        }, 10000); // Check every 10 seconds
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const undoAssignment = async (billNo: string) => {
    try {
      const empNo = await AsyncStorage.getItem('employeeNo');
      if (!empNo) {
        console.warn('Employee number not found');
        return;
      }

      const batch = writeBatch(db);

      // 1. Add the reassignment to assignedDeliveries
      const assignedRef = doc(collection(db, 'assignedDeliveries'));
      batch.set(assignedRef, {
        deliverEmpNo: empNo,
        billNos: [Number(billNo)],
        assignedAt: Timestamp.now(),
      });

      // 2. Find and delete the matching history document
      const historyQuery = query(
        collection(db, 'history'),
        where('employeeNo', '==', empNo),
        where('billNo', '==', billNo)
      );

      const snapshot = await getDocs(historyQuery);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref); // Delete matching history doc
      });

      await batch.commit();
      alert(`Bill ${billNo} has been reassigned.`);

      // Update UI
      setHistoryData((prev) => prev.filter((item) => item.billNo !== billNo));
    } catch (error) {
      console.error('Error during undo:', error);
      alert('Failed to reassign bill.');
    }
  };

  return (
    <View style={styles.fullScreen}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Delivery History</Text>
      {loading ? (
        <Text style={{ color: '#000' }}>Loading...</Text>
      ) : historyData.length === 0 ? (
        <Text style={{ color: '#000' }}>No history records found.</Text>
      ) : (
        historyData.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text><Text style={styles.label}>Bill No:</Text> {item.billNo}</Text>
            <Text><Text style={styles.label}>Shop Name:</Text> {item.shopName}</Text>
            <Text>
            <Text style={styles.label}>Status:</Text>{' '}
            <Text style={item.status === 'Completed' ? styles.completedText : styles.rejectedText}>
            {item.status}
            </Text>
            </Text>
            {item.status === 'Rejected' && item.reason ? (
              <Text><Text style={styles.label}>Reason:</Text> {item.reason}</Text>
            ) : null}
            <Text><Text style={styles.label}>Completed At:</Text> {item.completedAt?.toLocaleString() || 'N/A'}</Text>

            <View style={styles.buttonContainer}>
              <Button
                title="UNDO"
                color="orange"
                onPress={() => undoAssignment(item.billNo)}
                disabled={item.undoDisabled}
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
    </View>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({

  fullScreen: {
    flex: 1,
    backgroundColor: '#fff', // full-screen white background
  },
  container: {
    paddingBottom: 30,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 10,
    color: '#000',
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
    color: '#000',
  },
  buttonContainer: {
    marginTop: 10,
    width: 80,
    marginLeft: 260,
  },
  completedText: {
  color: '#055484',
  fontWeight: 'bold',
},
rejectedText: {
  color: 'red',
  fontWeight: 'bold',
},

});
