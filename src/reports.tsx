import { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import './Reports.css';

const db = getFirestore();

type AssignedInvoice = {
  id: string;
  assignedAt: Timestamp;
  billNo: string;
  createdAt: Timestamp;
  deliverEmpNo: string;
  items: any[];
  sellerEmpNo: string;
  shopName: string;
  totalAmount: number;
  deliveryStatus?: string;
};

const Reports = () => {
  const [assignedInvoices, setAssignedInvoices] = useState<AssignedInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<AssignedInvoice[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
   const [error, setError] = useState('');
   const [selectedStatus, setSelectedStatus] = useState('');
   const totalFilteredAmount = filteredInvoices.reduce(
  (sum, invoice) => sum + (invoice.totalAmount || 0),
  0
);


  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invoiceSnap = await getDocs(collection(db, 'assignedInvoices'));
        const invoiceData = invoiceSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            assignedAt: d.assignedAt,
            billNo: d.billNo.toString(),
            createdAt: d.createdAt,
            deliverEmpNo: d.deliverEmpNo,
            items: d.items || [],
            sellerEmpNo: d.sellerEmpNo,
            shopName: d.shopName,
            totalAmount: d.totalAmount,
          };
        });

        const statusSnap = await getDocs(collection(db, 'deliverystatus'));
        const statusMap: Record<string, string> = {};

        for (const doc of statusSnap.docs) {
          const data = doc.data();
          const billNo = data.billNo?.toString();
          if (billNo) {
            statusMap[billNo] = data.deliveryStatus || 'Pending';
          }
        }

        const mergedData = invoiceData.map(inv => ({
          ...inv,
          deliveryStatus: statusMap[inv.billNo] || 'Pending',
        }));
          
        mergedData.sort((a, b) => Number(b.billNo) - Number(a.billNo));

        setAssignedInvoices(mergedData);
        setFilteredInvoices(mergedData);
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    };

    fetchData();
  }, []);

  const handleFilter = () => {
  if (!fromDate) {
    alert('Please select From Date.');
    return;
  }

  const from = new Date(fromDate);
  const to = toDate ? new Date(toDate + 'T23:59:59') : new Date(); // End of toDate or now

  const filtered = assignedInvoices.filter(inv => {
    const created = inv.createdAt.toDate();
    const dateMatch = created >= from && created <= to;
    const statusMatch = selectedStatus ? inv.deliveryStatus === selectedStatus : true;
    return dateMatch && statusMatch;
  });

  const sortedFiltered = filtered.sort((a, b) => Number(b.billNo) - Number(a.billNo));
setFilteredInvoices(sortedFiltered);
  setError('');
};


  const handleReset = () => {
  setFromDate('');
  setToDate('');
  setSelectedStatus('');
  setFilteredInvoices(assignedInvoices);
};


  return (
    <div className="report-container">
      <h2> Report</h2>

      <div className="report-filters">
  <label>From Date:</label>
  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />

  <label>To Date:</label>
  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />

  <label>Status:</label>
  <select className='select' value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
    <option value="">All</option>
    <option value="Completed">Complete</option>
    <option value="Rejected">Reject</option>
    <option value="Pending">Pending</option>
  </select>

  <button onClick={handleFilter}>Filter</button>
  <button onClick={handleReset}>Reset</button>
<button onClick={() => window.print()}>Print</button>

</div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
<div id="printable-report">
  <h3>Invoices Report</h3> 
  <div className="print-only">
    
    <div className="filter-summary-row">
    {fromDate && <p><strong>From:</strong> {fromDate}</p>}
    {toDate && <p><strong>To:</strong> {toDate}</p>}
    {selectedStatus && <p><strong>Status:</strong> {selectedStatus}</p>}
  </div>
  </div>
  <table className="report-table">
    <thead>
      <tr>
        <th>Created At</th>
        <th>Bill No</th>
        <th>Assigned At</th>
        <th>Deliverer No</th>
        <th>Seller No</th>
        <th>Shop</th>
        <th>Total</th>
        <th>Items</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {filteredInvoices.map(inv => (
        <tr key={inv.id}>
          <td>{new Date(inv.createdAt.toDate()).toLocaleString()}</td>
          <td>{inv.billNo}</td>
          <td>{new Date(inv.assignedAt.toDate()).toLocaleString()}</td>
          <td>{inv.deliverEmpNo}</td>
          <td>{inv.sellerEmpNo}</td>
          <td>{inv.shopName}</td>
          <td>{inv.totalAmount.toFixed(2)}</td>
          <td>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {inv.items.map((item, index) => (
                <li key={index}>
                  Item: {item.itemNo} - Qty: {item.quantity}
                </li>
              ))}
            </ul>
          </td>
          <td>{inv.deliveryStatus}</td>
        </tr>
      ))}
    </tbody>
  </table>
  
  <div style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '16px' }}>
    Total Amount of All Bills: Rs. {totalFilteredAmount.toFixed(2)}
  </div>

</div>
</div>
  );
};

export default Reports;
