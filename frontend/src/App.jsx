import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GroupDashboard from './pages/GroupDashboard';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/group/:groupName" element={<GroupDashboard />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
