import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Region from './pages/Region';

function Chrome({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <>
      <header className="top">
        <Link className="brand" to="/"><b>Go</b><span>من الجذور</span></Link>
        {/* شارة الإصدار ادّعاء معرفيّ لا زينة: مخرَجٌ بلا إصدار ادّعاء ناقص */}
        <span className="ver" title="كل مخرَج في هذا المنهج مطبوع من تشغيل حقيقي على هذا الإصدار">
          go1.26.6 · darwin/arm64
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
