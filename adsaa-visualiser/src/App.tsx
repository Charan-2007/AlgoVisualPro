import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Visualizer } from './pages/Visualizer';
import { Settings } from './pages/Settings';





function App() {
    return (
        <HashRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/visualizer/:algorithmId" element={<Visualizer />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Layout>
        </HashRouter>
    );
}

export default App;
