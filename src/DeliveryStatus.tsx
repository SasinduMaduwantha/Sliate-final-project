import { useEffect, useState } from "react";
import {
  getFirestore,collection,getDocs,query,
  where,addDoc,Timestamp,writeBatch,
} from "firebase/firestore";
import "./DeliveryStatus.css";


const db = getFirestore();

interface DeliveryStatus {
  billNo: string;
  shopName: string;
  deliveryStatus: string;
  timestamp: string;
  employeeNo: string;
  rejectionReason?: string;
}

const DeliveryStatus = () => {
  const [deliveryList, setDeliveryList] = useState<DeliveryStatus[]>([]);
  const [filteredList, setFilteredList] = useState<DeliveryStatus[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [inputBillNo, setInputBillNo] = useState("");


  const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");



const fetchDeliveryStatus = async () => {
  try {
    const snapshot = await getDocs(collection(db, "deliverystatus"));
    const list: DeliveryStatus[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const billNo = Number(data.billNo);

      let employeeNo = "N/A";
      const billNom = data.billNo.toString();

      let rejectionReason = "";

      // Get employee number from assignedInvoices
      const invoiceQuery = query(
        collection(db, "assignedInvoices"),
        where("billNo", "==", billNo)
      );
      const invoiceSnapshot = await getDocs(invoiceQuery);
      if (!invoiceSnapshot.empty) {
        const invoiceData = invoiceSnapshot.docs[0].data();
        employeeNo = invoiceData.deliverEmpNo || "N/A";
      }

      // Get rejection reason from history (if Rejected)
      if (data.deliveryStatus === "Rejected") {
        const historyQuery = query(
          collection(db, "history"),
          where("billNo", "==", billNom)
        );
        const historySnapshot = await getDocs(historyQuery);
        if (!historySnapshot.empty) {
          const historyData = historySnapshot.docs[0].data();
          rejectionReason = historyData.rejectionReason || "No reason provided";
        }
      }

      const rawTimestamp = data.timestamp;
      const formattedTimestamp = rawTimestamp?.toDate
        ? new Date(rawTimestamp.toDate()).toLocaleString()
        : new Date(rawTimestamp).toLocaleString();

      list.push({
        billNo: billNo.toString(),
        shopName: data.shopName,
        deliveryStatus: data.deliveryStatus,
        timestamp: formattedTimestamp,
        employeeNo,
        rejectionReason: rejectionReason || "—",
      });
    }

    list.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setDeliveryList(list);
  } catch (error) {
    console.error("Error fetching delivery status:", error);
  }
};



  useEffect(() => {
    fetchDeliveryStatus();
  }, []);

  useEffect(() => {
    if (selectedStatus === "All") {
      setFilteredList(deliveryList);
    } else {
      setFilteredList(deliveryList.filter((item) => item.deliveryStatus === selectedStatus));
    }
  }, [selectedStatus, deliveryList]);

  const handleDateFilter = () => {
    let filtered = [...deliveryList];
  
    if (selectedStatus !== "All") {
      filtered = filtered.filter(item => item.deliveryStatus === selectedStatus);
    }
  
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(item => new Date(item.timestamp) >= from);
    }
  
    if (toDate) {
      const to = new Date(toDate);
      // Add one day to include the full "toDate"
      to.setDate(to.getDate() + 1);
      filtered = filtered.filter(item => new Date(item.timestamp) < to);
    }
  
    setFilteredList(filtered);
  };

  const handleClearDate = () => {
    setFromDate("");
    setToDate("");
  
    // Reapply status filter without date filters
    if (selectedStatus === "All") {
      setFilteredList(deliveryList);
    } else {
      setFilteredList(
        deliveryList.filter((item) => item.deliveryStatus === selectedStatus)
      );
    }
  };
  
  const handleReassign = async () => {
    try {
      const billNo = Number(inputBillNo);
      if (!billNo) return alert("Enter a valid Bill No");
  
      // Check if the bill is in deliverystatus and is Rejected
      const statusQuery = query(
        collection(db, "deliverystatus"),
        where("billNo", "==", billNo.toString())
      );
      const statusSnapshot = await getDocs(statusQuery);
  
      if (statusSnapshot.empty) {
        return alert("Bill not found in delivery status.");
      }
  
      const statusData = statusSnapshot.docs[0].data();
      if (statusData.deliveryStatus !== "Rejected") {
        return alert("Only Rejected bills can be reassigned.");
      }
  
      // Get deliverer from assignedInvoices
      const invoiceQuery = query(
        collection(db, "assignedInvoices"),
        where("billNo", "==", billNo)
      );
      const invoiceSnapshot = await getDocs(invoiceQuery);
  
      if (invoiceSnapshot.empty) {
        return alert("Assigned invoice not found for this bill.");
      }
  
      const invoiceData = invoiceSnapshot.docs[0].data();
  
      // Add to assignedDeliveries
      await addDoc(collection(db, "assignedDeliveries"), {
        assignedAt: Timestamp.now(),
        billNos: [billNo],
        deliverEmpNo: invoiceData.deliverEmpNo,
      });
  
      // Delete from deliverystatus
      const batch = writeBatch(db);
      statusSnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
  
      alert("Bill reassigned successfully!");
      setInputBillNo("");
      fetchDeliveryStatus();
    } catch (error) {
      console.error("Error reassigning bill:", error);
      alert("Reassign failed.");
    }
  };
  
  
  

  const handleAddToStock = async () => {
  try {
    const billNo = Number(inputBillNo);
    if (!billNo) return alert("Enter a valid Bill No");

    // Check if the bill is in deliverystatus and is Rejected
    const statusQuery = query(
      collection(db, "deliverystatus"),
      where("billNo", "==", billNo.toString())
    );
    const statusSnapshot = await getDocs(statusQuery);

    if (statusSnapshot.empty) {
      return alert("Bill not found in delivery status.");
    }

    const statusDoc = statusSnapshot.docs[0];
    const statusData = statusDoc.data();

    if (statusData.deliveryStatus !== "Rejected") {
      return alert("Only Rejected bills can be added to stock.");
    }

    // Get invoice from assignedInvoices
    const invoiceQuery = query(
      collection(db, "assignedInvoices"),
      where("billNo", "==", billNo)
    );
    const invoiceSnapshot = await getDocs(invoiceQuery);

    if (invoiceSnapshot.empty) {
      return alert("Assigned invoice not found for this bill.");
    }

    const invoiceData = invoiceSnapshot.docs[0].data();
    const items = invoiceData.items || [];

    const batch = writeBatch(db);

    // Update inventory
    for (const item of items) {
      const stockQuery = query(
        collection(db, "inventory"),
        where("itemNo", "==", item.itemNo)
      );
      const stockSnapshot = await getDocs(stockQuery);

      if (!stockSnapshot.empty) {
        const stockDoc = stockSnapshot.docs[0];
        const currentQty = Number(stockDoc.data().quantity || 0);
        const updatedQty = currentQty + Number(item.quantity);
        batch.update(stockDoc.ref, { quantity: updatedQty.toString() });
      }
    }

    // Save to 'rejectedbill' collection before deletion
    await addDoc(collection(db, "rejectedbill"), {
      billNo: billNo.toString(),
      reason: "Rejected and restocked",
      timestamp: new Date(),
    });

    // Delete from deliverystatus
    statusSnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    alert("Stock updated !");
    setInputBillNo("");
    fetchDeliveryStatus();
  } catch (error) {
    console.error("Error adding to stock:", error);
    alert("Failed to add to stock.");
  }
};

  
  

  
  return (
    <div className="delivery-status-container">
      <h2>Delivery Status</h2>

      <div className="filter-container">
        <label htmlFor="statusFilter">Filter by Status: </label>
        <select
          id="statusFilter"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="delivery-filter-item"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>

                    <label >From: </label>
              <input className="delivery-filter-item" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

              <label >To: </label>
              <input className="delivery-filter-item" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

              <button className="delivery-filter-item" onClick={handleDateFilter}>Filter</button>
              <button className="delivery-filter-item" onClick={handleClearDate}>Clear</button>
        
                          <input
              className="delivery-filter-text"
              type="text"
              placeholder="Enter Bill No"
              value={inputBillNo}
              onChange={(e) => setInputBillNo(e.target.value)}
            />

              <button className="delivery-filter-assignbut" onClick={handleReassign}>
                Reassign
              </button>

              <button className="delivery-filter-assignbut" onClick={handleAddToStock}>
                Add to Stock
              </button>
      </div>
      

      <div className="table-scroll-container">
      <table className="delivery-status-table">
        <thead>
          <tr>
            <th>Bill No</th>
            <th>Deliver Emp No</th>
            <th>Shop Name</th>
            <th>Status</th>
            <th>Timestamp</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {filteredList.map((item) => (
            <tr key={item.billNo}>
              <td>{item.billNo}</td>
              <td>{item.employeeNo}</td>
              <td>{item.shopName}</td>
              <td>{item.deliveryStatus}</td>
              <td>{item.timestamp}</td>
              <td>{item.rejectionReason || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default DeliveryStatus;
