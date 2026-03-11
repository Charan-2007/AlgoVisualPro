export type NodeState = 'default' | 'active' | 'done';

export interface VisualNode {
    id: string;
    value: string | number;
    label?: string;
    state: NodeState;
}

export interface StepDetails {
    step: number;
    operation: string;
    stateSummary: string;
    reason: string;
    result: string;
    levels: {
        beginner: string;
        intermediate: string;
        advanced: string;
    };
}

export interface EngineState {
    nodes: VisualNode[];
    edges?: any[];
    description: string;
    stepDetails?: StepDetails;
    operationsCount?: number;
    currentCost?: number | string;
    bestCost?: number | string;
    aiExplanation?: string;
}

export interface Operation {
    type: string;
    value?: number;
    target?: number;
    weight?: number;
}


export type AlgorithmGenerator = Generator<EngineState, void, unknown>;

export function executeStack(operations: Operation[]): EngineState[] {
    const states: EngineState[] = [];
    let currentNodes: VisualNode[] = [];
    let stepCount = 0;

    states.push({
        nodes: [],
        description: "Initial empty stack.",
        stepDetails: {
            step: stepCount++,
            operation: "Initialize",
            stateSummary: "Empty Stack",
            reason: "Setup the environment",
            result: "Stack is ready for operations.",
            levels: {
                beginner: "We start with an empty stack, ready to hold items.",
                intermediate: "The stack data structure is initialized with size 0.",
                advanced: "Memory is allocated for the stack container. Top pointer is conceptually at -1."
            }
        }
    });

    operations.forEach((op, idx) => {
        if (op.type === 'push' || op.type === 'insert') {
            const val = op.value!;
            currentNodes = [...currentNodes, { id: `node-${idx}`, value: val, state: 'active' }];
            states.push({
                nodes: [...currentNodes],
                description: `Pushing element ${val} onto the stack.`,
                stepDetails: {
                    step: stepCount++,
                    operation: `Push(${val})`,
                    stateSummary: `Pushing ${val}`,
                    reason: `User requested to push ${val} onto the stack.`,
                    result: `${val} is being added to the top of the stack.`,
                    levels: {
                        beginner: `We are placing the number ${val} onto the top of our stack, like adding a plate to a pile.`,
                        intermediate: `The new element ${val} becomes the new 'top' of the stack following LIFO (Last-In-First-Out) order.`,
                        advanced: `Operation Push(${val}) runs. The stack pointer is incremented and the value is stored at the new pointer index. Time complexity is O(1).`
                    }
                }
            });
            // reset state after push
            currentNodes[currentNodes.length - 1].state = 'default';
            states.push({
                nodes: [...currentNodes],
                description: `Element ${val} added successfully.`,
                stepDetails: {
                    step: stepCount++,
                    operation: `Push(${val}) Complete`,
                    stateSummary: `Added ${val}`,
                    reason: `Finished pushing ${val}.`,
                    result: `Stack size is now ${currentNodes.length}.`,
                    levels: {
                        beginner: `The number ${val} is now securely on top of the stack.`,
                        intermediate: `The item has been successfully added to the top of the LIFO structure.`,
                        advanced: `Push operation complete. The state has been updated. Space complexity is O(N).`
                    }
                }
            });
        } else if (op.type === 'pop' || op.type === 'delete') {
            if (currentNodes.length > 0) {
                const popppedVal = currentNodes[currentNodes.length - 1].value;
                currentNodes[currentNodes.length - 1].state = 'active';
                states.push({
                    nodes: [...currentNodes],
                    description: `Preparing to pop element ${popppedVal}.`,
                    stepDetails: {
                        step: stepCount++,
                        operation: `Pop()`,
                        stateSummary: `Popping top element`,
                        reason: `User requested to remove the top element.`,
                        result: `Element ${popppedVal} is identified for removal.`,
                        levels: {
                            beginner: `We are looking at the top item (${popppedVal}) and getting ready to remove it, like taking the top plate off a pile.`,
                            intermediate: `Following LIFO order, the most recently added item (${popppedVal}) will be removed first.`,
                            advanced: `Operation Pop() runs. We peek at the top element ${popppedVal}. Time complexity for peek is O(1).`
                        }
                    }
                });

                currentNodes = currentNodes.slice(0, -1);
                states.push({
                    nodes: [...currentNodes],
                    description: `Element popped from the stack.`,
                    stepDetails: {
                        step: stepCount++,
                        operation: `Pop() Complete`,
                        stateSummary: `Removed ${popppedVal}`,
                        reason: `Finished popping the top element.`,
                        result: `Element ${popppedVal} has been removed. Stack size is now ${currentNodes.length}.`,
                        levels: {
                            beginner: `The top item has been taken off the stack.`,
                            intermediate: `The element has been removed from the top of the LIFO structure.`,
                            advanced: `Pop operation complete. The stack pointer is decremented. Time complexity is O(1).`
                        }
                    }
                });
            }
        }
    });

    return states;
}
