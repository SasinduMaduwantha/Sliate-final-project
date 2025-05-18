
import { FaBox, FaTruck, FaUsers, FaFileInvoice, FaBullseye, FaMapMarkerAlt, FaChartBar } from "react-icons/fa";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const dashboardItems = [
    { icon: <FaBox size={40} />, title: "Manage Inventory", description: "Add, Update, Delete", route: "/inventory" },
    { icon: <FaTruck size={40} />, title: "Schedule Delivery", description: "Plan and assign delivery schedules.", route: "/assigndelivery" },
    { icon: <FaUsers size={40} />, title: "Manage Employees", description: "Handle employee account." , route: "/manageemp"},
    { icon: <FaFileInvoice size={40} />, title: "Manage Invoices", description: "Process invoices efficiently.", route: "/invoice" },
    { icon: <FaBullseye size={40} />, title: "Manage Seller Targets", description: "Set and monitor seller performance targets.", route: "/ManageTarget" },
    { icon: <FaMapMarkerAlt size={40} />, title: "View Delivery Status", description: "Track live delivery status updates.", route: "/deliverystatus"},
    { icon: <FaChartBar size={40} />, title: "Generate Reports", description: "Generate invoice information reports.", route: "/reports" },
  ];

  return (
    <div className="dashboard-container">
      {/* Top navigation bar */}
      <div className="navbar">
        <h2>Admin Panel</h2>
        <div className="profile-container">
          <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Profile" className="profile-image" />
        </div>
      </div>

      {/* Dashboard grid */}
      <div className="dashboard-grid">
        {dashboardItems.map((item, index) => (
          <div key={index} className="dashboard-card" onClick={() => item.route && navigate(item.route)}>
            <div className="card-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
