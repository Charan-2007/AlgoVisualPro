export interface NQueensState {
    board: boolean[][]; // true if queen is present
    n: number;
    currentRow: number;
    currentCol: number;
    checkingSquare: { row: number, col: number } | null;
    attackingQueen: { row: number, col: number } | null; // For visualization arrows
    isSafePos: boolean | null;
    isBacktracking: boolean;
    conflictPos: { row: number, col: number }[]; // Highlight red
    solutions: number; // Count of current valid solutions found
    allSolutions: boolean[][][]; // Array of finalized valid board states
    recursionDepth: number;
    placementsAttempted: number;
    conflictsDetected: number;
    squaresChecked: number;
    backtracks: number;
    stepDetails?: {
        step: number;
        operation: string;
        stateSummary: string;
        reason: string;
        result: string;
        levels: { beginner: string; intermediate: string; advanced: string; };
    };
}

export function generateNQueens(n: number): NQueensState[] {
    const states: NQueensState[] = [];
    const board: boolean[][] = Array(n).fill(null).map(() => Array(n).fill(false));
    const allSolutions: boolean[][][] = [];

    let step = 1;
    let solutions = 0;
    let recursionDepth = 0;
    let placementsAttempted = 0;
    let conflictsDetected = 0;
    let squaresChecked = 0;
    let backtracks = 0;

    // Helper to snapshot current board state completely
    const cloneBoard = (b: boolean[][]) => b.map(row => [...row]);

    const addState = (
        currentRow: number,
        currentCol: number,
        checkingSquare: { row: number, col: number } | null,
        attackingQueen: { row: number, col: number } | null,
        isSafePos: boolean | null,
        isBacktracking: boolean,
        conflictPos: { row: number, col: number }[],
        operation: string,
        levels: { beginner: string; intermediate: string; advanced: string; }
    ) => {
        states.push({
            board: cloneBoard(board),
            n,
            currentRow,
            currentCol,
            checkingSquare,
            attackingQueen,
            isSafePos,
            isBacktracking,
            conflictPos,
            solutions,
            allSolutions: [...allSolutions],
            recursionDepth,
            placementsAttempted,
            conflictsDetected,
            squaresChecked,
            backtracks,
            stepDetails: {
                step: step++,
                operation,
                stateSummary: `Squares Checked: ${squaresChecked} | Placements: ${placementsAttempted} | Backtracks: ${backtracks} | Solutions: ${solutions}`,
                reason: operation,
                result: `Searching for solutions on ${n}x${n} board.`,
                levels
            }
        });
    };

    const isSafe = (row: number, col: number): { safe: boolean, attacks: { row: number, col: number }[] } => {
        const attacks: { row: number, col: number }[] = [];

        // Check vertical column
        for (let i = 0; i < row; i++) {
            if (board[i][col]) {
                attacks.push({ row: i, col });
            }
        }

        // Check upper diagonal on left side
        for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
            if (board[i][j]) {
                attacks.push({ row: i, col: j });
            }
        }

        // Check upper diagonal on right side
        for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
            if (board[i][j]) {
                attacks.push({ row: i, col: j });
            }
        }

        return { safe: attacks.length === 0, attacks };
    };

    const solveRow = (row: number) => {
        if (row === n) {
            // Solution Found!
            solutions++;
            allSolutions.push(cloneBoard(board));
            addState(-1, -1, null, null, null, false, [],
                `Solution ${solutions} Found!`,
                {
                    beginner: `We successfully placed all ${n} queens on the board!`,
                    intermediate: `A valid configuration was found where no two queens threaten each other. Saving solution ${solutions}.`,
                    advanced: `Recursion depth reached ${n}. Found valid leaf node in state space tree. Incrementing solution count and continuing search for exhaustive completion.`
                }
            );
            return;
        }

        for (let col = 0; col < n; col++) {
            squaresChecked++;

            // Evaluating
            addState(row, col, { row, col }, null, null, false, [],
                `Checking row ${row} column ${col}`,
                {
                    beginner: `Checking if we can place a queen in row ${row}, column ${col}.`,
                    intermediate: `Evaluating if the square at row ${row}, column ${col} is safe from other queens.`,
                    advanced: `Evaluating node (R${row}, C${col}) at recursion depth ${recursionDepth}.`
                }
            );

            const { safe, attacks } = isSafe(row, col);

            if (safe) {
                // Pre-placement safe highlight
                addState(row, col, { row, col }, null, true, false, [],
                    `Row ${row} column ${col} is safe`,
                    {
                        beginner: `This square is safe! No other queens are attacking here.`,
                        intermediate: `No attacks detected on column or diagonals. Position is safe.`,
                        advanced: `Position (R${row}, C${col}) passes constraints.`
                    }
                );

                // Place Queen
                placementsAttempted++;
                board[row][col] = true;
                addState(row, col, null, null, null, false, [],
                    `Placing queen at (row ${row}, column ${col})`,
                    {
                        beginner: `Placed a queen. Moving to the next row.`,
                        intermediate: `Queen placed at (R${row}, C${col}). Continuing search in the next row.`,
                        advanced: `State updated with placement at (R${row}, C${col}). Descending tree.`
                    }
                );

                recursionDepth++;
                solveRow(row + 1);
                recursionDepth--;

                // Pre-Backtrack visual (glow the queen before removing)
                backtracks++;
                addState(row, col, null, null, null, true, [],
                    `Backtracking from row ${row}`,
                    {
                        beginner: `We need to try a different path. We are removing the queen from row ${row}.`,
                        intermediate: `Backtracking: removing queen at (R${row}, C${col}) to explore other possibilities.`,
                        advanced: `Subtree exhausted. Reverting state at (R${row}, C${col}) and backtracking to explore sibling nodes.`
                    }
                );

                board[row][col] = false; // Remove after the glow state
            } else {
                // Conflict
                conflictsDetected++;
                // Pick the first attack as the primary reason
                const attackingQ = attacks[0];
                addState(row, col, { row, col }, attackingQ, false, false, attacks,
                    `Conflict detected`,
                    {
                        beginner: `Cannot place here! It is being attacked by the queen at row ${attackingQ.row}, column ${attackingQ.col}.`,
                        intermediate: `Conflict detected! The position (R${row}, C${col}) is under attack from a previously placed queen.`,
                        advanced: `Constraint violation at (R${row}, C${col}) due to queen at (R${attackingQ.row}, C${attackingQ.col}). Pruning branch.`
                    }
                );
            }
        }
    };

    addState(-1, -1, null, null, null, false, [], `Initialization`, {
        beginner: `Starting the search for solutions on an empty ${n}x${n} board.`,
        intermediate: `Initializing backtracking algorithm to place ${n} queens.`,
        advanced: `Algorithm start. Initializing state space tree with n=${n}.`
    });

    solveRow(0);

    addState(-1, -1, null, null, null, false, [], `Search Complete`, {
        beginner: `We have finished checking all possibilities! We found ${solutions} solutions.`,
        intermediate: `The algorithm has exhaustively searched the board and concluded. Total valid configurations: ${solutions}.`,
        advanced: `State space traversal complete. Found ${solutions} solutions in ${placementsAttempted} placements.`
    });

    return states;
}
