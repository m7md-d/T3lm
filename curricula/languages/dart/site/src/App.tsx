import { HashRouter, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { RegionPage } from './pages/RegionPage';
import { TracePage } from './pages/TracePage';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

export function App() {
  return (
    <HashRouter>
      <div className="shell">
        <a className="visually-hidden" href="#main">تخطَّ إلى المتن</a>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/r/:no" element={<RegionPage />} />
          <Route path="/r/:no/:s" element={<RegionPage />} />
          <Route path="/trace" element={<TracePage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
