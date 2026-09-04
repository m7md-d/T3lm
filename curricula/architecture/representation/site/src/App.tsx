import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { RegionPage } from './pages/RegionPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/r/:no" element={<RegionPage />} />
      <Route path="/r/:no/:s" element={<RegionPage />} />
    </Routes>
  );
}
