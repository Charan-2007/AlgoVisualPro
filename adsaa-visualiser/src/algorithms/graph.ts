import { VisualNode, EngineState, Operation } from './stack';

export interface GraphNode extends VisualNode {
    x: number;
    y: number;
    distance?: number | string;
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    state: 'default' | 'active' | 'done';
    weight?: number;
}

export interface GraphEngineState extends EngineState {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export function executeGraph(operations: Operation[]): GraphEngineState[] {
    const states: GraphEngineState[] = [];
    let allNodes: GraphNode[] = [];
    let allEdges: GraphEdge[] = [];

    const getLabel = (val: number | string) => {
        const num = Number(val);
        if (!isNaN(num) && num >= 0 && num <= 25) {
            return String.fromCharCode(65 + num);
        }
        return String(val);
    };

    states.push({
        nodes: [],
        edges: [],
        description: "Initial empty graph."
    });

    const pushState = (desc: string) => {
        states.push({
            nodes: JSON.parse(JSON.stringify(allNodes)),
            edges: JSON.parse(JSON.stringify(allEdges)),
            description: desc
        });
    };

    const resetStates = () => {
        allNodes.forEach(n => { n.state = 'default'; n.distance = undefined; });
        allEdges.forEach(e => e.state = 'default');
    };

    // Calculate layout in a circle for simple auto-layout
    const relayoutNodes = () => {
        const radius = Math.min(300, 100 + allNodes.length * 20);
        const cx = 400;
        const cy = 300;
        allNodes.forEach((node, idx) => {
            const angle = (idx / allNodes.length) * 2 * Math.PI - Math.PI / 2;
            node.x = cx + radius * Math.cos(angle);
            node.y = cy + radius * Math.sin(angle);
        });
    };

