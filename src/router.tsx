import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App"; 
import Register from "./Register";  
import Dashboard from "./Dashboard";
import Inventory from "./inventory";
import Setpassword from "./setpassword";
import ManageTarget from "./ManageTarget";
import InvoiceAdminPanel from "./invoices";
import AssignDelivery from "./AssignDelivery";
import DeliveryStatus from "./DeliveryStatus";
import ManageEmp from "./ManageEmp";
import Reports from "./reports";




const RouterComponent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} /> {/* ✅ Set Login as default page */}
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/setpassword" element={<Setpassword />} />
        <Route path="/ManageTarget" element={<ManageTarget />} />
        <Route path="/invoice" element={<InvoiceAdminPanel />} />
        <Route path="/assigndelivery" element={<AssignDelivery/>} />
        <Route path="/deliverystatus" element={<DeliveryStatus />} />
        <Route path="/manageemp" element={<ManageEmp />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
};

export default RouterComponent;
