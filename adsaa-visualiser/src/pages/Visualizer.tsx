import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Settings2, Plus, Minus, Search } from 'lucide-react';
import { executeStack, EngineState, Operation } from '../algorithms/stack';
import { executeQueue } from '../algorithms/queue';
import { executeLinkedList } from '../algorithms/linkedList';
import { executeBST } from '../algorithms/bst';
import { executeAVL } from '../algorithms/avl';
import { executeGraph, GraphEngineState } from '../algorithms/graph';
import { executeTSP, TSPConfig } from '../algorithms/tsp';
import { generateNQueens, NQueensState } from '../algorithms/nQueens';
import { Chatbot } from './Chatbot';
import './Visualizer.css';
import './VisualizerAnimations.css';
import './GraphAnimations.css';

type EngineStateUnion = EngineState | GraphEngineState | NQueensState | { nodes: any[], description: string, stepDetails?: any };

export function calculateEdgePoints(sourceX: number, sourceY: number, targetX: number, targetY: number, radius: number = 25) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= radius * 2) return { x1: sourceX, y1: sourceY, x2: targetX, y2: targetY };
    const ratio = radius / distance;
    return {
        x1: sourceX + dx * ratio,
        y1: sourceY + dy * ratio,
        x2: targetX - dx * ratio,
        y2: targetY - dy * ratio
    };
}

