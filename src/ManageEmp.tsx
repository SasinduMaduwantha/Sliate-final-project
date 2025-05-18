import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import './ManageEmp.css';

const db = getFirestore();

type User = {
  id: string;
  name: string;
  employeeNo: string;
  jobType: string;
  email: string;
  contactNo: string;
  uid?: string;
};

const ManageEmp = () => {
  const [sellers, setSellers] = useState<User[]>([]);
  const [deliverers, setDeliverers] = useState<User[]>([]);
  const [employeeNoToDelete, setEmployeeNoToDelete] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
const [delivererFilter, setDelivererFilter] = useState('');
const filteredSellers = sellers.filter(s => s.employeeNo.includes(sellerFilter));
const filteredDeliverers = deliverers.filter(d => d.employeeNo.includes(delivererFilter));



  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

      setSellers(allUsers.filter(user => user.jobType === 'Seller'));
      setDeliverers(allUsers.filter(user => user.jobType === 'Deliverer'));
    };

    fetchUsers();
  }, []);

  const handleDeleteFromInput = async () => {
    if (!employeeNoToDelete) return alert('Enter an employee number');
    if (!window.confirm('Are you sure you want to delete this Account?')) return;

    const q = query(collection(db, 'users'), where('employeeNo', '==', employeeNoToDelete));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert('No user found with this employee number');
      return;
    }

    const userDoc = snapshot.docs[0];

    // Delete from Firestore
    await deleteDoc(doc(db, 'users', userDoc.id));
    alert('User deleted successfully');
    setEmployeeNoToDelete('');
    window.location.reload(); // reload to update the UI
  };

  

  return (
    <div className="manage-container">
        <h2 className='headh2'>Manage Employee</h2>
  <div className="delete-section">
    <input
      type="text"
      placeholder="Enter Employee No"
      value={employeeNoToDelete}
      onChange={(e) => setEmployeeNoToDelete(e.target.value)}
    />
    <button onClick={handleDeleteFromInput}>Delete</button>
  </div>
  
      <div className="tables-container">
      <div className="table-section">
  <div className="table-header">
    <h3>Sellers ({sellers.length})</h3>
    <div className="filter-group">
      <input
        type="text"
        placeholder="Filter by Emp No"
        value={sellerFilter}
        onChange={(e) => setSellerFilter(e.target.value)}
      />
    </div>
  </div>
  <table className="emp-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Employee No</th>
        <th>Email</th>
        <th>Contact No</th>
      </tr>
    </thead>
    <tbody>
      {filteredSellers.map(user => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>{user.employeeNo}</td>
          <td>{user.email}</td>
          <td>{user.contactNo}</td>
        </tr>
      ))}
      {filteredSellers.length === 0 && <tr><td colSpan={4}>No sellers found.</td></tr>}
    </tbody>
  </table>
</div>

<div className="table-section">
  <div className="table-header">
    <h3>Deliverers ({deliverers.length})</h3>
    <div className="filter-group">
      <input
        type="text"
        placeholder="Filter by Emp No"
        value={delivererFilter}
        onChange={(e) => setDelivererFilter(e.target.value)}
      />
    </div>
  </div>
  <table className="emp-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Employee No</th>
        <th>Email</th>
        <th>Contact No</th>
      </tr>
    </thead>
    <tbody>
      {filteredDeliverers.map(user => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>{user.employeeNo}</td>
          <td>{user.email}</td>
          <td>{user.contactNo}</td>
        </tr>
      ))}
      {filteredDeliverers.length === 0 && <tr><td colSpan={4}>No deliverers found.</td></tr>}
    </tbody>
  </table>
</div>

        </div>
      </div>
   
  );
  
};

export default ManageEmp;
