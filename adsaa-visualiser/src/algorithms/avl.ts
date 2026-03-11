import { EngineState, Operation } from './stack';
import { TreeNode } from './bst';

export function executeAVL(operations: Operation[]): EngineState[] {
    const states: EngineState[] = [];
    let root: TreeNode | undefined = undefined;
    let nextId = 0;
    let stepCount = 0;

    states.push({
        nodes: [],
        description: "Initial empty AVL Tree.",
        stepDetails: {
            step: stepCount++,
            operation: "Initialize",
            stateSummary: "Empty Tree",
            reason: "Setup the environment",
            result: "AVL Tree is ready.",
            levels: {
                beginner: "We start with an empty canvas for our self-balancing tree.",
                intermediate: "An empty AVL tree structure is initialized.",
                advanced: "Root pointer allocated. Height calculations will track strictly log(N) complexity dynamically."
            }
        }
    });

    const getAllNodes = (node: TreeNode | undefined): TreeNode[] => {
        if (!node) return [];
        return [...getAllNodes(node.left), node, ...getAllNodes(node.right)];
    };

    const cloneTree = (node: TreeNode | undefined): TreeNode | undefined => {
        if (!node) return undefined;
        return {
            ...node,
            left: cloneTree(node.left),
            right: cloneTree(node.right)
        };
    };

    const pushState = (desc: string, stepDetails?: any) => {
        states.push({
            nodes: getAllNodes(cloneTree(root)),
            description: desc,
            stepDetails: stepDetails ? { ...stepDetails, step: stepCount++ } : undefined
        });
    };

    const resetStates = (node: TreeNode | undefined) => {
        if (!node) return;
        node.state = 'default';
        resetStates(node.left);
        resetStates(node.right);
    };

    const height = (node: TreeNode | undefined): number => {
        if (!node) return 0;
        return Math.max(height(node.left), height(node.right)) + 1;
    };

    const getBalance = (node: TreeNode | undefined): number => {
        if (!node) return 0;
        return height(node.left) - height(node.right);
    };

    const recalcPositions = (node: TreeNode | undefined, level: number, xStart: number, xEnd: number) => {
        if (!node) return;
        node.x = (xStart + xEnd) / 2;
        node.y = level * 80 + 40;
        recalcPositions(node.left, level + 1, xStart, node.x);
        recalcPositions(node.right, level + 1, node.x, xEnd);
    };

    const rightRotate = (y: TreeNode): TreeNode => {
        const x = y.left!;
        const T2 = x.right;

        pushState(`Right rotating on node ${y.value}`, {
            operation: `Right Rotate`,
            stateSummary: `Balancing Tree`,
            reason: `Left-heavy imbalance detected.`,
            result: `Node ${x.value} rises, ${y.value} sinks.`,
            levels: {
                beginner: `The left side is too heavy! We 'rotate' it to the right to flatten it out, like balancing a scale.`,
                intermediate: `A right rotation is performed on node ${y.value}. The left child becomes the new root of this subtree.`,
                advanced: `O(1) pointer manipulation. y.left = x.right; x.right = y. Subtree heights implicitly change.`
            }
        });

        x.right = y;
        y.left = T2;

        return x;
    };

    const leftRotate = (x: TreeNode): TreeNode => {
        const y = x.right!;
        const T2 = y.left;

        pushState(`Left rotating on node ${x.value}`, {
            operation: `Left Rotate`,
            stateSummary: `Balancing Tree`,
            reason: `Right-heavy imbalance detected.`,
            result: `Node ${y.value} rises, ${x.value} sinks.`,
            levels: {
                beginner: `The right side is too heavy! We 'rotate' it to the left to flatten it out.`,
                intermediate: `A left rotation is performed on node ${x.value}. The right child becomes the new root.`,
                advanced: `O(1) pointer manipulation. x.right = y.left; y.left = x. Maintains strictly O(log N) tree height overall.`
            }
        });

        y.left = x;
        x.right = T2;

        return y;
    };

    const insert = (node: TreeNode | undefined, val: number): TreeNode => {
        if (!node) {
            return {
                id: `node-${nextId++}`,
                value: val,
                state: 'active',
                x: 0, y: 0 // Will be recalculated
            };
        }

        node.state = 'active';
        pushState(`Comparing ${val} with ${node.value}`);
        node.state = 'default';

        if (val < Number(node.value)) {
            node.left = insert(node.left, val);
        } else if (val > Number(node.value)) {
            node.right = insert(node.right, val);
        } else {
            return node; // Duplicate keys not allowed
        }

        recalcPositions(root, 0, 0, 800);

        const balance = getBalance(node);

        // Left Left Case
        if (balance > 1 && val < Number(node.left!.value)) {
            pushState(`Tree unbalanced at ${node.value} (Left-Left Case).`, {
                operation: `LL Case Detected`,
                stateSummary: `Imbalance BF=${balance}`,
                reason: `Balance Factor > 1 (Left heavy) and insertion was on Left child's Left.`,
                result: `Needs 1 Right Rotation.`,
                levels: {
                    beginner: `The tree is leaning too far to the left in a straight line! We need to bend it right.`,
                    intermediate: `Left-Left case identified. This requires a single Right Rotation to restore balance properties.`,
                    advanced: `Node BF=${balance}. Left child BF is +1. Solved via O(1) Right Rotate.`
                }
            });
            const newRoot = rightRotate(node);
            recalcPositions(newRoot, 0, 0, 800);
            return newRoot;
        }

        // Right Right Case
        if (balance < -1 && val > Number(node.right!.value)) {
            pushState(`Tree unbalanced at ${node.value} (Right-Right Case).`, {
                operation: `RR Case Detected`,
                stateSummary: `Imbalance BF=${balance}`,
                reason: `Balance Factor < -1 (Right heavy) and insertion was on Right child's Right.`,
                result: `Needs 1 Left Rotation.`,
                levels: {
                    beginner: `The tree is leaning too far to the right in a straight line! We need to bend it left.`,
                    intermediate: `Right-Right case identified. This requires a single Left Rotation to fix.`,
                    advanced: `Node BF=${balance}. Right child BF is -1. Solved via O(1) Left Rotate.`
                }
            });
            const newRoot = leftRotate(node);
            recalcPositions(newRoot, 0, 0, 800);
            return newRoot;
        }

        // Left Right Case
        if (balance > 1 && val > Number(node.left!.value)) {
            pushState(`Tree unbalanced at ${node.value} (Left-Right Case).`, {
                operation: `LR Case Detected`,
                stateSummary: `Imbalance BF=${balance}`,
                reason: `Zig-zag formation on the left side.`,
                result: `Needs Left Rotate then Right Rotate.`,
                levels: {
                    beginner: `The tree is leaning left, but zig-zags inside! We must first swing the bottom branch out, then rotate the whole thing.`,
                    intermediate: `Left-Right case identified. This is a complex imbalance requiring a Left Rotate on the child, followed by a Right Rotate on the parent.`,
                    advanced: `Node BF=${balance}. Left child BF is -1. Solved via Double Rotation (Left-Right).`
                }
            });
            node.left = leftRotate(node.left!);
            recalcPositions(root, 0, 0, 800);
            const newRoot = rightRotate(node);
            recalcPositions(newRoot, 0, 0, 800);
            return newRoot;
        }

        // Right Left Case
        if (balance < -1 && val < Number(node.right!.value)) {
            pushState(`Tree unbalanced at ${node.value} (Right-Left Case).`, {
                operation: `RL Case Detected`,
                stateSummary: `Imbalance BF=${balance}`,
                reason: `Zig-zag formation on the right side.`,
                result: `Needs Right Rotate then Left Rotate.`,
                levels: {
                    beginner: `The tree is leaning right but zig-zags inwards. We must untangle the bottom part before balancing the top.`,
                    intermediate: `Right-Left case identified. Requires a Right Rotate on the right child, followed by a Left Rotate on the parent.`,
                    advanced: `Node BF=${balance}. Right child BF is +1. Solved via Double Rotation (Right-Left).`
                }
            });
            node.right = rightRotate(node.right!);
            recalcPositions(root, 0, 0, 800);
            const newRoot = leftRotate(node);
            recalcPositions(newRoot, 0, 0, 800);
            return newRoot;
        }


        return node;
    };

    const findMin = (node: TreeNode): TreeNode => {
        let current = node;
        while (current.left) {
            current = current.left;
        }
        return current;
    };

    const deleteNode = (node: TreeNode | undefined, val: number): TreeNode | undefined => {
        if (!node) return node;

        node.state = 'active';
        pushState(`Looking for ${val} to delete, currently at ${node.value}`);
        node.state = 'default';

        if (val < Number(node.value)) {
            node.left = deleteNode(node.left, val);
        } else if (val > Number(node.value)) {
            node.right = deleteNode(node.right, val);
        } else {
            pushState(`Found node ${val} to delete.`);

            if (!node.left || !node.right) {
                const temp = node.left ? node.left : node.right;
                if (!temp) {
                    node = undefined;
                } else {
                    node = temp;
                }
            } else {
                const temp = findMin(node.right);
                node.value = temp.value;
                node.right = deleteNode(node.right, Number(temp.value));
            }
        }

        if (!node) return node;

        const balance = getBalance(node);

        // Left Left Case
        if (balance > 1 && getBalance(node.left) >= 0) {
            pushState(`Tree unbalanced at ${node.value} after deletion (Left-Left Case).`);
            const newRoot = rightRotate(node);
            recalcPositions(newRoot, 0, 0, 800);
            return newRoot;
        }

        // Left Right Case
        if (balance > 1 && getBalance(node.left) < 0) {
            pushState(`Tree unbalanced at ${node.value} after deletion (Left-Right Case).`);
            node.left = leftRotate(node.left!);
            recalcPositions(root, 0, 0, 800);
            const newRoot = rightRotate(node);
            recalcPositions(newRoot, 0, 0, 800);
            return newRoot;
        }

        // Right Right Case
        if (balance < -1 && getBalance(node.right) <= 0) {
            pushState(`Tree unbalanced at ${node.value} after deletion (Right-Right Case).`);
            const newRoot = leftRotate(node);
            recalcPositions(newRoot, 0, 0, 800);
            return newRoot;
        }

        // Right Left Case
        if (balance < -1 && getBalance(node.right) > 0) {
            pushState(`Tree unbalanced at ${node.value} after deletion (Right-Left Case).`);
            node.right = rightRotate(node.right!);
            recalcPositions(root, 0, 0, 800);
            const newRoot = leftRotate(node);
            recalcPositions(newRoot, 0, 0, 800);
            return newRoot;
        }

        return node;
    };

    const find = (node: TreeNode | undefined, val: number): boolean => {
        if (!node) return false;

        node.state = 'active';
        pushState(`Searching for ${val}, comparing with ${node.value}`, {
            operation: `Search(${val}) at ${node.value}`,
            stateSummary: `Evaluating Node`,
            reason: `Locating target recursively.`,
            result: `Value ${val} is ${val < Number(node.value) ? 'less' : (val > Number(node.value) ? 'greater' : 'equal')} than ${node.value}.`,
            levels: {
                beginner: `We check if this node holds the value ${val}.`,
                intermediate: `Following BST logic to traverse dynamically left or right.`,
                advanced: `Time Complexity in strictly balanced AVL is O(log N).`
            }
        });

        if (Number(node.value) === val) {
            node.state = 'done';
            pushState(`Found value ${val}!`, {
                operation: `Match()`,
                stateSummary: `Target found`,
                reason: `Equality operator evaluated true.`,
                result: `Search terminates successfully.`,
                levels: {
                    beginner: `We found exactly what we were looking for!`,
                    intermediate: `The target node is located and a reference can be returned.`,
                    advanced: `Search hit. Return node reference.`
                }
            });
            return true;
        }

        node.state = 'default';
        if (val < Number(node.value)) {
            return find(node.left, val);
        } else {
            return find(node.right, val);
        }
    };

    operations.forEach(op => {
        if (op.type === 'insert') {
            const val = op.value!;
            pushState(`Inserting value ${val} into the AVL Tree.`, {
                operation: `Insert(${val}) Init`,
                stateSummary: `Starting Insertion`,
                reason: `User requested to insert ${val}.`,
                result: `Traversing from Root.`,
                levels: {
                    beginner: `We want to add a new number ${val} to our self-balancing tree.`,
                    intermediate: `Initializing recursive insertion starting from the root node.`,
                    advanced: `Insert operation called. Space complexity O(N).`
                }
            });
            root = insert(root, val);
            recalcPositions(root, 0, 0, 800);
            // push state again since root reference might not have been caught if it was an empty tree initially
            pushState(`Rebalancing complete.`, {
                operation: `Insert(${val}) Complete`,
                stateSummary: `Tree Balanced`,
                reason: `Insertion and subsequent rotations finished.`,
                result: `Tree expanded and balanced.`,
                levels: {
                    beginner: `The number was added and the tree automatically ensured it stayed perfectly balanced!`,
                    intermediate: `The tree structurally updated and balance factors are all strictly within [-1, 1].`,
                    advanced: `Pointer updated in parent frame. Recursion unrolls. Strictly O(log N) height maintained.`
                }
            });
            resetStates(root);
        } else if (op.type === 'find') {
            const val = op.value!;
            const found = find(root, val);
            if (!found) pushState(`Value ${val} not found.`);
            resetStates(root);
        } else if (op.type === 'delete') {
            const val = op.value!;
            pushState(`Deleting value ${val} from the AVL Tree.`, {
                operation: `DeleteInit(${val})`,
                stateSummary: `Initialize removal`,
                reason: `User requested deletion.`,
                result: `Starting traversal.`,
                levels: {
                    beginner: `We are starting the mission to find and erase ${val}.`,
                    intermediate: `Calling recursive deleteNode routine starting from root.`,
                    advanced: `Delete tracking initiated.`
                }
            });
            root = deleteNode(root, val);
            recalcPositions(root, 0, 0, 800);
            resetStates(root);
            pushState(`Delete operation finished.`, {
                operation: `DeleteComplete()`,
                stateSummary: `Tree reorganized`,
                reason: `Recursion finished.`,
                result: `Layout recalculated.`,
                levels: {
                    beginner: `The deletion is complete and the tree re-balanced itself!`,
                    intermediate: `Structural operations fulfilled and rendering coordinates updated.`,
                    advanced: `Tree state finalized. Garbage Collection cleans up the unreferenced memory.`
                }
            });
        }
    });

    return states;
}
