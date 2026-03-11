import { VisualNode, EngineState, Operation } from './stack';

export function executeLinkedList(operations: Operation[]): EngineState[] {
    const states: EngineState[] = [];
    let currentNodes: VisualNode[] = [];
    let stepCount = 0;

    states.push({
        nodes: [],
        description: "Initial empty Linked List.",
        stepDetails: {
            step: stepCount++,
            operation: "Initialize",
            stateSummary: "Empty Head",
            reason: "Setup the environment",
            result: "Linked List is ready.",
            levels: {
                beginner: "We start with a totally empty chain, with no links yet.",
                intermediate: "A raw linked list structure without any nodes is created.",
                advanced: "The head pointer is initialized to null."
            }
        }
    });

    operations.forEach((op, idx) => {
        if (op.type === 'insert') {
            const val = op.value!;
            states.push({
                nodes: [...currentNodes],
                description: `Creating new node with value ${val}`,
                stepDetails: {
                    step: stepCount++,
                    operation: `alloc Node(${val})`,
                    stateSummary: `Node created`,
                    reason: `User requested to insert ${val}.`,
                    result: `Node ${val} exists but is not yet attached.`,
                    levels: {
                        beginner: `We built a new chain link carrying the number ${val}.`,
                        intermediate: `A new list node containing the value ${val} is allocated in memory.`,
                        advanced: `Node instantiation complete. The next pointer of this unattached node is null.`
                    }
                }
            });

            currentNodes = [...currentNodes, { id: `node-${idx}`, value: val, state: 'active' }];
            states.push({
                nodes: [...currentNodes],
                description: `Inserting node ${val} at the end of the list.`,
                stepDetails: {
                    step: stepCount++,
                    operation: `InsertTail(${val})`,
                    stateSummary: `Traversing & Attaching`,
                    reason: `Linking the new node.`,
                    result: `The node is appended to the tail.`,
                    levels: {
                        beginner: `We found the end of the chain and attached our new link ${val} to it.`,
                        intermediate: `The previous tail's 'next' reference now points to this newly created node.`,
                        advanced: `Since we don't maintain a tail pointer here, we implicitly traverse O(N) to attach the node. Alternatively, with a tail pointer, this is O(1).`
                    }
                }
            });

            currentNodes[currentNodes.length - 1].state = 'default';
            states.push({
                nodes: [...currentNodes],
                description: `Node connected successfully.`,
                stepDetails: {
                    step: stepCount++,
                    operation: `InsertComplete()`,
                    stateSummary: `Tail attached`,
                    reason: `Finished insertion phase.`,
                    result: `The list has grown by 1 element.`,
                    levels: {
                        beginner: `The chain is fully secured!`,
                        intermediate: `The linked list insertion operation has successfully concluded.`,
                        advanced: `State committed. Space complexity increases by O(1) node.`
                    }
                }
            });

        } else if (op.type === 'delete') {
            if (currentNodes.length > 0) {
                // Find last node to delete
                const activeNodes = currentNodes.map((n, i) =>
                    i === currentNodes.length - 1 ? { ...n, state: 'active' as const } : n
                );
                const rmVal = currentNodes[currentNodes.length - 1].value;
                states.push({
                    nodes: activeNodes,
                    description: `Traversing to find the last node to delete.`,
                    stepDetails: {
                        step: stepCount++,
                        operation: `PopTail()`,
                        stateSummary: `Isolating Tail`,
                        reason: `User requested a deletion from the list end.`,
                        result: `Identified ${rmVal} as the tail.`,
                        levels: {
                            beginner: `We walked all the way to the end of the chain to find the last link (${rmVal}).`,
                            intermediate: `Traversed the linked list to locate the final node and its preceding parent node.`,
                            advanced: `Traversing requires O(N) time since finding the second-to-last node requires scanning from the head.`
                        }
                    }
                });

                // Remove the last element
                currentNodes = currentNodes.slice(0, -1);
                states.push({
                    nodes: [...currentNodes],
                    description: `Tail node deleted from the list.`,
                    stepDetails: {
                        step: stepCount++,
                        operation: `Delete() Complete`,
                        stateSummary: `Severing link`,
                        reason: `Removing the identified tail node.`,
                        result: `Node ${rmVal} is unlinked and garbage collected.`,
                        levels: {
                            beginner: `The last link in the chain was broken and removed.`,
                            intermediate: `The penultimate node's next pointer was set to null, dereferencing the tail.`,
                            advanced: `Garbage collector will free the unreferenced memory. Time complexity O(N).`
                        }
                    }
                });
            }
        } else if (op.type === 'find') {
            const findVal = op.value!;
            let found = false;
            for (let i = 0; i < currentNodes.length; i++) {
                const searchNodes = currentNodes.map((n, idx) => idx === i ? { ...n, state: 'active' as const } : n);
                states.push({
                    nodes: searchNodes,
                    description: `Searching for ${findVal}, looking at node with value ${currentNodes[i].value}...`,
                    stepDetails: {
                        step: stepCount++,
                        operation: `Search(${findVal})`,
                        stateSummary: `Evaluating Node`,
                        reason: `Traversing to locate target.`,
                        result: `Current node is ${currentNodes[i].value}.`,
                        levels: {
                            beginner: `Looking at this specific link to see if it holds ${findVal}.`,
                            intermediate: `Comparing the current node's value against the search target ${findVal}.`,
                            advanced: `Evaluation step in an O(N) linear search traversal.`
                        }
                    }
                });
                if (currentNodes[i].value === findVal || String(currentNodes[i].value) === String(findVal)) {
                    found = true;
                    states.push({
                        nodes: currentNodes.map((n, idx) => idx === i ? { ...n, state: 'done' as const } : n),
                        description: `Found value ${findVal}!`,
                        stepDetails: {
                            step: stepCount++,
                            operation: `Match()`,
                            stateSummary: `Target isolated`,
                            reason: `The condition node.value == target evaluated true.`,
                            result: `Search terminates early.`,
                            levels: {
                                beginner: `We found it! The chain link matches our target.`,
                                intermediate: `The linear search has successfully located the node.`,
                                advanced: `Search completes in O(K) where K is the target's depth index.`
                            }
                        }
                    });
                    break;
                }
            }
            if (!found) {
                states.push({
                    nodes: [...currentNodes],
                    description: `Value ${findVal} not found in the list.`,
                    stepDetails: {
                        step: stepCount++,
                        operation: `EOF Reached`,
                        stateSummary: `Value absent`,
                        reason: `Traversed entire list without matches.`,
                        result: `Return null / false.`,
                        levels: {
                            beginner: `We looked at every single link, but ${findVal} isn't here.`,
                            intermediate: `The traversal reached the null tail without any successful equality comparisons.`,
                            advanced: `Worst-case O(N) linear search completed unsuccessfully.`
                        }
                    }
                });
            }
        }
    });

    return states;
}