export function Visualizer() {
    const { algorithmId } = useParams();

    // Engine State
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(50); // 1-100
    const [currentStep, setCurrentStep] = useState(0);
    const [states, setStates] = useState<EngineStateUnion[]>([]);

    // Interactive State
    const [operations, setOperations] = useState<Operation[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [targetValue, setTargetValue] = useState(''); // For graph edges
    const [weightValue, setWeightValue] = useState(''); // For graph edges

    // Pan state for Focus Assistance
    const [viewBox, setViewBox] = useState('0 0 800 600');

    const [tspConfig, setTspConfig] = useState<TSPConfig>({
        numCities: 5, directed: false, startCity: 0, edges: [], algorithmType: 'brute-force'
    });
    const [tspInputMode, setTspInputMode] = useState<'manual' | 'matrix'>('manual');
    const [tspMatrix, setTspMatrix] = useState('0 10 15 20\n10 0 35 25\n15 35 0 30\n20 25 30 0');

    // N-Queens State
    const [numQueens, setNumQueens] = useState<number>(4);
    const [galleryMode, setGalleryMode] = useState(false);
    const [gallerySolutionIndex, setGallerySolutionIndex] = useState(0);

    const [explanationLevel, setExplanationLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

    const timerRef = useRef<number | null>(null);
    const prevStatesLength = useRef<number>(0);

    // Initial wipe on route change
    useEffect(() => {
        setOperations([]);
        setCurrentStep(0);
        setIsPlaying(false);
    }, [algorithmId]);

    // Recalculate states when operations are added
    useEffect(() => {
        let newStates: EngineState[] = [];
        if (algorithmId === 'stack') {
            newStates = executeStack(operations.length ? operations : [
                { type: 'push', value: 10 }, { type: 'push', value: 20 }, { type: 'push', value: 30 }, { type: 'pop', value: 0 }
            ]);
        } else if (algorithmId === 'queue') {
            newStates = executeQueue(operations.length ? operations : [
                { type: 'enqueue', value: 10 }, { type: 'enqueue', value: 20 }, { type: 'dequeue', value: 0 }
            ]);
        } else if (algorithmId === 'linked-list') {
            newStates = executeLinkedList(operations.length ? operations : [
                { type: 'insert', value: 10 }, { type: 'insert', value: 20 }, { type: 'insert', value: 30 }
            ]);
        } else if (algorithmId === 'bst') {
            newStates = executeBST(operations.length ? operations : [
                { type: 'insert', value: 50 }, { type: 'insert', value: 25 }, { type: 'insert', value: 75 }
            ]);
        } else if (algorithmId === 'avl') {
            newStates = executeAVL(operations.length ? operations : [
                { type: 'insert', value: 10 }, { type: 'insert', value: 20 }, { type: 'insert', value: 30 }
            ]);
        } else if (algorithmId === 'graph') {
            newStates = executeGraph(operations.length ? operations : [
                { type: 'insert_node', value: 0 }, { type: 'insert_node', value: 1 }, { type: 'insert_node', value: 2 },
                { type: 'insert_edge', value: 0, target: 1, weight: 5 }
            ]);
        } else if (algorithmId === 'tsp') {
            newStates = executeTSP(tspConfig);
        } else if (algorithmId === 'nqueens') {
            const sizeOp = operations.find(o => o.type === 'generate_nqueens');
            const size = sizeOp?.value || 8;
            newStates = generateNQueens(size) as any;
        } else {
            newStates = [{ nodes: [], description: `Visualization for ${algorithmId} coming soon.` }];
        }

        setStates(newStates);

        // Auto-play new states when added
        if (newStates.length > prevStatesLength.current && operations.length > 0) {
            // New states generated, jump to where the previous states ended and play
            if (algorithmId === 'nqueens') {
                setCurrentStep(0);
            } else {
                setCurrentStep(Math.max(0, prevStatesLength.current - 1));
            }
            setIsPlaying(true);
        }

        prevStatesLength.current = newStates.length;
    }, [algorithmId, operations]);

    const totalSteps = Math.max(0, states.length - 1);
    const currentState = states[currentStep] || { nodes: [], description: '' };

    // Focus Assistance (Pan SVG to active edge)
    useEffect(() => {
        if (!['graph', 'tsp', 'bst', 'avl'].includes(algorithmId || '')) return;

        // Default viewBox
        let targetViewBox = '0 0 800 600';

        if (currentState) {
            let activeNodes: any[] = [];
            // For Tree edges, we don't have an explicit edges array usually, so we fall back to finding active nodes
            if (['bst', 'avl'].includes(algorithmId || '')) {
                activeNodes = ((currentState as any).nodes || []).filter((n: any) => n.state === 'active');
            } else if (['graph', 'tsp'].includes(algorithmId || '')) {
                const activeEdge = (currentState as GraphEngineState).edges?.find(e => e.state === 'active');
                if (activeEdge) {
                    activeNodes = ((currentState as any).nodes || []).filter((n: any) => n.id === activeEdge.source || n.id === activeEdge.target);
                }
            }

            if (activeNodes.length > 0) {
                // Determine bounding box of active nodes
                const minX = Math.min(...activeNodes.map(n => n.x));
                const maxX = Math.max(...activeNodes.map(n => n.x));
                const minY = Math.min(...activeNodes.map(n => n.y));
                const maxY = Math.max(...activeNodes.map(n => n.y));

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                // Pan 20% towards the active center while keeping the same zoom scale 
                // This soft-scrolls the SVG without moving the whole page.
                // Original center is 400, 300
                const panX = (centerX - 400) * 0.4;
                const panY = (centerY - 300) * 0.4;

                targetViewBox = `${panX} ${panY} 800 600`;
            }
        }
        setViewBox(targetViewBox);
    }, [currentState, algorithmId]);

    // Playback Logic
    const togglePlay = () => {
        if (currentStep >= totalSteps) setCurrentStep(0);
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        if (isPlaying) {
            // Map speed 1-100 to 3000ms - 100ms
            const ms = 3000 - ((speed - 1) * 29.29);
            timerRef.current = window.setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= totalSteps) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, ms);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, speed, totalSteps]);

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0));
    const handleResetPlayback = () => {
        setCurrentStep(0);
        setIsPlaying(false);
    };

    const handleClearData = () => {
        setOperations([]);
    };

    const handleAction = (type: string, value?: any) => {
        const val = parseInt(inputValue);

        if (type === 'insert_edge') {
            const target = parseInt(targetValue);
            if (isNaN(target)) {
                alert("Please enter a valid target node value.");
                return;
            }
            const weight = parseInt(weightValue) || 1;
            setOperations(prev => [...prev, { type, value: val, target, weight }]);
        } else if (type === 'generate_nqueens') {
            // Special handler for N-Queens size limit
            let numSize = value !== undefined ? parseInt(value) : numQueens;
            if (isNaN(numSize) || numSize < 4) {
                alert("N must be an integer >= 4");
                return;
            }
            if (numSize > 12) {
                alert("N-Queens visualization is limited to 4 ≤ N ≤ 12 for performance reasons.");
                return;
            }
            setCurrentStep(0);
            setGalleryMode(false);
            setGallerySolutionIndex(0);
            setIsPlaying(false);
            setOperations([{ type: 'generate_nqueens', value: numSize }]);
            return;
        } else {
            if (type !== 'pop' && type !== 'dequeue' && isNaN(val)) {
                alert("Please enter a valid numeric value.");
                return;
            }
            setOperations(prev => [...prev, { type, value: val }]);
        }
        setInputValue('');
        setTargetValue('');
        setWeightValue('');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

            if (!apiKey) {
                alert("API Key missing. Please set VITE_OPENAI_API_KEY to use Vision API.");
                setIsUploading(false);
                return;
            }

            try {
                // OpenAI Vision Hook
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4-vision-preview",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: `Identify the data structure shown in this image. It is likely a ${algorithmId}. If it is a tree or list, extract the numeric nodes from top-to-bottom or left-to-right as a comma-separated list of values. If it is a graph, identify the connections as "nodeA-nodeB". Return ONLY JSON in this exact format: {"nodes": [10, 20, 30], "edges": [{"u": 0, "v": 1}], "detected_type": "string"}` },
                                    { type: "image_url", image_url: { url: `data:${file.type};base64,${base64Data}` } }
                                ]
                            }
                        ],
                        max_tokens: 300
                    })
                });

                if (!response.ok) throw new Error("Vision generation failed");
                const data = await response.json();
                const content = data.choices[0].message.content;

                // Parse AI block response assuming clean JSON
                const jsonStr = content.replace(/```json|```/g, '').trim();
                const struct = JSON.parse(jsonStr);

                if (window.confirm(`AI Detected Structure: ${struct.detected_type}\nExtracted Nodes: ${struct.nodes.join(', ')}\nProceed to visualize this data?`)) {
                    // Automatically inject
                    if (['bst', 'avl', 'linked-list', 'stack', 'queue'].includes(algorithmId || '')) {
                        const mappedOps = struct.nodes.map((n: number) => ({ type: algorithmId === 'stack' ? 'push' : (algorithmId === 'queue' ? 'enqueue' : 'insert'), value: n }));
                        setOperations(mappedOps);
                    } else if (algorithmId === 'graph' || algorithmId === 'tsp') {
                        let opChain: Operation[] = struct.nodes.map((n: number) => ({ type: 'insert_node', value: n }));
                        struct.edges?.forEach((e: any) => opChain.push({ type: 'insert_edge', value: e.u, target: e.v, weight: e.weight || 10 }));
                        setOperations(opChain);
                        if (algorithmId === 'tsp') {
                            setTspConfig(prev => ({ ...prev, numCities: struct.nodes.length, edges: struct.edges || [] }));
                        }
                    }
                }
            } catch (err) {
                alert("Failed to parse image mathematically. Ensure it's a clear structural diagram.");
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="visualizer-page var-transition">
            <div className="visualizer-header">
                <h2>{algorithmId ? algorithmId.replace('-', ' ').toUpperCase() : 'Algorithm'}</h2>
                <div className="speed-control glass-panel">
                    <Settings2 size={16} />
                    <span>Speed</span>
                    <input
                        type="range"
                        min="1" max="100"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="speed-slider"
                    />
                </div>
            </div>

            <div className="visualizer-layout">
                {/* Main Canvas Area */}
                <div className="canvas-container glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* Interactive Operations Panel */}
                    <div className="operations-panel" style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>

                        {/* Standard Value Input */}
                        {!['graph', 'tsp', 'nqueens'].includes(algorithmId || '') && (
                            <input
                                type="number"
                                placeholder="Value"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px 12px', borderRadius: '6px', width: '100px' }}
                            />
                        )}

                        {/* Stack / Queue Controls */}
                        {algorithmId === 'stack' && (
                            <>
                                <button className="action-btn" onClick={() => handleAction('push')}><Plus size={16} /> Push</button>
                                <button className="action-btn" onClick={() => handleAction('pop')}><Minus size={16} /> Pop</button>
                            </>
                        )}
                        {algorithmId === 'queue' && (
                            <>
                                <button className="action-btn" onClick={() => handleAction('enqueue')}><Plus size={16} /> Enqueue</button>
                                <button className="action-btn" onClick={() => handleAction('dequeue')}><Minus size={16} /> Dequeue</button>
                            </>
                        )}

                        {/* Standard Tree / List Controls */}
                        {['linked-list', 'bst', 'avl'].includes(algorithmId || '') && (
                            <>
                                <button className="action-btn" onClick={() => handleAction('insert')}><Plus size={16} /> Insert</button>
                                <button className="action-btn" onClick={() => handleAction('delete')}><Minus size={16} /> Delete</button>
                                <button className="action-btn" onClick={() => handleAction('find')}><Search size={16} /> Find</button>
                            </>
                        )}

                        {/* Graph Controls */}
                        {algorithmId === 'graph' && (
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input type="number" placeholder="Node" value={inputValue} onChange={e => setInputValue(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px', width: '80px' }} />
                                <button className="action-btn" onClick={() => handleAction('insert_node')}><Plus size={16} /> Add Node</button>

                                <div style={{ borderLeft: '1px solid #444', height: '30px', margin: '0 5px' }}></div>

                                <input type="number" placeholder="Target" value={targetValue} onChange={e => setTargetValue(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px', width: '80px' }} />
                                <input type="number" placeholder="Weight" value={weightValue} onChange={e => setWeightValue(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px', width: '80px' }} />
                                <button className="action-btn" onClick={() => handleAction('insert_edge')}><Plus size={16} /> Add Edge</button>

                                <div style={{ borderLeft: '1px solid #444', height: '30px', margin: '0 5px' }}></div>

                                <button className="action-btn" onClick={() => handleAction('bfs')}>BFS</button>
                                <button className="action-btn" onClick={() => handleAction('dfs')}>DFS</button>
                                <button className="action-btn" onClick={() => handleAction('dijkstra')}>Dijkstra</button>
                            </div>
                        )}

                        {/* Image Upload Button */}
                        <div style={{ paddingLeft: '10px', marginLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                            <input type="file" ref={fileInputRef} accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleImageUpload} />
                            <button className="action-btn" style={{ background: 'linear-gradient(135deg, #8be9fd 0%, #00bcd4 100%)', color: '#1a1b24', fontWeight: 600 }} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? 'Evaluating AI...' : '📷 Upload Diagram'}
                            </button>
                        </div>

                        {/* TSP Controls */}
                        {algorithmId === 'tsp' && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                                    <select value={tspConfig.algorithmType} onChange={e => setTspConfig({ ...tspConfig, algorithmType: e.target.value as any })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px' }}>
                                        <option value="brute-force">Brute Force</option>
                                        <option value="nearest-neighbor">Nearest Neighbor</option>
                                        <option value="dynamic-programming">Optimal DP (Held-Karp)</option>
                                    </select>

                                    <select value={tspConfig.directed ? 'true' : 'false'} onChange={e => setTspConfig({ ...tspConfig, directed: e.target.value === 'true' })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px' }}>
                                        <option value="false">Undirected</option>
                                        <option value="true">Directed</option>
                                    </select>

                                    <select value={tspInputMode} onChange={e => setTspInputMode(e.target.value as any)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px' }}>
                                        <option value="manual">Manual Edges</option>
                                        <option value="matrix">Adjacency Matrix</option>
                                    </select>

                                    <div style={{ borderLeft: '1px solid #444', height: '30px', margin: '0 5px' }}></div>

                                    <button className="action-btn" onClick={() => {
                                        if (tspInputMode === 'matrix') {
                                            const rows = tspMatrix.trim().split('\n').filter(r => r.trim() !== '').map(r => r.trim().split(/\s+/).map(Number));
                                            if (rows.length < 3 || rows.length > 10) { alert('Matrix must be 3x3 to 10x10 limit'); return; }
                                            const edges = [];
                                            for (let i = 0; i < rows.length; i++) {
                                                if (rows[i].length !== rows.length || rows[i].some(isNaN)) { alert('Matrix must be purely numbers and perfectly square'); return; }
                                                for (let j = 0; j < rows[i].length; j++) {
                                                    if (i !== j && rows[i][j] > 0) {
                                                        edges.push({ u: i, v: j, weight: rows[i][j] });
                                                    }
                                                }
                                            }
                                            setTspConfig({ ...tspConfig, numCities: rows.length, edges });
                                            setOperations([...operations, { type: 'update_tsp' }]);
                                        } else {
                                            setOperations([...operations, { type: 'update_tsp' }]);
                                        }
                                    }}>Generate Graph</button>

                                    <button className="action-btn" onClick={() => {
                                        const n = Math.floor(Math.random() * 6) + 3; // 3 to 8
                                        const edges = [];
                                        const isDir = Math.random() > 0.5;
                                        for (let i = 0; i < n; i++) {
                                            for (let j = 0; j < n; j++) {
                                                if (i !== j && Math.random() > 0.4) {
                                                    if (!isDir && i > j) continue;
                                                    edges.push({ u: i, v: j, weight: Math.floor(Math.random() * 40) + 5 });
                                                }
                                            }
                                        }
                                        setTspConfig({ ...tspConfig, numCities: n, directed: isDir, edges });
                                        setOperations([...operations, { type: 'random_tsp' }]);
                                    }}>🎲 Random Map</button>
                                </div>

                                {tspInputMode === 'manual' ? (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                                        <input type="number" placeholder="Cities (3-10)" value={tspConfig.numCities} onChange={e => setTspConfig({ ...tspConfig, numCities: Math.max(3, Math.min(10, Number(e.target.value))) })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px', width: '100px' }} />
                                        <input type="text" placeholder="Edges (e.g. 0 1 10, 1 2 5)" onChange={e => {
                                            const parts = e.target.value.split(',').map(s => s.trim().split(' '));
                                            const edges = parts.filter(p => p.length === 3 && p[0] !== '' && p[1] !== '' && p[2] !== '').map(p => ({ u: Number(p[0]), v: Number(p[1]), weight: Number(p[2]) }));
                                            setTspConfig({ ...tspConfig, edges });
                                        }} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px', width: '260px' }} title="Format: source target weight, separated by comma" />
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '5px', width: '100%' }}>
                                        <textarea
                                            value={tspMatrix}
                                            onChange={e => setTspMatrix(e.target.value)}
                                            placeholder="0 10 15 20&#10;10 0 35 25&#10;15 35 0 30&#10;20 25 30 0"
                                            rows={5}
                                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace', resize: 'vertical' }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* N-Queens Controls */}
                        {algorithmId === 'nqueens' && (
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <span>Board Size (N):</span>
                                <input
                                    type="number"
                                    min="4" max="12"
                                    value={numQueens}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === '') {
                                            setNumQueens('' as any); // allow empty temporarily
                                        } else {
                                            setNumQueens(parseInt(val));
                                        }
                                    }}
                                    onBlur={() => {
                                        if (!numQueens || numQueens < 4) setNumQueens(4);
                                        else if (numQueens > 12) setNumQueens(12);
                                    }}
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: 'white', padding: '6px 10px', borderRadius: '6px', width: '70px', fontSize: '1.1rem' }}
                                />
                                <button className="action-btn" onClick={() => handleAction('generate_nqueens', numQueens)}>
                                    <Play size={16} /> Start Visualization
                                </button>
                                {(currentState as NQueensState)?.allSolutions?.length > 0 && currentStep === totalSteps && (
                                    <button className="action-btn" style={{ background: 'var(--node-active)' }} onClick={() => setGalleryMode(!galleryMode)}>
                                        {galleryMode ? 'Back to Visualization' : 'View Solution Gallery'}
                                    </button>
                                )}
                            </div>
                        )}

                        <div style={{ flexGrow: 1 }}></div>
                        <button className="icon-btn" style={{ background: 'rgba(255, 85, 85, 0.1)', color: '#ff5555' }} onClick={handleClearData}>
                            Clear Data
                        </button>
                    </div>

                    {/* Rendering Engine Container */}
                    <div style={{ position: 'relative', flexGrow: 1, width: '100%', minHeight: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                        {/* Step Indicator Overlay */}
                        {algorithmId && currentState && (
                            <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.5)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', zIndex: 50, backdropFilter: 'blur(4px)' }}>
                                <div style={{ fontSize: '0.8rem', color: '#bd93f9', fontWeight: 'bold' }}>Step {currentStep}</div>
                                <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                                    {currentState.stepDetails?.operation ? currentState.stepDetails.operation :
                                        (currentState as GraphEngineState).edges?.find(e => e.state === 'active') ?
                                            `Processing Edge: ${(currentState as GraphEngineState).nodes.find(n => n.id === (currentState as GraphEngineState).edges?.find(e => e.state === 'active')?.source)?.label || ''} → ${(currentState as GraphEngineState).nodes.find(n => n.id === (currentState as GraphEngineState).edges?.find(e => e.state === 'active')?.target)?.label || ''}`
                                            : 'Evaluating'}
                                </div>
                            </div>
                        )}

                        {algorithmId === 'stack' && (
                            <div className="stack-canvas" style={{ width: '100%', height: '100%', position: 'absolute' }}>
                                {((currentState as any).nodes || []).map((node: any, index: number) => (
                                    <div
                                        key={node.id}
                                        className={`structural-node state-${node.state}`}
                                        style={{ bottom: `${index * 60 + 20}px` }}
                                    >
                                        {node.label || node.value}
                                    </div>
                                ))}
                            </div>
                        )}
                        {algorithmId === 'queue' && (
                            <div className="queue-canvas" style={{ width: '100%', height: '100%', position: 'absolute' }}>
                                <div className="queue-track">
                                    {((currentState as any).nodes || []).map((node: any, index: number) => (
                                        <div
                                            key={node.id}
                                            className={`structural-node state-${node.state}`}
                                            style={{ left: `${index * 110 + 20}px` }}
                                        >
                                            {node.label || node.value}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {algorithmId === 'linked-list' && (
                            <div className="ll-canvas" style={{ width: '100%', height: '100%', position: 'absolute' }}>
                                <div className="ll-track">
                                    {((currentState as any).nodes || []).map((node: any, index: number, arr: any[]) => (
                                        <React.Fragment key={node.id}>
                                            <div className={`structural-node ll-node state-${node.state}`}>
                                                {node.label || node.value}
                                            </div>
                                            {index < arr.length - 1 && (
                                                <div className="ll-arrow">→</div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                        {['bst', 'avl'].includes(algorithmId || '') && (
                            <div className="bst-canvas" style={{ width: '100%', height: '100%', position: 'absolute', overflow: 'visible' }}>
                                <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', transition: 'viewBox 0.5s ease-in-out' }}>
                                    {/* Edges */}
                                    <g className="edges-layer">
                                        {((currentState as any).nodes || []).map((node: any) => {
                                            const edges = [];
                                            if (node.left) {
                                                const pts = calculateEdgePoints(node.x, node.y, node.left.x, node.left.y, 25);
                                                edges.push(
                                                    <line
                                                        key={`edge-L-${node.id}`}
                                                        x1={pts.x1} y1={pts.y1}
                                                        x2={pts.x2} y2={pts.y2}
                                                        stroke="#888" // Better contrast
                                                        strokeWidth="3"
                                                        opacity="0.8"
                                                        className={`tree-edge state-${node.left.state}`}
                                                        style={{ stroke: node.left.state === 'active' ? 'var(--node-active)' : '#888', transition: 'all 0.4s' }}
                                                    />
                                                );
                                            }
                                            if (node.right) {
                                                const pts = calculateEdgePoints(node.x, node.y, node.right.x, node.right.y, 25);
                                                edges.push(
                                                    <line
                                                        key={`edge-R-${node.id}`}
                                                        x1={pts.x1} y1={pts.y1}
                                                        x2={pts.x2} y2={pts.y2}
                                                        stroke="#888"
                                                        strokeWidth="3"
                                                        opacity="0.8"
                                                        className={`tree-edge state-${node.right.state}`}
                                                        style={{ stroke: node.right.state === 'active' ? 'var(--node-active)' : '#888', transition: 'all 0.4s' }}
                                                    />
                                                );
                                            }
                                            return edges;
                                        })}
                                    </g>

                                    {/* Nodes */}
                                    {((currentState as any).nodes || []).map((node: any) => (
                                        <g key={node.id} style={{ transform: `translate(${node.x}px, ${node.y}px)`, transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                                            <foreignObject x="-25" y="-25" width="50" height="50" style={{ overflow: 'visible' }}>
                                                <div className={`structural-node bst-node state-${node.state}`} style={{ position: 'relative', left: '0', top: '0' }}>
                                                    {node.label || node.value}
                                                </div>
                                            </foreignObject>
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        )}
                        {['graph', 'tsp'].includes(algorithmId || '') && (
                            <div className="graph-canvas" style={{ width: '100%', height: '100%', position: 'absolute', overflow: 'visible' }}>
                                <svg className="graph-edges" width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none', transition: 'viewBox 0.5s ease-in-out' }}>
                                    {/* Edges rendered behind nodes */}
                                    <g className="edges-layer">
                                        {(currentState as GraphEngineState).edges?.map(edge => {
                                            const sourceNode = (currentState as GraphEngineState).nodes.find(n => n.id === edge.source);
                                            const targetNode = (currentState as GraphEngineState).nodes.find(n => n.id === edge.target);
                                            if (!sourceNode || !targetNode) return null;
                                            const pts = calculateEdgePoints(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y, 25);
                                            return (
                                                <g key={edge.id}>
                                                    <line
                                                        x1={pts.x1} y1={pts.y1}
                                                        x2={pts.x2} y2={pts.y2}
                                                        className={`graph-edge state-${edge.state}`}
                                                        strokeWidth={edge.state === 'active' || edge.state === 'done' ? "4" : "3"}
                                                        opacity="0.8"
                                                        style={{ stroke: edge.state === 'active' ? 'var(--node-active)' : (edge.state === 'done' ? 'var(--node-done)' : '#888'), transition: 'all 0.4s' }}
                                                    />
                                                    {edge.weight !== undefined && (
                                                        <text
                                                            x={(sourceNode.x + targetNode.x) / 2}
                                                            y={(sourceNode.y + targetNode.y) / 2 - 10}
                                                            fill="#bd93f9"
                                                            fontSize="16"
                                                            fontWeight="bold"
                                                            textAnchor="middle"
                                                        >
                                                            {edge.weight}
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </g>

                                    {/* Nodes */}
                                    {((currentState as any).nodes || []).map((node: any) => (
                                        <g key={node.id} style={{ transform: `translate(${node.x}px, ${node.y}px)`, transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                                            <foreignObject x="-25" y="-25" width="50" height="50" style={{ overflow: 'visible' }}>
                                                <div
                                                    className={`structural-node graph-node state-${node.state}`}
                                                    style={{ position: 'relative', left: '0', top: '0', margin: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <div>{node.label || node.value}</div>
                                                    {node.distance !== undefined && (
                                                        <div style={{ fontSize: '0.65rem', color: '#ffb86c', marginTop: '-4px', lineHeight: '1' }}>d={node.distance}</div>
                                                    )}
                                                </div>
                                            </foreignObject>
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        )}
                        {/* N-Queens Rendering */}
                        {algorithmId === 'nqueens' && currentState && (
                            <div className="n-queens-canvas" style={{ width: '100%', height: '100%', position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

                                {/* Metrics Bar */}
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'rgba(0,0,0,0.4)', padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Squares Checked</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{(currentState as NQueensState).squaresChecked ?? 0}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#ffb86c' }}>Placements</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{(currentState as NQueensState).placementsAttempted ?? 0}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#ff5555' }}>Backtracks</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{(currentState as NQueensState).backtracks ?? 0}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#50fa7b' }}>Solutions</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{(currentState as NQueensState).solutions ?? 0}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '20px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#8be9fd' }}>Current Depth</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Row {(currentState as NQueensState).recursionDepth ?? 0}</div>
                                    </div>
                                </div>

                                {galleryMode && (currentState as NQueensState).allSolutions?.length > 0 ? (
                                    /* Solution Gallery Mode */
                                    <div style={{ width: '100%', maxWidth: '800px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <h3 style={{ color: '#50fa7b', marginBottom: '15px' }}>Solution Gallery ({gallerySolutionIndex + 1} / {(currentState as NQueensState).allSolutions.length})</h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '15px' }}>
                                                <button className="icon-btn" disabled={gallerySolutionIndex === 0} onClick={() => setGallerySolutionIndex(prev => prev - 1)}>
                                                    <SkipBack size={20} /> Prev
                                                </button>

                                                {/* Render Active Gallery Board */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: `repeat(${(currentState as NQueensState).n}, 1fr)`,
                                                    width: '400px', height: '400px', border: '2px solid #555', borderRadius: '4px', overflow: 'hidden'
                                                }}>
                                                    {(currentState as NQueensState).allSolutions[gallerySolutionIndex].map((row, rIdx) =>
                                                        row.map((cellObj, cIdx) => (
                                                            <div key={`gal-${rIdx}-${cIdx}`} style={{
                                                                background: (rIdx + cIdx) % 2 === 0 ? '#f0d9b5' : '#b58863', // Classic chess colors
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '2rem'
                                                            }}>
                                                                {cellObj && <span style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>♛</span>}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                <button className="icon-btn" disabled={gallerySolutionIndex === (currentState as NQueensState).allSolutions.length - 1} onClick={() => setGallerySolutionIndex(prev => prev + 1)}>
                                                    Next <SkipForward size={20} />
                                                </button>
                                            </div>
                                            {/* Tuple display */}
                                            <div style={{ fontSize: '1.2rem', color: '#bd93f9', fontWeight: 'bold', fontFamily: 'monospace', background: 'rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '8px' }}>
                                                Tuple: ({(currentState as NQueensState).allSolutions[gallerySolutionIndex].map(row => row.indexOf(true) + 1).join(',')})
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Standard Visualization Mode */
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${(currentState as NQueensState).n}, 1fr)`,
                                        width: '100%', maxWidth: '500px',
                                        aspectRatio: '1/1', // Keep board perfectly square
                                        border: '2px solid #444', borderRadius: '8px', overflow: 'hidden',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)', position: 'relative'
                                    }}>
                                        {(currentState as NQueensState).board?.map((row, rIdx) =>
                                            row.map((cellObj, cIdx) => {
                                                const checkingState = (currentState as NQueensState).checkingSquare;
                                                const isCurrentTarget = checkingState?.row === rIdx && checkingState?.col === cIdx;
                                                const isSafe = isCurrentTarget && (currentState as NQueensState).isSafePos;
                                                const isConflict = (currentState as NQueensState).conflictPos?.some(c => c.row === rIdx && c.col === cIdx);
                                                const isBacktracking = isCurrentTarget && (currentState as NQueensState).isBacktracking;

                                                let bgColor = (rIdx + cIdx) % 2 === 0 ? '#f0d9b5' : '#b58863';

                                                let cellClass = "nqueens-cell";
                                                if (isConflict || (isCurrentTarget && (currentState as NQueensState).isSafePos === false)) cellClass += " cell-conflict";
                                                else if (isSafe) cellClass += " cell-safe";
                                                else if (isCurrentTarget) cellClass += " cell-checking";

                                                let queenClass = "nqueens-queen";
                                                if (isBacktracking) queenClass += " queen-backtrack";
                                                else if (isConflict && cellObj) queenClass += " queen-conflict";
                                                else if (cellObj) queenClass += " queen-enter";

                                                return (
                                                    <div key={`cell-${rIdx}-${cIdx}`} className={cellClass} style={{
                                                        backgroundColor: bgColor,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden'
                                                    }}>
                                                        {cellObj && (
                                                            <span className={queenClass} style={{
                                                                fontSize: `${350 / Math.max((currentState as NQueensState).n, 4)}px`,
                                                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                                                                lineHeight: 0,
                                                                position: 'absolute'
                                                            }}>
                                                                ♛
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}

                                        {/* SVG layer for attack lines */}
                                        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }}>
                                            {(currentState as NQueensState).attackingQueen && (currentState as NQueensState).checkingSquare && (
                                                <line
                                                    className="attack-line"
                                                    x1={`${((currentState as NQueensState).attackingQueen!.col + 0.5) * (100 / (currentState as NQueensState).n)}%`}
                                                    y1={`${((currentState as NQueensState).attackingQueen!.row + 0.5) * (100 / (currentState as NQueensState).n)}%`}
                                                    x2={`${((currentState as NQueensState).checkingSquare!.col + 0.5) * (100 / (currentState as NQueensState).n)}%`}
                                                    y2={`${((currentState as NQueensState).checkingSquare!.row + 0.5) * (100 / (currentState as NQueensState).n)}%`}
                                                    stroke="#ff5555" strokeWidth="4" strokeDasharray="8 4" opacity="0.8" markerEnd="url(#arrowhead)"
                                                />
                                            )}
                                            <defs>
                                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                                    <polygon points="0 0, 10 3.5, 0 7" fill="#ff5555" />
                                                </marker>
                                            </defs>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        )}

                        {!['stack', 'queue', 'linked-list', 'bst', 'avl', 'graph', 'tsp', 'nqueens'].includes(algorithmId || '') && (
                            <div className="canvas-placeholder">
                                <p>Animation Canvas for {algorithmId}</p>
                                <p className="sub-text">Operation controls and visualizations will render here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Panel Area */}
                <div className="info-panel glass-panel">
                    <div className="info-section" style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0 }}>Step Explanations</h3>
                            <div className="explanation-tabs" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {['beginner', 'intermediate', 'advanced'].map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => setExplanationLevel(lvl as any)}
                                        style={{
                                            background: explanationLevel === lvl ? '#bd93f9' : 'transparent',
                                            color: explanationLevel === lvl ? '#fff' : '#aaa',
                                            border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s'
                                        }}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="step-history-log" style={{ overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {states.slice(0, currentStep + 1).map((state: any, idx) => (
                                <div key={idx} style={{ padding: '8px', borderLeft: idx === currentStep ? '3px solid var(--node-active)' : '3px solid #444', background: idx === currentStep ? 'rgba(80, 250, 123, 0.1)' : 'transparent', transition: 'all 0.3s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Step {idx} {state.nodes?.length !== undefined ? `| Nodes: ${state.nodes.length}` : ''}</div>
                                        {state.stepDetails && (
                                            <div style={{ fontSize: '0.7rem', color: '#bd93f9', fontWeight: 'bold', background: 'rgba(189, 147, 249, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {state.stepDetails.operation}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: idx === currentStep ? '#fff' : '#ccc', lineHeight: '1.4' }}>
                                        {state.stepDetails && state.stepDetails.levels[explanationLevel]
                                            ? state.stepDetails.levels[explanationLevel]
                                            : state.description}
                                    </div>
                                    {state.stepDetails && idx === currentStep && explanationLevel === 'advanced' && (
                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#8be9fd' }}>
                                            <div><strong>Reason:</strong> {state.stepDetails.reason}</div>
                                            <div><strong>Result:</strong> {state.stepDetails.result}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div style={{ float: 'left', clear: 'both' }}></div>
                        </div>
                    </div>
                    <div className="info-section">
                        <h3>Status Tracker</h3>
                        <div className="complexity-grid">
                            <div className="complexity-box">
                                <span className="label">Step</span>
                                <span className="value">{currentStep} / {totalSteps}</span>
                            </div>
                            <div className="complexity-box">
                                <span className="label">Structure</span>
                                <span className="value">{(currentState as any).nodes?.length ?? ((currentState as NQueensState).board ? (currentState as NQueensState).n * (currentState as NQueensState).n : 0)} Items</span>
                            </div>
                            {algorithmId === 'tsp' && (
                                <>
                                    <div className="complexity-box">
                                        <span className="label">Time Complexity</span>
                                        <span className="value">
                                            {tspConfig.algorithmType === 'brute-force' ? 'O(n!)' : (tspConfig.algorithmType === 'nearest-neighbor' ? 'O(n²)' : 'O(n² · 2ⁿ)')}
                                        </span>
                                    </div>
                                    <div className="complexity-box">
                                        <span className="label">Space Complexity</span>
                                        <span className="value">
                                            {tspConfig.algorithmType === 'dynamic-programming' ? 'O(n · 2ⁿ)' : 'O(n)'}
                                        </span>
                                    </div>
                                </>
                            )}
                            {(currentState as any).operationsCount !== undefined && (
                                <div className="complexity-box">
                                    <span className="label">Live Ops</span>
                                    <span className="value">{(currentState as any).operationsCount} eval{(currentState as any).operationsCount !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                            {(currentState as any).currentCost !== undefined && (
                                <div className="complexity-box">
                                    <span className="label" style={{ color: '#ffb86c' }}>Current Cost</span>
                                    <span className="value">{(currentState as any).currentCost}</span>
                                </div>
                            )}
                            {(currentState as any).bestCost !== undefined && (
                                <div className="complexity-box">
                                    <span className="label" style={{ color: '#50fa7b' }}>Best Cost</span>
                                    <span className="value">{(currentState as any).bestCost}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {(currentState as any).aiExplanation && (
                        <div className="info-section">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8be9fd' }}><span style={{ fontSize: '1.2em' }}>✨</span> AI Step Explanation</h3>
                            <p style={{ fontStyle: 'italic', color: '#f8f8f2', lineHeight: '1.5', background: 'rgba(139, 233, 253, 0.1)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #8be9fd' }}>
                                {(currentState as any).aiExplanation}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Playback Controls */}
            <div className="controls-container glass-panel">
                <div className="timeline-wrapper">
                    <input
                        type="range"
                        min="0" max={totalSteps}
                        value={currentStep}
                        onChange={(e) => {
                            setCurrentStep(Number(e.target.value));
                            setIsPlaying(false);
                        }}
                        className="timeline-slider"
                    />
                    <div className="timeline-labels">
                        <span>Step {currentStep}</span>
                        <span>Total {totalSteps}</span>
                    </div>
                </div>

                <div className="playback-buttons">
                    <button className="icon-btn" title="Reset Timeline" onClick={handleResetPlayback}>
                        <RotateCcw size={20} />
                    </button>
                    <button className="icon-btn" title="Previous Step" onClick={handlePrev} disabled={currentStep === 0}>
                        <SkipBack size={20} />
                    </button>
                    <button className="play-pause-btn" onClick={togglePlay}>
                        {isPlaying ? <Pause size={24} /> : <Play size={24} className="play-icon-offset" />}
                    </button>
                    <button className="icon-btn" title="Next Step" onClick={handleNext} disabled={currentStep >= totalSteps}>
                        <SkipForward size={20} />
                    </button>
                </div>
            </div>

            {/* AI Assistant Chatbot */}
            <Chatbot algorithmId={algorithmId} />
        </div>
    );
}
