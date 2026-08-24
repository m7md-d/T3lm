import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Region from './pages/Region';

function Chrome({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <>
      <header className="top">
        <Link className="brand" to="/">
          <b>هيكلة المشروع</b>
          <span>أين يسكن كل شيء</span>
        </Link>
        {/* الموتيف: خطُّ الحدّ — وهو الشيء الوحيد الذي يرسمه المنهج كلّه */}
        <span className="rule" aria-hidden="true" />
      </header>
      <div key={pathname}>{children}</div>
    </>
  );
}

/** الصفحات بلا موجِّه — ليُصيَّرها فحص الدخان خارج المتصفّح. */
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
