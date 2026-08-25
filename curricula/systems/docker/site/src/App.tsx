import { HashRouter, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { PackagePage } from './pages/PackagePage';
import { RegionPage } from './pages/RegionPage';
import { TracePage } from './pages/TracePage';
import { KitPage } from './pages/KitPage';
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
          <Route path="/p/:id" element={<PackagePage />} />
          <Route path="/r/:no" element={<RegionPage />} />
          <Route path="/trace" element={<TracePage />} />
          {/* أداة بناء: معرض المكوّنات — خارج الملاحة وخريطة الموقع */}
          <Route path="/kit" element={<KitPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
