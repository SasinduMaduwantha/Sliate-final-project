import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Register from './Register';  // Path to your Register component

function router() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/Register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default router;