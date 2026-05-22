import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AIChat from './components/AIChat';
import Home from './pages/Home';
import Search from './pages/Search';
import HotelDetail from './pages/HotelDetail';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import AdminHotels from './pages/AdminHotels';
import AdminHotelDetail from './pages/AdminHotelDetail';
import Reservations from './pages/Reservations';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/hotel/:id" element={<HotelDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/hotels" element={<AdminHotels />} />
            <Route path="/admin/hotels/:id" element={<AdminHotelDetail />} />
            <Route path="/reservations" element={<Reservations />} />
          </Routes>
          <AIChat />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
