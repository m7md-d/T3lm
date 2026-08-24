import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Region from './pages/Region';

function Chrome({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <>
      <header className="top">
        <Link className="brand" to="/"><b className="en">Rust</b><span>ما يثبته المترجم</span></Link>
        {/* الإصدارة قرارٌ لغويّ لا تفصيلٌ إداريّ: نفس المترجم يقبل ويرفض بحسبها */}
        <span className="ver" title="كل مخرَجٍ ورفضٍ في هذا المنهج منقولٌ من تشغيلٍ حقيقيّ على هذا الإصدار">
          rustc 1.98.0
        </span>
      </header>
      <div key={pathname} className="reveal">{children}</div>
    </>
  );
}

/** الصفحات بلا موجِّه — ليُصيَّرها فحص الدخان خارج المتصفّح (`npm run smoke`). */
export function Shell() {
  return (
    <Chrome>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:num" element={<Region />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Chrome>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
