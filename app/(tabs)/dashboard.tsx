import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Entypo } from '@expo/vector-icons';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import { format } from 'date-fns';
import { db } from '../../config/firebaseConfig'; 

export default function DashboardScreen() {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [target, setTarget] = useState(100);
  const [achieved, setAchieved] = useState(0);
  const [overflow, setOverflow] = useState(0);
  const [employeeNo, setEmployeeNo] = useState('');
  const [jobType, setJobType] = useState('');
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Moved fetchAssignedDeliveries outside useEffect
  const fetchAssignedDeliveries = async (empNo: string) => {
    try {
      const deliveryQuery = query(
        collection(db, 'assignedDeliveries'),
        where('deliverEmpNo', '==', empNo)
      );
      const deliverySnapshot = await getDocs(deliveryQuery);

      let count = 0;

      for (const doc of deliverySnapshot.docs) {
        const data = doc.data();
        if (data.billNos && Array.isArray(data.billNos)) {
          count += data.billNos.length;
        }
      }

      setDeliveryCount(count);
    } catch (error) {
      console.error('Error fetching delivery count:', error);
    }
  };

  // Moved fetchEmployeeData outside useEffect
  const fetchEmployeeData = async (empNo: string) => {
    try {
      if (!empNo) return;

      const currentMonth = format(new Date(), 'MMMM yyyy');
      const currentDate = format(new Date(), 'yyyy-MM-dd');

      const q = query(collection(db, 'employeeTargets'), where('employeeNo', '==', empNo));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const employeeData = querySnapshot.docs[0].data();
        setTarget(employeeData.target || 100);
        setAchieved(employeeData.achievement || 0);

        if (!employeeData.month || employeeData.month !== currentMonth) {
          await setDoc(
            doc(db, 'employeeTargets', querySnapshot.docs[0].id),
            {
              ...employeeData,
              month: currentMonth,
              systemDate: currentDate,
            },
            { merge: true }
          );
        }
      } else {
        await addDoc(collection(db, 'employeeTargets'), {
          employeeNo: empNo,
          achievement: 0,
          target: 100,
          month: currentMonth,
          systemDate: currentDate,
        });
      }
    } catch (error) {
      console.error('Error fetching or updating employee data:', error);
    }
  };

  // Moved fetchUserData outside useEffect
  const fetchUserData = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail) {
        const q = query(collection(db, 'users'), where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserName(userData.name || "Unknown User");
          setProfileImage(userData.profileImage || "https://avatar.iran.liara.run/public/35");
          setJobType(userData.jobType || '');

          const empNo = userData.employeeNo || '';
          setEmployeeNo(empNo);
          await AsyncStorage.setItem('employeeNo', empNo);

          fetchEmployeeData(empNo);

          if (userData.jobType === 'Deliverer') {
            fetchAssignedDeliveries(empNo);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    // Calculate overflow only when achievement changes
    if (achieved > target) {
      setOverflow(achieved - target);
    } else {
      setOverflow(0); // Reset overflow if achieved is less than or equal to target
    }
  }, [achieved, target]); // This hook runs only when achieved or target changes

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await AsyncStorage.removeItem('userEmail');
          router.replace('/'); // Redirect to login screen
        },
      },
    ], { cancelable: true });
  };

  const getProgressBarColor = () => {
    const percentage = (achieved / target) * 100;
    if (percentage >= 80) {
      return 'green';
    } else if (percentage >= 40) {
      return 'yellow';
    }
    return 'red';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await router.replace('/(tabs)/dashboard');
    setRefreshing(false);
  };

  const progressColor = getProgressBarColor();
  const progressPercentage = (achieved / target) * 100;

  return (
    <View style={styles.container}>
      {sidebarVisible && (
        <View style={styles.sidebarLayer}>
          <View style={styles.sidebar}>
            <TouchableOpacity onPress={() => setSidebarVisible(false)} style={styles.closeButton}>
              <Entypo name="cross" size={30} color="blue" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/manageprofile')} style={styles.sidebarItem}>
              <Entypo name="user" size={24} color="darkblue" style={styles.icon} />
              <Text style={styles.sidebarText}>Manage Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.sidebarItem}>
              <Entypo name="back" size={24} color="darkblue" style={styles.icon} />
              <Text style={styles.sidebarText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Entypo name="menu" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.profileContainer}>
          <Image source={{ uri: profileImage || "https://avatar.iran.liara.run/public/35" }} style={styles.profileImage} />
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {(jobType === 'Seller' || jobType === 'Distributor') && (
          !sidebarVisible && (
            <View>
              <View style={styles.progressContainer}>
                <Text style={styles.progressTitle}>Monthly Target Achievement</Text>
                <Progress.Bar 
                  progress={achieved / target} 
                  width={300} 
                  height={20} 
                  color={progressColor} 
                  borderWidth={1} 
                  borderColor="#D32F2F" 
                />
                <Text style={styles.progressText}>{achieved} / {target}</Text>
                {overflow > 0 && (
                  <Text style={styles.progressOverflow}>Best Selling : {overflow}</Text>
                )}
              </View>

              <View style={styles.cardContainer}>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/addshop')}>
                  <Image source={require('@/assets/images/store.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>Add Shop</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/stock')}>
                  <Image source={require('@/assets/images/stock.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>Check Stock</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/invoice')}>
                  <Image source={require('@/assets/images/order.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>Place Order</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardContainersecound}>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/notepad')}>
                  <Image source={require('@/assets/images/note.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>Note...........</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/calculator')}>
                  <Image source={require('@/assets/images/calculator.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>Calculator</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/ViewBills')}>
                  <Image source={require('@/assets/images/invoice.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>Invoices</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        )}
        {(jobType === 'Deliverer' || jobType === 'Distributor') && (
          !sidebarVisible && (
            <View>
              <Image source={require('@/assets/images/fastdeli.png')} style={styles.fastdeliImage} />
              <View style={styles.cardContainer}>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/HistoryScreen')}>
                  <Image source={require('@/assets/images/history.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/billdata')}>
                  <Image source={require('@/assets/images/invoice.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>Invoices</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/deliveries')}>
                  <Image source={require('@/assets/images/delivery.png')} style={styles.cardImage} />
                  <Text style={styles.cardText}>Check Delivery</Text>
                  <Text style={styles.deliveryCountText}>[ {deliveryCount} ]</Text>
                </TouchableOpacity>
              </View>

              {(jobType !== 'Distributor') && (
                <View style={styles.cardContainersecound}>
                  <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/notepad')}>
                    <Image source={require('@/assets/images/note.png')} style={styles.cardImage} />
                    <Text style={styles.cardText}>Note...........</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/calculator')}>
                    <Image source={require('@/assets/images/calculator.png')} style={styles.cardImage} />
                    <Text style={styles.cardText}>Calculator</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  sidebarLayer: { 
    position: 'absolute', 
    top: 124, // Changed from 90 to 0 to cover full screen
    left: 0, 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(59, 55, 55, 0.5)', // Increased opacity for better visibility
    justifyContent: 'flex-start',
    zIndex: 1000, // Added zIndex to ensure sidebar is on top
  },
  sidebar: { 
    width: 220, 
    backgroundColor: 'white', 
    padding: 20, 
    elevation: 10, // Increased elevation for better layering on Android
    height: '100%',
    zIndex: 1001, // Ensure sidebar content is above the layer
  },
  closeButton: { alignSelf: 'flex-end', marginBottom: 25, marginTop: 10 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sidebarText: { fontSize: 18, color: 'darkblue', fontWeight: 'bold', marginLeft: 10 },
  icon: { marginRight: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 30, backgroundColor: 'blue' },
  headerTitle: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  profileContainer: { alignItems: 'center' },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginTop: 5 },
  userName: { color: 'white', fontSize: 10, marginTop: 5 },
  progressContainer: { alignItems: 'center', marginTop: 20 },
  progressTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  progressOverflow: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: 'blue' },
  progressText: { marginTop: 5, fontSize: 16, fontWeight: 'bold' },
  cardContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  cardContainersecound: { flexDirection: 'row', marginTop: 20, justifyContent: 'flex-start', columnGap: 8 },
  card: { backgroundColor: 'white', padding: 10, alignItems: 'center', borderRadius: 10, elevation: 3, width: 130 },
  cardImage: { width: 60, height: 60, marginBottom: 10 },
  cardText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  fastdeliImage: { width: 300, height: 100, marginTop: 10, marginLeft: 40 },
  deliveryCountText: {
    fontSize: 12,
    color: 'blue',
    fontWeight: 'bold',
    marginTop: 5,
  },
});