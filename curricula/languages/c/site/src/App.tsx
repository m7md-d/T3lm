import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Region from './pages/Region';
import { TOOLCHAIN } from './lib/content';

function Chrome({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <>
      <header className="top">
        <Link className="brand" to="/">
          <b className="en">C</b><span>اللغة الأولى</span>
        </Link>
        {/* الأداة قرارٌ لغويّ لا تفصيلٌ إداريّ: حجمُ النوع وإشارةُ `char`
            وما يُقبَل ويُرفَض كلُّها تتبعها */}
        <span className="ver en" title="كل مخرَجٍ وتحذيرٍ ورفضٍ في هذا المنهج منقولٌ من تشغيلٍ حقيقيّ على هذه الأداة">
          {TOOLCHAIN}
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
  return <HashRouter><Shell /></HashRouter>;
}
