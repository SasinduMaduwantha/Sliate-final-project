import { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import "./Inventory.css"; // Import CSS file

const db = getFirestore();

const Inventory = () => {
  const [items, setItems] = useState<any[]>([]);
  const [itemNo, setItemNo] = useState("");
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch items from Firestore
  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "inventory"));
      const itemList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemList.reverse()); // Show the latest items first
    };
    fetchItems();
  }, []);

  // Handle item addition
  const handleAdd = async () => {
    if (!itemNo || !itemName || !price || !quantity) {
      alert("All fields are required!");
      return;
    }

    // Check if itemNo already exists
    const q = query(collection(db, "inventory"), where("itemNo", "==", itemNo));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      alert("This item already exists!");
      return;
    }

    try {
      const newItem = { itemNo, itemName, price, quantity };
      const docRef = await addDoc(collection(db, "inventory"), newItem);
      setItems([{ id: docRef.id, ...newItem }, ...items]);
      handleClear();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  // Handle item update
  const handleUpdate = async () => {
    const itemToUpdate = items.find(item => item.itemNo === itemNo);
    if (!itemToUpdate) {
      alert("Item not found!");
      return;
    }

    try {
      const itemRef = doc(db, "inventory", itemToUpdate.id);
      await updateDoc(itemRef, { itemName, price, quantity });
      setItems(items.map(item => (item.id === itemToUpdate.id ? { ...item, itemName, price, quantity } : item)));
      handleClear();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  // Handle item deletion
  const handleDelete = async () => {
    const itemToDelete = items.find(item => item.itemNo === itemNo);
    if (!itemToDelete) {
      alert("Item not found!");
      return;
    }

    try {
      const itemRef = doc(db, "inventory", itemToDelete.id);
      await deleteDoc(itemRef);
      setItems(items.filter(item => item.id !== itemToDelete.id));
      handleClear();
      window.location.reload(); 
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };
  interface InventoryItem {
    id: string;
    itemNo: string;
    itemName: string;
    price: string;
    quantity: string;
  }
  // Handle search
  const handleSearch = async () => {
    const q = query(collection(db, "inventory"), where("itemNo", "==", searchQuery));
    const querySnapshot = await getDocs(q);
  
    const filteredItems: InventoryItem[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<InventoryItem, "id">), // Ensure type correctness
    }));
  
    setItems(filteredItems);
  
    // Populate form with the first found item
    if (filteredItems.length > 0) {
      const foundItem = filteredItems[0];
      setItemNo(foundItem.itemNo);
      setItemName(foundItem.itemName);
      setPrice(foundItem.price);
      setQuantity(foundItem.quantity);
    } else {
      alert("No item found!");
      handleClear();
    }
  };
  

  // Handle form clear
  const handleClear = () => {
    setItemNo("");
    setItemName("");
    setPrice("");
    setQuantity("");
    setSearchQuery("");
    
  };

  return (
    <div className="bg">
        <h2 className="heading">Inventory Management</h2>
    <div className="container">
        
      {/* Left Side: Form */}
      <div className="form-container">
        <h2>Item</h2>
        <div className="search-row">
          <input type="text" placeholder=" Search Item No" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <button onClick={handleSearch}>Search</button>
        </div>
        <input type="text" placeholder=" Item No" value={itemNo} onChange={e => setItemNo(e.target.value)} />
        <input type="text" placeholder=" Item Name" value={itemName} onChange={e => setItemName(e.target.value)} />
        <input type="text" placeholder=" Price" value={price} onChange={e => setPrice(e.target.value)} />
        <input type="text" placeholder=" Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />
        <div className="button-row">
          <button onClick={handleAdd}>Add</button>
          <button onClick={handleUpdate}>Update</button>
          <button onClick={handleDelete}>Delete</button>
          <button onClick={handleClear}>Clear</button>
        </div>
      </div>

      {/* Right Side: Table */}
      <div className="table-container">
        <h2>Inventory</h2>
        <table>
          <thead>
            <tr>
              <th>Item No</th>
              <th>Name</th>
              <th>Price</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.itemNo}</td>
                <td>{item.itemName}</td>
                <td>{item.price}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default Inventory;
