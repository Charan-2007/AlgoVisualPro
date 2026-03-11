import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Moon, Sun, Layers } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import './Layout.css';

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="layout">
      {/* Top Navigation */}
      <nav className="navbar glass-panel">
        <div className="nav-brand">
          <Layers className="nav-logo" size={28} />
          <h1>AlgoVisual Pro</h1>
        </div>
        
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Home size={20} />
            <span>Home</span>
          </Link>
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
