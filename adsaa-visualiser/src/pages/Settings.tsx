import { useState } from 'react';
import { Save, Monitor, Zap } from 'lucide-react';
import './Settings.css';

export function Settings() {
    const [speed, setSpeed] = useState(50);
    const [theme, setTheme] = useState('dark');
    const [autoPlay, setAutoPlay] = useState(false);

    return (
        <div className="settings-page var-transition">
            <div className="settings-header">
                <h2>Preferences</h2>
                <p>Customize your visualization experience</p>
            </div>

            <div className="settings-grid">
                {/* Appearance Settings */}
                <div className="settings-card glass-panel">
                    <div className="card-header">
                        <Monitor size={24} className="icon-primary" />
                        <h3>Appearance</h3>
                    </div>
                    <div className="setting-item">
                        <div className="item-info">
                            <h4>Application Theme</h4>
                            <p>Choose between light and dark mode</p>
                        </div>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="theme-select"
                        >
                            <option value="system">System Default</option>
                            <option value="dark">Dark Mode</option>
                            <option value="light">Light Mode</option>
                        </select>
                    </div>
                </div>

                {/* Animation Settings */}
                <div className="settings-card glass-panel">
                    <div className="card-header">
                        <Zap size={24} className="icon-primary" />
                        <h3>Animation Engine</h3>
                    </div>
                    <div className="setting-item">
                        <div className="item-info">
                            <h4>Default Speed</h4>
                            <p>Set the initial playback speed for all algorithms</p>
                        </div>
                        <div className="speed-control-wrapper">
                            <input
                                type="range"
                                min="1" max="100"
                                value={speed}
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                className="settings-slider"
                            />
                            <span className="speed-value">{speed}%</span>
                        </div>
                    </div>
                    <div className="setting-item">
                        <div className="item-info">
                            <h4>Auto-Play</h4>
                            <p>Automatically start animations when opening an algorithm</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={autoPlay}
                                onChange={(e) => setAutoPlay(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

            </div>

            <div className="settings-footer">
                <button className="save-btn glass-panel">
                    <Save size={20} />
                    Save Preferences
                </button>
            </div>
        </div>
    );
}
