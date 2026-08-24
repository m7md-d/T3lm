import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Region from './pages/Region.jsx';
import Threads from './pages/Threads.jsx';
import Matrix from './pages/Matrix.jsx';
import Labs from './pages/Labs.jsx';
import Doc from './pages/Doc.jsx';
import Palette from './components/Palette.jsx';

const NAV = [
  { to: '/', t: 'الآلة' },
  { to: '/threads', t: 'الأنماط' },
  { to: '/matrix', t: 'الجدول' },
  { to: '/labs', t: 'المختبرات' },
  { to: '/doc/cheatsheet', t: 'المرجع' },
];

export default function App() {
  const [pal, setPal] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPal((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          مَن <span>يَنتظر؟</span>
        </Link>
        <nav>
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={pathname === n.to ? 'on' : ''}>
              {n.t}
            </Link>
          ))}
        </nav>
        <button type="button" className="kbtn" onClick={() => setPal(true)} title="بحث">
          <span className="en">⌘K</span>
        </button>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/r/:slug" element={<Region />} />
          <Route path="/threads" element={<Threads />} />
          <Route path="/matrix" element={<Matrix />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/doc/:name" element={<Doc />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <footer className="foot">
        أربعة برامج، أربع إجابات، آلةٌ واحدة. · التقدّم محفوظٌ في متصفّحك وحده — لا حساب ولا خادم.
      </footer>

      <Palette open={pal} onClose={() => setPal(false)} />
    </div>
  );
}
