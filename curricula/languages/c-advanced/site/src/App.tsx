import { HashRouter, Route, Routes } from 'react-router-dom';
import { ChapterPage } from './pages/Chapter';
import { Home } from './pages/Home';
import { LabPage } from './pages/Lab';
import { SourcesPage } from './pages/Sources';
import { TrailPage } from './pages/Trail';
import '@t3lm/kit/styles/reset.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

export function App() {
  return (
    <HashRouter>
      <div className="shell">
        <a className="skip" href="#main">تخطَّ إلى المتن</a>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/f/:num" element={<ChapterPage />} />
          <Route path="/f/:num/:shot" element={<ChapterPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/trail" element={<TrailPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
