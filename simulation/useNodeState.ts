import { useState, useCallback, useRef } from 'react';
import { GraphNode, GraphLink, NodeState, AttackType } from '../types';
import { INITIAL_NODES_COUNT, FREQUENCY_HOP_INTERVAL_MS } from '../constants';

// State Durations (ms)
const DURATION = {
    ANALYZING: 600,
    ROUTING: 600,
    HOPPING: 1500
};

const createInitialGraph = () => {
    // 1. Define Nodes
    const nodes: GraphNode[] = Array.from({ length: INITIAL_NODES_COUNT }, (_, i) => ({
        id: i === 0 ? 'SRC' : i === INITIAL_NODES_COUNT - 1 ? 'DST' : `N${i}`,
        type: i === 0 || i === INITIAL_NODES_COUNT - 1 ? 'source' : 'router',
        state: NodeState.IDLE,
        label: i === 0 ? 'SRC' : i === INITIAL_NODES_COUNT - 1 ? 'DST' : `R-${i}`
    }));

    const links: GraphLink[] = [];
    const addLink = (u: string, v: string) => {
        // Prevent duplicates
        if (!links.find(l => (l.source === u && l.target === v) || (l.target === u && l.source === v))) {
            links.push({
                source: u,
                target: v,
                frequency: 50,
                active: false,
                isCompromised: false
            });
        }
    };

    // 2. Define Layers for topology
    const layers = [
        [nodes[0]],
        nodes.slice(1, 5),
        nodes.slice(5, 10),
        nodes.slice(10, 14),
        [nodes[14]]
    ];

    // 3. Connect Layers (Feed-forward)
    for (let i = 0; i < layers.length - 1; i++) {
        const currentLayer = layers[i];
        const nextLayer = layers[i + 1];

        currentLayer.forEach(u => {
            const primaryTarget = nextLayer[Math.floor(Math.random() * nextLayer.length)];
            addLink(u.id, primaryTarget.id);

            const redundancy = 1 + Math.floor(Math.random() * 2);
            for(let r=0; r<redundancy; r++) {
                const randomTarget = nextLayer[Math.floor(Math.random() * nextLayer.length)];
                addLink(u.id, randomTarget.id);
            }
        });
    }

    // 4. Cross-connects within middle layers (Mesh effect)
    [1, 2, 3].forEach(layerIdx => {
        const layer = layers[layerIdx];
        for (let i = 0; i < layer.length - 1; i++) {
            if (Math.random() > 0.5) {
                addLink(layer[i].id, layer[i+1].id);
            }
        }
    });

    return { nodes, links };
};

export const useNodeState = () => {
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [frequency, setFrequency] = useState(50);

    // Initialize
    const initializeGraph = useCallback(() => {
        const { nodes: initialNodes, links: initialLinks } = createInitialGraph();
        setNodes(initialNodes);
        setLinks(initialLinks);
    }, []);

    const handlePacketArrival = useCallback((nodeId: string) => {
        setNodes(currentNodes => {
            const idx = currentNodes.findIndex(n => n.id === nodeId);
            if (idx === -1) return currentNodes;
            const node = currentNodes[idx];

            if (node.state === NodeState.COMPROMISED || node.state === NodeState.LOCKED) return currentNodes;
            if (node.state !== NodeState.IDLE && node.state !== NodeState.HOPPING) return currentNodes;

            const newNodes = [...currentNodes];
            newNodes[idx] = { ...node, state: NodeState.ANALYZING };

            setTimeout(() => {
                setNodes(n2 => {
                    const i2 = n2.findIndex(n => n.id === nodeId);
                    if (i2 === -1) return n2;
                    
                    if (n2[i2].state === NodeState.ANALYZING) {
                        const updated2 = [...n2];
                        updated2[i2] = { ...n2[i2], state: NodeState.ROUTING };

                        setTimeout(() => {
                            setNodes(n3 => {
                                const i3 = n3.findIndex(n => n.id === nodeId);
                                if (i3 === -1) return n3;
                                
                                if (n3[i3].state === NodeState.ROUTING) {
                                    const updated3 = [...n3];
                                    updated3[i3] = { ...n3[i3], state: NodeState.IDLE };
                                    return updated3;
                                }
                                return n3;
                            });
                        }, DURATION.ROUTING);

                        return updated2;
                    }
                    return n2;
                });
            }, DURATION.ANALYZING);

            return newNodes;
        });
    }, []);

    const updateFrequency = useCallback((mitigationStrength: number, attackType: AttackType) => {
        const newFreq = Math.floor(Math.random() * 100) + 88;
        setFrequency(newFreq);
        
        setNodes(ns => ns.map(n => {
            if (n.state === NodeState.COMPROMISED) {
                const baseRecovery = attackType === AttackType.HIJACKING ? 0.1 : 0.3;
                const chance = baseRecovery + (mitigationStrength * 0.6);
                
                if (Math.random() < chance) {
                    return { ...n, state: NodeState.HOPPING };
                }
                return n;
            }
            
            if (n.state === NodeState.IDLE) {
                return { ...n, state: NodeState.HOPPING };
            }
            
            return n;
        }));

        setTimeout(() => {
            setNodes(ns => ns.map(n => {
                if (n.state === NodeState.HOPPING) {
                    return { ...n, state: NodeState.IDLE };
                }
                return n;
            }));
        }, DURATION.HOPPING);

        setLinks(ls => ls.map(l => ({ ...l, frequency: newFreq })));
    }, []);

    return {
        nodes,
        setNodes,
        links,
        setLinks,
        frequency,
        initializeGraph,
        handlePacketArrival,
        updateFrequency
    };
};
