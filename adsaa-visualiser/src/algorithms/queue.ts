import { VisualNode, EngineState, Operation } from './stack';

export function executeQueue(operations: Operation[]): EngineState[] {
    const states: EngineState[] = [];
    let currentNodes: VisualNode[] = [];
    let stepCount = 0;

    states.push({
        nodes: [],
        description: "Initial empty queue.",
        stepDetails: {
            step: stepCount++,
            operation: "Initialize",
            stateSummary: "Empty Queue",
            reason: "Setup the environment",
            result: "Queue is ready for operations.",
            levels: {
                beginner: "We start with an empty line, ready for items to join.",
                intermediate: "The queue data structure is initialized with size 0.",
                advanced: "Queue memory is allocated. Both front and rear pointers conceptually point nowhere initially."
            }
        }
    });

    operations.forEach((op, idx) => {
        if (op.type === 'enqueue' || op.type === 'insert') {
            const val = op.value!;
            currentNodes = [...currentNodes, { id: `node-${idx}`, value: val, state: 'active' }];
            states.push({
                nodes: [...currentNodes],
                description: `Enqueueing element ${val} at the back of the queue.`,
                stepDetails: {
                    step: stepCount++,
                    operation: `Enqueue(${val})`,
                    stateSummary: `Adding ${val} to back`,
                    reason: `User requested to join the queue.`,
                    result: `${val} is placed at the very end of the line.`,
                    levels: {
                        beginner: `We are adding the number ${val} to the back of the line.`,
                        intermediate: `The new element ${val} enters the back of the queue following FIFO (First-In-First-Out) order.`,
                        advanced: `Operation Enqueue(${val}) executes. The rear pointer is incremented. Time complexity is O(1).`
                    }
                }
            });
            // reset state after enqueue
            currentNodes[currentNodes.length - 1].state = 'default';
            states.push({
                nodes: [...currentNodes],
                description: `Element ${val} added successfully.`,
                stepDetails: {
                    step: stepCount++,
                    operation: `Enqueue(${val}) Complete`,
                    stateSummary: `Added ${val}`,
                    reason: `Finished enqueueing ${val}.`,
                    result: `Queue size is now ${currentNodes.length}.`,
                    levels: {
                        beginner: `The number ${val} is now waiting in line.`,
                        intermediate: `The item is successfully enqueued at the rear.`,
                        advanced: `Enqueue operation finished. Structural state updated. Space complexity is O(N).`
                    }
                }
            });
        } else if (op.type === 'dequeue' || op.type === 'delete') {
            if (currentNodes.length > 0) {
                const dqVal = currentNodes[0].value;
                // Find the first node (front of queue) to dequeue
                const activeNodes = currentNodes.map((n, i) =>
                    i === 0 ? { ...n, state: 'active' as const } : n
                );
                states.push({
                    nodes: activeNodes,
                    description: `Preparing to dequeue element ${dqVal} from the front.`,
                    stepDetails: {
                        step: stepCount++,
                        operation: `Dequeue()`,
                        stateSummary: `Identifying front element`,
                        reason: `User requested to remove the front element.`,
                        result: `Element ${dqVal} is identified for removal.`,
                        levels: {
                            beginner: `We are looking at the person at the very front of the line (${dqVal}) who is next to be served.`,
                            intermediate: `Following FIFO order, the oldest item (${dqVal}) will be removed first.`,
                            advanced: `Operation Dequeue() runs. We peek at the head pointer element ${dqVal}. Time complexity for peek is O(1).`
                        }
                    }
                });

                // Remove the first element
                currentNodes = currentNodes.slice(1);
                states.push({
                    nodes: [...currentNodes],
                    description: `Element dequeued from the queue.`,
                    stepDetails: {
                        step: stepCount++,
                        operation: `Dequeue() Complete`,
                        stateSummary: `Removed ${dqVal}`,
                        reason: `Finished dequeueing the front element.`,
                        result: `Element ${dqVal} has been removed. Queue size is now ${currentNodes.length}.`,
                        levels: {
                            beginner: `The first item in line was served and has left the queue.`,
                            intermediate: `The element has been removed from the front of the FIFO structure.`,
                            advanced: `Dequeue operation complete. The head pointer shifts forward. Time complexity is O(1).`
                        }
                    }
                });
            }
        }
    });

    return states;
}
