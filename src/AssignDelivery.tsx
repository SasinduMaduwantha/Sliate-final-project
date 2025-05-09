import { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  Timestamp,
  where,
  query,
  doc,
  writeBatch,
} from 'firebase/firestore';
import './AssignDelivery.css';

const db = getFirestore();

type Deliver = {
  employeeNo: string;
  name: string;
  profileImage: string;
  contactNo: string;
  email: string;
};

type Invoice = {
  id: string;
  billNo: string;
  shopName: string;
  totalAmount: number;
  createdAt: Timestamp;
  city: string;
};

const AssignDelivery = () => {
  const [deliverers, setDeliverers] = useState<Deliver[]>([]);
  const [selectedDeliverer, setSelectedDeliverer] = useState<Deliver | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [deliverSnap, invoiceSnap, shopSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('jobType', '==', 'Deliverer'))),
        getDocs(collection(db, 'invoices')),
        getDocs(collection(db, 'shops')),
      ]);

      const shopMap: { [shopName: string]: string } = {};
      shopSnap.forEach(doc => {
        const data = doc.data();
        if (data.shopName && data.city) {
          shopMap[data.shopName] = data.city;
        }
      });

      const delivererList = deliverSnap.docs.map(doc => {
        const data = doc.data();
        const validImage =
          typeof data.profileImage === 'string' && data.profileImage.startsWith('http')
            ? data.profileImage
            : 'https://via.placeholder.com/100';

        return {
          employeeNo: data.employeeNo,
          name: data.name,
          profileImage: validImage,
          contactNo: data.contactNo || 'N/A',
          email: data.email || 'N/A',
        };
      });

      const invoiceList = invoiceSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          billNo: data.billNo,
          shopName: data.shopName,
          totalAmount: data.totalAmount,
          createdAt: data.createdAt,
          items: data.items || [],
          city: shopMap[data.shopName] || 'N/A',
        } as Invoice;
      });

      setDeliverers(delivererList);
      setInvoices(invoiceList);
      setFilteredInvoices(invoiceList);
    };

    fetchData();
  }, []);

  const handleFilter = () => {
    let filtered = invoices;

    if (city) {
      filtered = filtered.filter(inv =>
        inv.city?.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => {
        const invDate =
          inv.createdAt instanceof Timestamp
            ? inv.createdAt.toDate()
            : new Date(inv.createdAt);
        return invDate >= from && invDate <= to;
      });
    }

    setFilteredInvoices(filtered);
  };

  const handleAssign = async () => {
    if (!selectedDeliverer || selectedBills.length === 0)
      return alert('Select deliverer and at least one bill');

    const batch = writeBatch(db);

    // Assign each bill separately with the selected deliverer
    selectedBills.forEach(async (billNo) => {
      const assignedRef = doc(collection(db, 'assignedDeliveries'));
      batch.set(assignedRef, {
        deliverEmpNo: selectedDeliverer.employeeNo,
        billNos: [billNo], // Store only one bill in the array
        assignedAt: Timestamp.now(),
      });

      const assignedInvoice = invoices.find(inv => inv.billNo === billNo);
      if (assignedInvoice) {
        const invoiceRef = doc(collection(db, 'assignedInvoices'));
        batch.set(invoiceRef, {
          ...assignedInvoice,
          deliverEmpNo: selectedDeliverer.employeeNo,
          assignedAt: Timestamp.now(),
        });

        const originalRef = doc(db, 'invoices', assignedInvoice.id);
        batch.delete(originalRef);
      }
    });

    await batch.commit();

    alert('Deliveries assigned successfully!');
    setSelectedBills([]);
    const remaining = invoices.filter(inv => !selectedBills.includes(inv.billNo));
    setInvoices(remaining);
    setFilteredInvoices(remaining);
  };

  return (
    <div className="assign-delivery-container">
      <div className="assign-left-panel">
        <h3>Select Deliverer</h3>
        <select
          value={selectedDeliverer?.employeeNo || ''}
          onChange={e => {
            const selected = deliverers.find(d => d.employeeNo === e.target.value);
            setSelectedDeliverer(selected || null);
          }}
        >
          <option value="">Select Deliverer</option>
          {deliverers.map(d => (
            <option key={d.employeeNo} value={d.employeeNo}>
              {d.employeeNo}
            </option>
          ))}
        </select>

        {selectedDeliverer && (
          <div className="assign-deliverer-info">
            <img
              src={selectedDeliverer.profileImage}
              alt="Profile"
              className="assign-profile-img"
              onError={(e) =>
                ((e.target as HTMLImageElement).src = 'https://avatar.iran.liara.run/public/35')
              }
            />
            <p><strong>Name:</strong> {selectedDeliverer.name}</p>
            <p><strong>Contact:</strong> {selectedDeliverer.contactNo}</p>
            <p><strong>Email:</strong> {selectedDeliverer.email}</p>
            <p><strong>Employee No:</strong> {selectedDeliverer.employeeNo}</p>
          </div>
        )}
        <button
          className="assign-reset-button"
          onClick={() => setSelectedDeliverer(null)}
          style={{ marginTop: '10px' }}
        >
          Reset Deliverer
        </button>
      </div>

      <div className="assign-right-panel">
        <h3>Filter Invoices</h3>
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={e => setCity(e.target.value)}
        />
        <div className="assign-date-range">
          <label>From</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <label>To</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
        <div className="assign-filter-buttons">
          <button onClick={handleFilter} className='topbutton'>Filter</button>
          <button
            onClick={() =>
              setSelectedBills(filteredInvoices.map(inv => inv.billNo))
            } 
            className='topbutton'
          >
            Select All
          </button>
          <button
            onClick={() => {
              setCity('');
              setFromDate('');
              setToDate('');
              setFilteredInvoices(invoices);
              setSelectedBills([]);
            }}
            className='topbutton'
          >
            Reset
          </button>
        </div>

        <table className="assign-invoice-select-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Bill No</th>
              <th>Shop</th>
              <th>Total</th>
              <th>City</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(inv => (
              <tr key={inv.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedBills.includes(inv.billNo)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedBills([...selectedBills, inv.billNo]);
                      } else {
                        setSelectedBills(
                          selectedBills.filter(b => b !== inv.billNo)
                        );
                      }
                    }}
                  />
                </td>
                <td>{inv.billNo}</td>
                <td>{inv.shopName}</td>
                <td>{inv.totalAmount}</td>
                <td>{inv.city}</td>
                <td>{new Date(inv.createdAt.toDate()).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="assign-assign-button" onClick={handleAssign}>
          Assign to Deliverer
        </button>
      </div>
    </div>
  );
};

export default AssignDelivery;
