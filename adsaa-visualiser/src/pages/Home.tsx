import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Server, GitBranch, Network, Activity } from 'lucide-react';
import './Home.css';

// Mock data structured by category
const ALGORITHMS = [
    { id: 'stack', title: 'Standard Stack Visualization', category: 'Basic', description: 'LIFO data structure visualization.', icon: Layers },
    { id: 'queue', title: 'Standard Queue Visualization', category: 'Basic', description: 'FIFO data structure visualization.', icon: Server },
    { id: 'linked-list', title: 'Standard Linked List Visualization', category: 'Basic', description: 'Sequential collection of nodes.', icon: GitBranch },
    { id: 'bst', title: 'Standard BST Visualization', category: 'Intermediate', description: 'Interactive Binary Search Tree.', icon: Network },
    { id: 'avl', title: 'Standard AVL Tree Visualization', category: 'Advanced', description: 'Self-balancing binary search tree.', icon: Network },
    { id: 'graph', title: 'Standard Graph Visualization', category: 'Advanced', description: 'Interactive graph with BFS, DFS, and Dijkstra.', icon: Activity },
    { id: 'tsp', title: 'Travelling Salesperson Problem', category: 'Advanced', description: 'Determine shortest route visiting all nodes using Brute Force.', icon: Activity },
    { id: 'nqueens', title: 'N-Queens Problem', category: 'Backtracking', description: 'Place N queens diagonally, vertically, and horizontally without conflict.', icon: Activity },
];

function Layers(props: any) {
    return <Server {...props} />; // Placeholder
}


export function Home() {
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const filtered = ALGORITHMS.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
    );

    const categories = ['All', 'Basic', 'Intermediate', 'Advanced', 'Backtracking'];
    const [activeTab, setActiveTab] = useState('All');

    const displayAlgos = activeTab === 'All'
        ? filtered
        : filtered.filter(a => a.category === activeTab);

    return (
        <div className="home-dashboard var-transition">
            <header className="dashboard-header glass-panel">
                <div className="header-content">
                    <h2>Master Algorithms Visually</h2>
                    <p>Interactive animations for data structures and algorithms</p>

                    <div className="search-bar">
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search algorithms (e.g., Dijkstra, Stack)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="category-tabs">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`tab-btn ${activeTab === cat ? 'active' : ''}`}
                        onClick={() => setActiveTab(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="algo-grid">
                {displayAlgos.map(algo => (
                    <div key={algo.id} className="algo-card glass-panel" onClick={() => navigate(`/visualizer/${algo.id}`)}>
                        <div className="card-icon-wrapper">
                            <algo.icon size={24} className="card-icon" />
                        </div>
                        <div className="card-content">
                            <span className="badge">{algo.category}</span>
                            <h3>{algo.title}</h3>
                            <p>{algo.description}</p>
                        </div>
                        <div className="card-footer">
                            <button className="play-btn">
                                <Play size={16} /> Visualize
                            </button>
                        </div>
                    </div>
                ))}
                {displayAlgos.length === 0 && (
                    <div className="no-results glass-panel">
                        <p>No algorithms found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