    operations.forEach(op => {
        if (op.type === 'insert_node') {
            const val = op.value!;
            if (!allNodes.find(n => n.value === val)) {
                pushState(`Adding node ${getLabel(val)}`);
                allNodes.push({
                    id: `node-${val}`,
                    value: val,
                    label: getLabel(val),
                    state: 'active',
                    x: 400, y: 300 // Temporary
                });
                relayoutNodes();
                pushState(`Node ${getLabel(val)} added.`);
                resetStates();
            }
        }
        else if (op.type === 'insert_edge') {
            const uVal = op.value!;
            const vVal = op.target!;
            const weight = op.weight;

            const uNode = allNodes.find(n => n.value === uVal);
            const vNode = allNodes.find(n => n.value === vVal);

            if (uNode && vNode) {
                const edgeId = uVal < vVal ? `${uVal}-${vVal}` : `${vVal}-${uVal}`;
                if (!allEdges.find(e => e.id === edgeId)) {
                    pushState(`Adding edge between ${getLabel(uVal)} and ${getLabel(vVal)}`);
                    uNode.state = 'active';
                    vNode.state = 'active';
                    pushState(`Connecting nodes...`);

                    allEdges.push({
                        id: edgeId,
                        source: `node-${uVal}`,
                        target: `node-${vVal}`,
                        state: 'active',
                        weight
                    });
                    pushState(`Edge added.`);
                    resetStates();
                }
            }
        }
        else if (op.type === 'bfs') {
            const startVal = op.value!;
            const startIdx = allNodes.findIndex(n => n.value === startVal);
            if (startIdx === -1) return;

            pushState(`Starting BFS from node ${getLabel(startVal)}`);
            const visited = new Set<number>();
            const queue = [startIdx];
            visited.add(startIdx);

            allNodes[startIdx].state = 'active';
            pushState(`Visiting node ${getLabel(startVal)}`);
            allNodes[startIdx].state = 'done';

            while (queue.length > 0) {
                const u = queue.shift()!;
                const uVal = allNodes[u].value;

                // find neighbors
                const neighbors: number[] = [];
                for (let i = 0; i < allNodes.length; i++) {
                    const vVal = allNodes[i].value;
                    const edgeId = Number(uVal) < Number(vVal) ? `${uVal}-${vVal}` : `${vVal}-${uVal}`;
                    if (allEdges.find(e => e.id === edgeId)) {
                        neighbors.push(i);
                    }
                }

                for (const v of neighbors) {
                    const vVal = allNodes[v].value;
                    const edgeId = Number(uVal) < Number(vVal) ? `${uVal}-${vVal}` : `${vVal}-${uVal}`;
                    const edge = allEdges.find(e => e.id === edgeId);

                    if (edge && !visited.has(v)) {
                        edge.state = 'active';
                        allNodes[v].state = 'active';
                        pushState(`Traversing edge to unvisited neighbor ${getLabel(vVal)}`);

                        edge.state = 'done';
                        allNodes[v].state = 'done';
                        visited.add(v);
                        queue.push(v);

                        pushState(`Marking node ${getLabel(vVal)} as visited and adding to queue.`);
                    }
                }
            }
            pushState("BFS Traversal complete.");
            resetStates();
        }
        else if (op.type === 'dfs') {
            const startVal = op.value!;
            const startIdx = allNodes.findIndex(n => n.value === startVal);
            if (startIdx === -1) return;

            pushState(`Starting DFS from node ${getLabel(startVal)}`);
            const visited = new Set<number>();

            const dfs = (u: number, parentVal: number | null) => {
                visited.add(u);
                const uVal = allNodes[u].value as number;
                allNodes[u].state = 'active';

                if (parentVal !== null) {
                    const edgeId = Number(uVal) < Number(parentVal) ? `${uVal}-${parentVal}` : `${parentVal}-${uVal}`;
                    const edge = allEdges.find(e => e.id === edgeId);
                    if (edge) edge.state = 'active';
                }

                pushState(`Visiting node ${getLabel(uVal)}`);
                allNodes[u].state = 'done';

                if (parentVal !== null) {
                    const edgeId = Number(uVal) < Number(parentVal) ? `${uVal}-${parentVal}` : `${parentVal}-${uVal}`;
                    const edge = allEdges.find(e => e.id === edgeId);
                    if (edge) edge.state = 'done';
                }

                // find neighbors
                const neighbors: number[] = [];
                for (let i = 0; i < allNodes.length; i++) {
                    const vVal = allNodes[i].value;
                    const edgeId = Number(uVal) < Number(vVal) ? `${uVal}-${vVal}` : `${vVal}-${uVal}`;
                    if (allEdges.find(e => e.id === edgeId)) {
                        neighbors.push(i);
                    }
                }

                for (const v of neighbors) {
                    if (!visited.has(v)) {
                        dfs(v, uVal);
                    }
                }
            };

            dfs(startIdx, null);
            pushState("DFS Traversal complete.");
            resetStates();
        }
        else if (op.type === 'dijkstra') {
            const startVal = op.value!;
            const startIdx = allNodes.findIndex(n => n.value === startVal);
            if (startIdx === -1) return;

            pushState(`Starting Dijkstra's from node ${getLabel(startVal)}`);
            const distances: Record<number, number> = {};

            allNodes.forEach((n, i) => {
                distances[i] = Infinity;
                n.distance = '∞';
            });

            distances[startIdx] = 0;
            allNodes[startIdx].distance = 0;
            pushState(`Set distance of start node ${getLabel(startVal)} to 0`);

            const unvisited = new Set<number>(allNodes.map((_, i) => i));

            while (unvisited.size > 0) {
                let u: number | null = null;
                let minDist = Infinity;
                unvisited.forEach(node => {
                    if (distances[node] < minDist) {
                        minDist = distances[node];
                        u = node;
                    }
                });

                if (u === null || minDist === Infinity) break;
                unvisited.delete(u);

                const uVal = allNodes[u].value as number;
                allNodes[u].state = 'active';
                pushState(`Selected node ${getLabel(uVal)} with minimum distance ${distances[u]}`);

                const neighbors: number[] = [];
                for (let i = 0; i < allNodes.length; i++) {
                    const vVal = allNodes[i].value;
                    const edgeId = Number(uVal) < Number(vVal) ? `${uVal}-${vVal}` : `${vVal}-${uVal}`;
                    if (allEdges.find(e => e.id === edgeId)) {
                        neighbors.push(i);
                    }
                }

                for (const v of neighbors) {
                    if (unvisited.has(v)) {
                        const vVal = allNodes[v].value;
                        const edgeId = Number(uVal) < Number(vVal) ? `${uVal}-${vVal}` : `${vVal}-${uVal}`;
                        const edge = allEdges.find(e => e.id === edgeId);
                        const weight = edge?.weight || 1; // Default to 1 if unweighted

                        const alt = distances[u] + weight;
                        if (edge) edge.state = 'active';

                        const currentDistStr = distances[v] === Infinity ? '∞' : distances[v];
                        pushState(`Checking neighbor ${getLabel(vVal)}. Current distance: ${currentDistStr}. Alt: ${distances[u]} + ${weight} = ${alt}`);

                        if (alt < distances[v]) {
                            distances[v] = alt;
                            allNodes[v].distance = alt;
                            pushState(`Updated shortest distance to node ${getLabel(vVal)} to ${alt}`);
                        }

                        if (edge) edge.state = 'default';
                    }
                }
                allNodes[u].state = 'done';
            }
            pushState("Dijkstra's Algorithm complete.");
            resetStates();
        }
    });

    return states;
}
