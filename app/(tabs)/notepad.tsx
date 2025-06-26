import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const NotePadScreen = () => {
  const [employeeNo, setEmployeeNo] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [editNoteId, setEditNoteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeNo = async () => {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) return;
      const userQuery = query(collection(db, 'users'), where('email', '==', userEmail));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const empNo = userSnapshot.docs[0].data().employeeNo;
        setEmployeeNo(empNo);
        fetchNotes(empNo);
      }
    };
    fetchEmployeeNo();
  }, []);

  const fetchNotes = async (empNo: string) => {
    const q = query(collection(db, 'notes'), where('employeeNo', '==', empNo));
    const snapshot = await getDocs(q);
    const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setNotes(notesData);
  };

  const handleSave = async () => {
    if (!title || !content) {
      Alert.alert('Both title and content are required.');
      return;
    }

    try {
      if (editNoteId) {
        // Update existing note
        const noteRef = doc(db, 'notes', editNoteId);
        await updateDoc(noteRef, {
          title,
          content,
          updatedAt: serverTimestamp(),
        });
        setEditNoteId(null);
      } else {
        // Create new note
        await addDoc(collection(db, 'notes'), {
          employeeNo,
          title,
          content,
          createdAt: serverTimestamp(),
        });
      }

      setTitle('');
      setContent('');
      fetchNotes(employeeNo);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleEdit = (note: any) => {
    setTitle(note.title);
    setContent(note.content);
    setEditNoteId(note.id);
  };

const handleDelete = (id: string) => {
  Alert.alert(
    'Confirm Delete',
    'Are you sure you want to delete this note?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'notes', id));
            // Clear inputs when deleting
            setTitle('');
            setContent('');
            setEditNoteId(null);  // reset edit mode if any
            fetchNotes(employeeNo);
          } catch (error) {
            console.error('Error deleting note:', error);
          }
        },
      },
    ],
    { cancelable: true }
  );
};



  const renderItem = ({ item }: any) => (
    <View style={styles.noteItem}>
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteContent}>{item.content}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
          <Text>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Notes</Text>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Content"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        style={[styles.input, { height: 100 }]}
      />
      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>{editNoteId ? 'Update' : 'Save'}</Text>
      </TouchableOpacity>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No notes available.</Text>}
      />
    </View>
  );
};

export default NotePadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  noteItem: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  noteTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  noteContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editBtn: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
  },
});
