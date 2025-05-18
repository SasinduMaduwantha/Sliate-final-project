import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import "./ManageTarget.css";

const db = getFirestore();

interface Target {
  id: string;
  employeeNo: string;
  target: number;
  achievement: number;
  month: string;
  systemDate: string;
}

const ManageTarget = () => {
  const [employeeNo, setEmployeeNo] = useState("");
  const [target, setTarget] = useState("");
  const [targetList, setTargetList] = useState<Target[]>([]);
  const [newGlobalTarget, setNewGlobalTarget] = useState("");

  const getCurrentMonth = () =>
    new Date().toLocaleString("default", { month: "long" });
  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const fetchTargets = async () => {
    const querySnapshot = await getDocs(collection(db, "employeeTargets"));
    const list = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Target, "id">),
    }));

    // Sort by most recent systemDate
    list.sort(
      (a, b) =>
        new Date(b.systemDate).getTime() - new Date(a.systemDate).getTime()
    );

    setTargetList(list);
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleSetTarget = async () => {
    if (!employeeNo || !target) {
      alert("Employee No and Target are required!");
      return;
    }

    const q = query(
      collection(db, "users"),
      where("employeeNo", "==", employeeNo)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("Invalid employee Number!");
      return;
    }

    const currentMonth = getCurrentMonth();
    const currentDate = getCurrentDate();

    try {
      const newTarget: Omit<Target, "id"> = {
        employeeNo,
        achievement: 0,
        target: parseInt(target),
        month: currentMonth,
        systemDate: currentDate,
      };
      const docRef = await addDoc(collection(db, "employeeTargets"), newTarget);
      setTargetList([{ id: docRef.id, ...newTarget }, ...targetList]);
      setEmployeeNo("");
      setTarget("");
    } catch (error) {
      console.error("Error setting target:", error);
    }
  };

  const handleUpdateAllTargets = async () => {
    if (!newGlobalTarget) {
      alert("Enter a new target value for all sellers.");
      return;
    }
  
    try {
      const q = query(collection(db, "users"), where("jobType", "==", "Seller"));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        alert("No sellers found!");
        return;
      }
  
      const currentMonth = getCurrentMonth();
      const currentDate = getCurrentDate();
  
      const addPromises = querySnapshot.docs.map(async (userDoc) => {
        const employeeNo = userDoc.data().employeeNo;
  
        const newTarget: Omit<Target, "id"> = {
          employeeNo,
          achievement: 0,
          target: parseInt(newGlobalTarget),
          month: currentMonth,
          systemDate: currentDate,
        };
  
        return addDoc(collection(db, "employeeTargets"), newTarget);
      });
  
      await Promise.all(addPromises);
  
      alert(`Target set to ${newGlobalTarget} for all sellers.`);
      fetchTargets(); // Refresh list
      setNewGlobalTarget("");
    } catch (error) {
      console.error("Error updating targets for all sellers:", error);
    }
  };
  
  const handleDeleteTarget = async (id: string) => {
    try {
      if (!window.confirm('Are you sure you want to delete this Target record?')) return;
      await deleteDoc(doc(db, "employeeTargets", id));
      setTargetList(targetList.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting target:", error);
    }
  };

  const handleDeleteAllTargets = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete ALL targets?"
    );
    if (!confirmDelete) return;

    try {
      const snapshot = await getDocs(collection(db, "employeeTargets"));
      const deletePromises = snapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "employeeTargets", docSnap.id))
      );
      await Promise.all(deletePromises);
      setTargetList([]);
      alert("All targets deleted successfully.");
    } catch (error) {
      console.error("Error deleting all targets:", error);
    }
  };

  // Helper function to calculate overflow
  const calculateOverflow = (achievement: number, target: number) => {
    const overflow = achievement - target;
    return overflow > 0 ? overflow : 0;
  };

  return (
    <div className="target-manage-container">
      <h2>Manage Employee Targets</h2>

      <div className="target-content-wrapper">
        <div className="target-form-wrapper">
          <div className="target-form-section">
            <input
              type="text"
              placeholder="Employee No"
              value={employeeNo}
              onChange={(e) => setEmployeeNo(e.target.value)}
              className="target-input"
            />
            <input
              type="number"
              placeholder="Target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="target-input"
            />
            <button className="target-button" onClick={handleSetTarget}>
              Set Target
            </button>
          </div>

          <div className="target-form-section">
            <input
              type="number"
              placeholder="Set Target for All Sellers"
              value={newGlobalTarget}
              onChange={(e) => setNewGlobalTarget(e.target.value)}
              className="target-input"
            />
            <button className="target-button" onClick={handleUpdateAllTargets}>
              Update All Targets
            </button>
          </div>

          <div className="target-form-section">
            <button
              className="target-button delete-all-btn"
              onClick={handleDeleteAllTargets}
            >
              Delete All Targets
            </button>
          </div>
        </div>

        <div className="target-table-wrapper">
          <table className="target-table">
            <thead>
              <tr>
                <th>Employee No</th>
                <th>Target</th>
                <th>Achievement</th>
                <th>Best Selling</th> {/* ✅ new column */}
                <th>System Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {targetList.map((item) => (
                <tr key={item.id}>
                  <td>{item.employeeNo}</td>
                  <td>{item.target}</td>
                  <td>{item.achievement}</td>
                  <td style={{ color: calculateOverflow(item.achievement, item.target) > 0 ? "green" : "black" }}>
                    {calculateOverflow(item.achievement, item.target)}
                  </td>
                  <td>{item.systemDate}</td>
                  <td>
                    <button
                      className="target-delete-btn"
                      onClick={() => handleDeleteTarget(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageTarget;
