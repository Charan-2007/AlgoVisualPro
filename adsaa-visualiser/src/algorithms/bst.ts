import { VisualNode, EngineState, Operation } from './stack';

export interface TreeNode extends VisualNode {
    left?: TreeNode;
    right?: TreeNode;
    x: number;
    y: number;
}

export function executeBST(operations: Operation[]): EngineState[] {
    const states: EngineState[] = [];
    let root: TreeNode | undefined = undefined;
    let nextId = 0;
    let stepCount = 0;

    states.push({
        nodes: [],
        description: "Initial empty Binary Search Tree.",
        stepDetails: {
            step: stepCount++,
            operation: "Initialize",
            stateSummary: "Empty Tree",
            reason: "Setup the environment",
            result: "BST is ready.",
            levels: {
                beginner: "We start with an empty canvas. A tree grows from a single root.",
                intermediate: "A binary search tree reference is initialized to null.",
                advanced: "Root pointer is allocated. Time complexity O(1)."
            }
        }
    });

    // Helper to get all nodes array from the tree for rendering
    const getAllNodes = (node: TreeNode | undefined): TreeNode[] => {
        if (!node) return [];
        return [...getAllNodes(node.left), node, ...getAllNodes(node.right)];
    };

    // Helper to deeply copy tree for state snapshots
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

    const insert = (node: TreeNode | undefined, val: number, level: number, xStart: number, xEnd: number): TreeNode => {
        if (!node) {
            const newNode: TreeNode = {
                id: `node-${nextId++}`,
                value: val,
                state: 'active',
                x: (xStart + xEnd) / 2,
                y: level * 80 + 40
            };
            return newNode;
        }

        node.state = 'active';
        pushState(`Comparing ${val} with ${node.value}`, {
            operation: `Compare(${val}, ${node.value})`,
            stateSummary: `Evaluating Node ${node.value}`,
            reason: `Determining left or right traversal.`,
            result: `Value ${val} is ${val < Number(node.value) ? 'less' : (val > Number(node.value) ? 'greater' : 'equal')} than ${node.value}.`,
            levels: {
                beginner: `We are looking at ${node.value}. Since ${val} is ${val < Number(node.value) ? 'smaller' : 'larger'}, we will go ${val < Number(node.value) ? 'Left' : 'Right'}.`,
                intermediate: `BST Property: Left children are strictly less than the parent. Right children are strictly greater.`,
                advanced: `Comparison executes in O(1) time. Total search space halved at this depth level if tree is balanced.`
            }
        });

        if (val < Number(node.value)) {
            node.state = 'default';
            node.left = insert(node.left, val, level + 1, xStart, (xStart + xEnd) / 2);
        } else if (val > Number(node.value)) {
            node.state = 'default';
            node.right = insert(node.right, val, level + 1, (xStart + xEnd) / 2, xEnd);
        } else {
            // Already exists, just reset and return
            node.state = 'default';
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
                beginner: `We check if this node is what we are looking for.`,
                intermediate: `Following BST logic to traverse dynamically left or right.`,
                advanced: `Average Time Complexity in balanced BST is O(log N). Worst case O(N).`
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

    const findMin = (node: TreeNode): TreeNode => {
        let current = node;
        while (current.left) {
            current = current.left;
        }
        return current;
    };

    const deleteNode = (node: TreeNode | undefined, val: number): TreeNode | undefined => {
        if (!node) return undefined;

        node.state = 'active';
        pushState(`Looking for ${val} to delete, currently at ${node.value}`, {
            operation: `Find for Delete: ${val}`,
            stateSummary: `Traversing`,
            reason: `Locating node prior to removal.`,
            result: `Current node is ${node.value}.`,
            levels: {
                beginner: `Before removing ${val}, we first have to find it!`,
                intermediate: `Recursively searching for the target node using BST rules.`,
                advanced: `Search phase of delete operation runs in O(h) where h is tree height.`
            }
        });

        if (val < Number(node.value)) {
            node.state = 'default';
            node.left = deleteNode(node.left, val);
        } else if (val > Number(node.value)) {
            node.state = 'default';
            node.right = deleteNode(node.right, val);
        } else {
            // Node to delete found
            pushState(`Found node ${val} to delete.`, {
                operation: `Delete Target Found`,
                stateSummary: `Node isolated`,
                reason: `Equality match hit.`,
                result: `Proceeding with structural removal.`,
                levels: {
                    beginner: `We found the target! Now we remove it carefully to keep the tree structured.`,
                    intermediate: `Target identified. Now evaluating if it has 0, 1, or 2 children to determine deletion logic.`,
                    advanced: `Node isolated. Structural manipulation phase begins.`
                }
            });

            // Case 1: No child or 1 child
            if (!node.left) {
                return node.right;
            } else if (!node.right) {
                return node.left;
            }

            // Case 2: Two children
            pushState(`Node ${val} has two children. Finding inorder successor.`, {
                operation: `Handle 2 Children`,
                stateSummary: `Finding Successor`,
                reason: `Complex deletion requires replacing value.`,
                result: `Traversing right subtree for minimum value.`,
                levels: {
                    beginner: `Because this node has two branches below it, we must replace it with the smallest number in its right branch to keep things ordered.`,
                    intermediate: `Node has two children. The inorder successor (smallest node in the right subtree) will replace this node's value.`,
                    advanced: `Finding inorder successor: findMin(node.right). This guarantees the BST properties are maintained.`
                }
            });
            const successor = findMin(node.right);

            // Highlight successor
            const origState = successor.state;
            successor.state = 'active';
            pushState(`Found inorder successor ${successor.value}. Replacing value.`, {
                operation: `Swap & Recurse`,
                stateSummary: `Value swapped`,
                reason: `Successor value takes over deleted node's position.`,
                result: `Values swapped. Old successor node will now be deleted.`,
                levels: {
                    beginner: `We swap the number with ${successor.value}, and then delete the old copy of ${successor.value}.`,
                    intermediate: `The successor's value replaces the target node. We then recursively delete the successor from the right subtree.`,
                    advanced: `Value copied. Delete is recursively called on the right child to remove the duplicate leaf/1-child node.`
                }
            });
            successor.state = origState;

            node.value = successor.value;
            node.state = 'default';
            node.right = deleteNode(node.right, Number(successor.value));
        }

        return node;
    };

    // A simple function to recalculate positions after delete to keep tree looking nice
    const recalcPositions = (node: TreeNode | undefined, level: number, xStart: number, xEnd: number) => {
        if (!node) return;
        node.x = (xStart + xEnd) / 2;
        node.y = level * 80 + 40;
        recalcPositions(node.left, level + 1, xStart, node.x);
        recalcPositions(node.right, level + 1, node.x, xEnd);
    };

    operations.forEach(op => {
        if (op.type === 'insert') {
            const val = op.value!;
            pushState(`Inserting value ${val} into the BST.`, {
                operation: `Insert(${val}) Init`,
                stateSummary: `Starting Insertion`,
                reason: `User requested to insert ${val}.`,
                result: `Traversing from Root.`,
                levels: {
                    beginner: `We want to add a new number ${val} to the tree. We always start at the top root!`,
                    intermediate: `Initializing recursive insertion starting from the root node.`,
                    advanced: `Insert operation called. Space complexity O(N).`
                }
            });
            root = insert(root, val, 0, 0, 800);
            resetStates(root);
            pushState(`Value ${val} inserted.`, {
                operation: `Insert(${val}) Complete`,
                stateSummary: `Node Attached`,
                reason: `Leaf spot was found.`,
                result: `Tree expanded.`,
                levels: {
                    beginner: `The number found its correct empty spot and grew as a new leaf!`,
                    intermediate: `The tree structurally updated with a newly allocated leaf node.`,
                    advanced: `Pointer updated in parent frame. Recursion unrolls.`
                }
            });
        } else if (op.type === 'find') {
            const val = op.value!;
            const found = find(root, val);
            if (!found) {
                pushState(`Value ${val} not found in the BST.`, {
                    operation: `Find() Miss`,
                    stateSummary: `Value Absent`,
                    reason: `Reached a null pointer.`,
                    result: `Return false.`,
                    levels: {
                        beginner: `We looked down the branches but couldn't find ${val} anywhere.`,
                        intermediate: `The traversal hit a null reference, confirming the value does not exist.`,
                        advanced: `Search exhausted. Worst case O(N) in a skewed tree.`
                    }
                });
            }
            resetStates(root);
        } else if (op.type === 'delete') {
            const val = op.value!;
            pushState(`Deleting value ${val} from the BST.`, {
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
                    beginner: `The deletion is complete and the tree was neatly reorganized!`,
                    intermediate: `Structural operations fulfilled and rendering coordinates updated.`,
                    advanced: `Tree state finalized. Garbage Collection cleans up the unreferenced memory.`
                }
            });
        }
    });


    return states;
}
