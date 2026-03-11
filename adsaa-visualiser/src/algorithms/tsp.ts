import { GraphNode, GraphEdge, GraphEngineState } from './graph';

export interface TSPConfig {
    numCities: number;
    directed: boolean;
    startCity: number;
    edges: { u: number, v: number, weight: number }[];
    algorithmType: 'brute-force' | 'nearest-neighbor' | 'dynamic-programming';
}

export function executeTSP(config?: TSPConfig): GraphEngineState[] {
    const states: GraphEngineState[] = [];
    let operationsCount = 0;

    const pushState = (desc: string, currentNodes: GraphNode[], currentEdges: GraphEdge[], currentCost?: number | string, bestCost?: number | string, aiExplanation?: string) => {
        states.push({
            nodes: JSON.parse(JSON.stringify(currentNodes)),
            edges: JSON.parse(JSON.stringify(currentEdges)),
            description: desc,
            operationsCount,
            currentCost,
            bestCost,
            aiExplanation
        });
    };

    // Use default if no config provided (for initial load)
    const n = config ? config.numCities : 5;
    const isDirected = config ? config.directed : false;
    const startCity = config ? config.startCity : 0;
    const algoType = config ? config.algorithmType : 'brute-force';

    const getLabel = (val: number | string) => {
        const num = Number(val);
        if (!isNaN(num) && num >= 0 && num <= 25) {
            return String.fromCharCode(65 + num);
        }
        return String(val);
    };

    const allNodes: GraphNode[] = [];
    const allEdges: GraphEdge[] = [];

    // Layout nodes circularly around an arbitrary generic center
    // We assume the canvas viewBox is roughly 800x600 for SVG rendering
    const canvasWidth = 800;
    const canvasHeight = 600;
    const padding = 60; // Keep nodes away from edges

    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const radius = Math.min(cx, cy) - padding;

    for (let i = 0; i < n; i++) {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        allNodes.push({
            id: `node-${i}`,
            value: i,
            label: getLabel(i),
            state: 'default',
            // Ensure no node mathematically exceeds the absolute box by floating math rounding
            x: Math.max(padding, Math.min(canvasWidth - padding, cx + radius * Math.cos(angle))),
            y: Math.max(padding, Math.min(canvasHeight - padding, cy + radius * Math.sin(angle)))
        });
    }

    if (config && config.edges.length > 0) {
        config.edges.forEach(e => {
            allEdges.push({
                id: isDirected ? `dir-${e.u}-${e.v}` : (e.u < e.v ? `${e.u}-${e.v}` : `${e.v}-${e.u}`),
                source: `node-${e.u}`,
                target: `node-${e.v}`,
                state: 'default',
                weight: e.weight
            });
        });
    } else {
        // Default edges
        const weights: Record<string, number> = {
            '0-1': 10, '0-2': 15, '0-3': 20, '0-4': 25,
            '1-2': 35, '1-3': 25, '1-4': 30,
            '2-3': 30, '2-4': 10,
            '3-4': 15
        };

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const w = weights[`${i}-${j}`];
                if (w !== undefined) {
                    allEdges.push({
                        id: `${i}-${j}`,
                        source: `node-${i}`,
                        target: `node-${j}`,
                        state: 'default',
                        weight: w
                    });
                }
            }
        }
    }

    pushState(
        `Initial Map for ${algoType === 'brute-force' ? 'Brute Force' : 'Nearest Neighbor'} TSP.`,
        allNodes,
        allEdges,
        0,
        '∞',
        `Welcome to the Travelling Salesperson Problem (TSP). We have ${n} cities spread out on the grid. Our objective is to find the absolute shortest continuous route starting at City ${getLabel(startCity)} that visits every other single city exactly once before returning home.`
    );

    const getEdge = (u: number, v: number): GraphEdge | undefined => {
        const checkId1 = isDirected ? `dir-${u}-${v}` : (u < v ? `${u}-${v}` : `${v}-${u}`);
        // If undirected, we might also try the inverse just in case it was stored weirdly, though we standardized it.
        if (isDirected) {
            return allEdges.find(e => e.id === checkId1);
        } else {
            return allEdges.find(e => e.id === checkId1 || e.id === `${v}-${u}`);
        }
    };

    const lightPath = (path: number[], done: boolean) => {
        allEdges.forEach(e => e.state = 'default');
        allNodes.forEach(n => n.state = 'default');

        let cost = 0;
        let valid = true;
        for (let i = 0; i < path.length; i++) {
            allNodes[path[i]].state = done ? 'done' : 'active';
            if (i > 0) {
                operationsCount++;
                const u = path[i - 1];
                const v = path[i];
                const edge = getEdge(u, v);
                if (edge) {
                    edge.state = done ? 'done' : 'active';
                    cost += edge.weight || 0;
                } else {
                    valid = false;
                    cost += 999999; // Invalid path penalty
                }
            }
        }
        return { cost, valid };
    };

    let bestPath: number[] = [];
    let bestCost = Infinity;

    if (algoType === 'brute-force') {
        const permutations: number[][] = [];
        const others = Array.from({ length: n }, (_, i) => i).filter(i => i !== startCity);

        operationsCount++; // Init cost

        function permute(arr: number[], m: number = 0) {
            operationsCount++;
            if (m === arr.length - 1) {
                permutations.push([...arr]);
            } else {
                for (let i = m; i < arr.length; i++) {
                    [arr[m], arr[i]] = [arr[i], arr[m]];
                    permute(arr, m + 1);
                    [arr[m], arr[i]] = [arr[i], arr[m]];
                }
            }
        }
        permute(others);

        for (const p of permutations) {
            const currentPath = [startCity, ...p, startCity];
            const { cost, valid } = lightPath(currentPath, false);

            if (valid) {
                pushState(
                    `Checking route: ${currentPath.map(getLabel).join(' -> ')}. Local Cost: ${cost}`,
                    allNodes,
                    allEdges,
                    cost,
                    bestCost === Infinity ? '∞' : bestCost,
                    `We are evaluating the sequence: ${currentPath.map(getLabel).join(' -> ')}. The algorithm sequentially adds the weight of each connection. The total running distance for this sequence is ${cost}.`
                );

                if (cost < bestCost) {
                    bestCost = cost;
                    bestPath = [...currentPath];
                    pushState(
                        `⭐ New optimal recorded! Route: ${bestPath.map(getLabel).join(' -> ')}. Min Cost: ${bestCost}`,
                        allNodes,
                        allEdges,
                        cost,
                        bestCost,
                        `We found a new optimal route! Since ${cost} is lower than our previous best record (or it's the first valid path we checked), we've locked it in as the current answer. We will continue checking the remaining permutations to ensure there isn't an even shorter sequence.`
                    );
                }
            }
        }

    } else if (algoType === 'nearest-neighbor') {
        // Nearest Neighbor implementation
        const visited = new Set<number>();
        let currentCity = startCity;
        visited.add(currentCity);

        let currentPath = [currentCity];
        bestCost = 0;

        pushState(
            `Starting Nearest Neighbor from City ${getLabel(currentCity)}`,
            allNodes,
            allEdges,
            0,
            bestCost === 0 ? 'Evaluating' : bestCost,
            `The Nearest Neighbor approach is a greedy algorithm! Instead of mapping out every single universal permutation, it simply asks: "From my current location, what's the shortest path to an unvisited city?". Starting right now from City ${getLabel(startCity)}.`
        );

        while (visited.size < n) {
            let nextCity = -1;
            let shortestDist = Infinity;

            // Highlight current city neighbors
            for (let i = 0; i < n; i++) {
                operationsCount++;
                if (!visited.has(i)) {
                    const edge = getEdge(currentCity, i);
                    if (edge && edge.weight !== undefined && edge.weight < shortestDist) {
                        shortestDist = edge.weight;
                        nextCity = i;
                    }
                }
            }

            if (nextCity !== -1) {
                bestCost += shortestDist;
                visited.add(nextCity);
                currentCity = nextCity;
                currentPath.push(currentCity);

                lightPath(currentPath, false);
                pushState(
                    `Chose nearest neighbor City ${getLabel(currentCity)}. Added Cost: ${shortestDist}. Total: ${bestCost}`,
                    allNodes,
                    allEdges,
                    bestCost,
                    'Evaluating',
                    `From our location, the closest unvisited dot was City ${getLabel(currentCity)} at a cost of ${shortestDist}. We eagerly travel there without worrying about the rest of the map yet.`
                );
            } else {
                // Stuck
                pushState(
                    `Dead end reached at City ${getLabel(currentCity)}. No edges to unvisited cities!`,
                    allNodes,
                    allEdges,
                    bestCost,
                    'Evaluating',
                    `Oh no! In directed graphs or disconnected nodes, a greedy algorithm can trap itself if there's no way back. We hit a dead end finding no unvisited nodes.`
                );
                break;
            }
        }

        if (visited.size === n) {
            const homeEdge = getEdge(currentCity, startCity);
            operationsCount++;
            if (homeEdge) {
                bestCost += homeEdge.weight || 0;
                currentPath.push(startCity);
                lightPath(currentPath, false);
                pushState(
                    `Returning home to City ${getLabel(startCity)}. Added Cost: ${homeEdge.weight}. Total: ${bestCost}`,
                    allNodes,
                    allEdges,
                    bestCost,
                    bestCost,
                    `We have successfully visited all ${n} dots! The final constraint of TSP is traveling back to exactly where we started. We add the connection weight from ${getLabel(currentCity)} back to ${getLabel(startCity)} concluding the sequence.`
                );
            } else {
                pushState(
                    `Cannot return home! No edge exists from ${getLabel(currentCity)} to ${getLabel(startCity)}.`,
                    allNodes,
                    allEdges,
                    bestCost,
                    'Evaluating',
                    `The sequence visited all dots, but fails TSP bounds! There's no path back to City ${getLabel(startCity)} from our final destination.`
                );
                currentPath = [];
            }
        }
        bestPath = currentPath;
    } else if (algoType === 'dynamic-programming') {
        const FULL_MASK = (1 << n) - 1;
        const dp: Record<number, Record<number, number>> = {};
        const parent: Record<number, Record<number, number>> = {};

        // Reset
        bestCost = Infinity;

        // DP initialization
        for (let i = 0; i <= FULL_MASK; i++) {
            dp[i] = {};
            parent[i] = {};
            for (let j = 0; j < n; j++) {
                dp[i][j] = Infinity;
                parent[i][j] = -1;
            }
        }

        dp[1 << startCity][startCity] = 0;

        pushState(
            `Started DP Held-Karp! Initialization: dp[${(1 << startCity).toString(2)}][${getLabel(startCity)}] = 0.`,
            allNodes, allEdges, 0, 'Evaluating DP',
            `Dynamic Programming systematically stores optimal sub-routes mathematically. Instead of traversing blindly, we compute minimum combinations ending at specific nodes subset by subset. Our time complexity drastically improves to O(n² · 2ⁿ)!`
        );

        for (let mask = 1; mask <= FULL_MASK; mask++) {
            // Focus on contiguous subsets connected to the root start city
            if (!(mask & (1 << startCity))) continue;

            const subsetNodes = [];
            for (let i = 0; i < n; i++) {
                if (mask & (1 << i)) subsetNodes.push(i);
            }

            for (let u = 0; u < n; u++) {
                if (!(mask & (1 << u)) || (u === startCity && mask !== (1 << startCity))) continue;
                if (dp[mask][u] === Infinity) continue;

                for (let v = 0; v < n; v++) {
                    if (mask & (1 << v)) continue; // We already visited 'v'

                    operationsCount++;
                    const edge = getEdge(u, v);
                    if (edge && edge.weight !== undefined) {
                        const newMask = mask | (1 << v);
                        const newCost = dp[mask][u] + edge.weight;

                        pushState(
                            `Evaluating subset {${subsetNodes.map(getLabel).join(', ')}} → ${getLabel(v)}. Transition ${getLabel(u)} → ${getLabel(v)} (w: ${edge.weight})`,
                            allNodes, allEdges, newCost, 'Evaluating DP',
                            `Investigating an extension of our visited subgroup to include City ${getLabel(v)}. Adding edge weight ${edge.weight} to our cached combination gives ${newCost}.`
                        );

                        if (newCost < dp[newMask][v]) {
                            dp[newMask][v] = newCost;
                            parent[newMask][v] = u;
                            pushState(
                                `Updating optimal memoization: dp[${newMask.toString(2)}][${getLabel(v)}] = ${newCost}`,
                                allNodes, allEdges, newCost, 'Evaluating DP',
                                `We successfully found a cheaper path covering this exact subset of cities terminating cleanly at ${getLabel(v)}! The cache is updated.`
                            );
                        }
                    }
                }
            }
        }

        // DP Finalization - Find the optimal routing home to startCity
        for (let u = 0; u < n; u++) {
            if (u === startCity) continue;
            const edge = getEdge(u, startCity);
            if (edge && edge.weight !== undefined && dp[FULL_MASK][u] !== Infinity) {
                const totalCost = dp[FULL_MASK][u] + edge.weight;
                if (totalCost < bestCost) {
                    bestCost = totalCost;

                    // Route formulation mathematically
                    let curr = u;
                    let currMask = FULL_MASK;
                    const path = [startCity];
                    while (curr !== startCity && curr !== -1) {
                        path.push(curr);
                        const p = parent[currMask][curr];
                        currMask ^= (1 << curr);
                        curr = p;
                    }
                    path.push(startCity);
                    bestPath = path.reverse();

                    pushState(
                        `Cycle complete! Final subset terminating at ${getLabel(u)} closed the loop back to ${getLabel(startCity)}.`,
                        allNodes, allEdges, bestCost, bestCost,
                        `We dynamically connected the cheapest valid path that mapped exactly 100% of all nodes back to its origin! Optimal found: ${bestCost}.`
                    );
                }
            }
        }
    }

    if (bestPath.length === n + 1) {
        lightPath(bestPath, true);
        pushState(
            `TSP Completed! Optimal Path: ${bestPath.map(getLabel).join(' -> ')} with Travel Cost: ${bestCost}`,
            allNodes,
            allEdges,
            bestCost,
            bestCost,
            algoType === 'brute-force'
                ? `Verification finished! Out of all combinations mapped by the Brute Force factorial scale (Time Complexity: O(n!)), we proved that this highlighted path sequence perfectly minimizes our total travel distance.`
                : (algoType === 'nearest-neighbor'
                    ? `Sequence completed! The greedy Nearest Neighbor algorithm (Time Complexity: O(n²)) managed to heuristically calculate this path extremely fast, though it may not be strictly matching the true optimal shortest distance!`
                    : `Optimal DP execution successfully rendered! By utilizing Held-Karp and caching (Time Complexity: O(n² · 2ⁿ)), we proved mathematically the exact lowest minimum distance routing map safely without suffering combinatorial explosion.`)
        );
    } else {
        pushState(
            `TSP Failed. Could not find a valid path to visit all nodes and return home.`,
            allNodes,
            allEdges,
            'Failed',
            'Failed',
            `The algorithm could not trace a valid path that satisfied the requirements, either due to missing connections or poorly placed directed graph limits.`
        );
    }

    return states;
}
