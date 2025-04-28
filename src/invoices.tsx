import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import './InvoiceAdminPanel.css';

const db = getFirestore();

type InvoiceItem = {
  itemName: string;
  quantity: number;
  price: number;
  total: number;
};

type Invoice = {
  id: string;
  billNo: string;
  shopName: string;
  city: string;
  sellerEmpNo: string;
  totalAmount: number;
  createdAt: Timestamp;
  items: InvoiceItem[];
};

const InvoiceAdminPanel = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [city, setCity] = useState('');
  const [shop, setShop] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [shops, setShops] = useState<{ [shopName: string]: string }>({});


  useEffect(() => {
    const fetchInvoicesAndShops = async () => {
      const [invoiceSnap, shopSnap] = await Promise.all([
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
  
      const invoiceList = invoiceSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];
  
      invoiceList.sort((a, b) => parseInt(b.billNo) - parseInt(a.billNo));
  
      setShops(shopMap);
      setInvoices(invoiceList);
      setFilteredInvoices(invoiceList);
    };
  
    fetchInvoicesAndShops();
  }, []);
  

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => {
        const invDate = inv.createdAt instanceof Timestamp
  ? inv.createdAt.toDate()
  : new Date(inv.createdAt);
        return invDate >= from && invDate <= to;
      });
    }

    if (city) {
        filtered = filtered.filter(inv => {
          const shopCity = shops[inv.shopName] || '';
          return shopCity.toLowerCase().includes(city.toLowerCase());
        });
      }
      

    if (shop) {
      filtered = filtered.filter(inv =>
        inv.shopName?.toLowerCase().includes(shop.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await deleteDoc(doc(db, 'invoices', id));
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      setFilteredInvoices(updated);
    }
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setCity('');
    setShop('');
    setFilteredInvoices(invoices);
  };
  
  const toggleDetails = (id: string) => {
    setExpandedInvoiceId(prev => (prev === id ? null : id));
  };

  return (
    <div className="invoice-container">
      <h2>Invoice</h2>

      <div className="filters">
      <div className="date-range">
        <text>From</text>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <text>To</text>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <input type="text" placeholder="Filter by city" value={city} onChange={e => setCity(e.target.value)} />
        <input type="text" placeholder="Filter by shop name" value={shop} onChange={e => setShop(e.target.value)} />
        <button onClick={filterInvoices} className="addbutton">Filters</button>
        <button onClick={resetFilters} className="addbutton">Reset</button>
      </div>

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Bill No</th>
            <th>Shop</th>
            <th>City</th>
            <th>Seller</th>
            <th>Total</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.map(inv => (
            <React.Fragment key={inv.id}>
              <tr>
                <td>{inv.billNo}</td>
                <td>{inv.shopName}</td>
                <td>{shops[inv.shopName] || 'N/A'}</td>
                <td>{inv.sellerEmpNo}</td>
                <td>{inv.totalAmount}</td>
                <td>{new Date(inv.createdAt.toDate()).toLocaleDateString()}</td>
                <td>
                  
                  <button onClick={() => toggleDetails(inv.id)} className='details-button'>
                    {expandedInvoiceId === inv.id ? 'Hide Details' : 'View Details'}
                  </button>
                  <button onClick={() => handleDelete(inv.id)} className='delete-button'>Delete</button>
                </td>
              </tr>

              {expandedInvoiceId === inv.id && inv.items?.length > 0 && (
                <tr>
                  <td colSpan={7}>
                    <table className="item-detail-table">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.itemName}</td>
                            <td>{item.quantity}</td>
                            <td>{item.price}</td>
                            <td>{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {filteredInvoices.length === 0 && (
            <tr><td colSpan={7}>No invoices found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceAdminPanel;
