import { Route, Routes } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { Home } from './pages/Home';
import { Chapter } from './pages/Chapter';
import { Trail } from './pages/Trail';
import { Sources } from './pages/Sources';
import { Appendix } from './pages/Appendix';

export default function App() {
  return (
    <>
      <TopBar />
      <main className="shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ch/:num" element={<Chapter />} />
          <Route path="/trail" element={<Trail />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/appendix" element={<Appendix />} />
          <Route path="/appendix/:slug" element={<Appendix />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}
