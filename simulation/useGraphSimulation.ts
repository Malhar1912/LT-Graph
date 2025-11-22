import { useState, useEffect, useCallback, useRef } from 'react';
import { GraphNode, GraphLink, Packet, NodeState, AttackType, LogEntry } from '../types';
import { INITIAL_NODES_COUNT, FREQUENCY_HOP_INTERVAL_MS } from '../constants';
import { generateSystemAnalysis } from '../services/geminiService';

// Helper to handle d3 object vs string id references
const getId = (n: string | GraphNode): string => {
    if (typeof n === 'string') return n;
    return n.id;
};

// State Durations (ms)
const DURATION = {
    ANALYZING: 600,
    ROUTING: 600,
    HOPPING: 1500
};

const createInitialGraph = () => {
    // 1. Define Nodes
    // We'll organize them into a logical grid for connections: 
    // SRC -> Column 1 (4 nodes) -> Column 2 (5 nodes) -> Column 3 (4 nodes) -> DST
    // Total 1 + 4 + 5 + 4 + 1 = 15 nodes.
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
    // Layer 0: [SRC] (Node 0)
    // Layer 1: [N1, N2, N3, N4]
    // Layer 2: [N5, N6, N7, N8, N9]
    // Layer 3: [N10, N11, N12, N13]
    // Layer 4: [DST] (Node 14)
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

        // Connect each node in current layer to 1-3 nodes in next layer
        currentLayer.forEach(u => {
            // Ensure at least one connection forward
            const primaryTarget = nextLayer[Math.floor(Math.random() * nextLayer.length)];
            addLink(u.id, primaryTarget.id);

            // Add redundant connections
            const redundancy = 1 + Math.floor(Math.random() * 2); // 1 or 2 extra
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
            // Connect to neighbor in same column occasionally
            if (Math.random() > 0.5) {
                addLink(layer[i].id, layer[i+1].id);
            }
        }
    });

    return { nodes, links };
};

export const useGraphSimulation = () => {
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [packets, setPackets] = useState<Packet[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [attackType, setAttackType] = useState<AttackType>(AttackType.NONE);
    const [frequency, setFrequency] = useState(50);
    const [mitigationStrength, setMitigationStrength] = useState(0); // 0.0 to 1.0, represents AI adaptation
    
    const simulationRef = useRef<number>(0);
    const prevCompromisedCount = useRef<number>(0);

    // Initialize
    useEffect(() => {
        const { nodes: initialNodes, links: initialLinks } = createInitialGraph();
        setNodes(initialNodes);
        setLinks(initialLinks);
        addLog('SYSTEM', 'Graph topology initialized. Lamarr-Turing Kernel active.', 'info');
    }, []);

    const addLog = useCallback((source: LogEntry['source'], message: string, type: LogEntry['type']) => {
        setLogs(prev => {
            const newLog: LogEntry = { id: Date.now().toString() + Math.random(), timestamp: new Date(), source, message, type };
            return [...prev.slice(-49), newLog];
        });
    }, []);

    // ----------------------------------------------------------
    // Node State Machine Logic
    // ----------------------------------------------------------

    const handlePacketArrival = useCallback((nodeId: string) => {
        setNodes(currentNodes => {
            const idx = currentNodes.findIndex(n => n.id === nodeId);
            if (idx === -1) return currentNodes;
            const node = currentNodes[idx];

            // Guard: Only accept packets if IDLE or HOPPING (and not compromised)
            // HOPPING nodes are technically "busy" moving freq, but we allow them to queue analysis for gameplay fluidity
            if (node.state === NodeState.COMPROMISED || node.state === NodeState.LOCKED) return currentNodes;
            if (node.state !== NodeState.IDLE && node.state !== NodeState.HOPPING) return currentNodes;

            // TRANSITION 1: IDLE/HOPPING -> ANALYZING
            const newNodes = [...currentNodes];
            newNodes[idx] = { ...node, state: NodeState.ANALYZING };

            // Schedule TRANSITION 2: ANALYZING -> ROUTING
            setTimeout(() => {
                setNodes(n2 => {
                    const i2 = n2.findIndex(n => n.id === nodeId);
                    if (i2 === -1) return n2;
                    
                    // Guard: Only proceed if still ANALYZING (not compromised during wait)
                    if (n2[i2].state === NodeState.ANALYZING) {
                        const updated2 = [...n2];
                        updated2[i2] = { ...n2[i2], state: NodeState.ROUTING };

                        // Schedule TRANSITION 3: ROUTING -> IDLE
                        setTimeout(() => {
                            setNodes(n3 => {
                                const i3 = n3.findIndex(n => n.id === nodeId);
                                if (i3 === -1) return n3;
                                
                                // Guard: Only return to IDLE if still ROUTING
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

    // ----------------------------------------------------------
    // Effects
    // ----------------------------------------------------------

    // AI Analysis & Mitigation Adaptation
    useEffect(() => {
        if (attackType !== AttackType.NONE) {
            const compromisedCount = nodes.filter(n => n.state === NodeState.COMPROMISED).length;
            addLog('AI_KERNEL', `Detecting ${attackType} signature. Initiating adaptive mitigation...`, 'warning');
            
            // Reset strength on new attack, then grow it
            setMitigationStrength(0.2);
            const adaptationInterval = setInterval(() => {
                setMitigationStrength(prev => Math.min(prev + 0.15, 0.95));
            }, 2000);

            // Initial Query Gemini
            generateSystemAnalysis(attackType, nodes.length, compromisedCount, frequency)
                .then(analysis => addLog('AI_KERNEL', analysis, 'success'))
                .catch(() => addLog('SYSTEM', 'AI Intelligence unavailable.', 'error'));

            return () => clearInterval(adaptationInterval);
        } else {
             addLog('SYSTEM', 'Threat levels nominal. Monitoring traffic.', 'info');
             setMitigationStrength(0);
        }
    }, [attackType]);

    // Reactive AI Analysis on Node Compromise
    useEffect(() => {
        const currentCompromisedCount = nodes.filter(n => n.state === NodeState.COMPROMISED).length;

        // Trigger AI analysis if the number of compromised nodes has increased
        if (currentCompromisedCount > prevCompromisedCount.current && attackType !== AttackType.NONE) {
             generateSystemAnalysis(attackType, nodes.length, currentCompromisedCount, frequency)
                .then(analysis => addLog('AI_KERNEL', analysis, 'warning'))
                .catch(() => {}); // Silent fail to avoid log spam
        }
        
        prevCompromisedCount.current = currentCompromisedCount;
    }, [nodes, attackType, frequency, addLog]);

    // Attack Simulation Loop
    useEffect(() => {
        if (attackType === AttackType.NONE) {
            // Reset graph health
            setNodes(ns => ns.map(n => ({ ...n, state: n.state === NodeState.COMPROMISED ? NodeState.IDLE : n.state })));
            setLinks(ls => ls.map(l => ({ ...l, isCompromised: false })));
            return;
        }

        const interval = setInterval(() => {
            // Compromise Nodes
            setNodes(currentNodes => {
                const newNodes = [...currentNodes];
                // Attack intensity depends on type
                const attackCount = attackType === AttackType.HIJACKING ? 2 : 1;
                
                for(let i=0; i<attackCount; i++) {
                    const victimIdx = Math.floor(Math.random() * newNodes.length);
                    const victim = newNodes[victimIdx];
                    
                    // Attack logic: Can interrupt ANALYZING or ROUTING
                    if (victim.id !== 'SRC' && victim.id !== 'DST' && victim.state !== NodeState.LOCKED && victim.state !== NodeState.COMPROMISED) {
                        newNodes[victimIdx] = { ...victim, state: NodeState.COMPROMISED };
                    }
                }
                return newNodes;
            });
            
            // Compromise Links
            setLinks(currentLinks => currentLinks.map(l => {
                if (Math.random() > 0.9) return { ...l, isCompromised: true };
                return l;
            }));

        }, 2000);

        return () => clearInterval(interval);
    }, [attackType]);

    // Lamarr Frequency Hopping & Mitigation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const newFreq = Math.floor(Math.random() * 100) + 88; // 88-188 MHz range simulation
            setFrequency(newFreq);
            
            setNodes(ns => ns.map(n => {
                // 1. Mitigation: COMPROMISED -> HOPPING
                if (n.state === NodeState.COMPROMISED) {
                    // Recovery chance increases with mitigationStrength (AI adaptation)
                    const baseRecovery = attackType === AttackType.HIJACKING ? 0.1 : 0.3;
                    const chance = baseRecovery + (mitigationStrength * 0.6);
                    
                    if (Math.random() < chance) {
                        return { ...n, state: NodeState.HOPPING };
                    }
                    return n;
                }
                
                // 2. Synchronization: IDLE -> HOPPING
                if (n.state === NodeState.IDLE) {
                    return { ...n, state: NodeState.HOPPING };
                }
                
                // 3. Active nodes (ROUTING/ANALYZING) stay locked on old frequency for a moment 
                // to finish tasks, effectively ignoring the hop until they return to IDLE.
                return n;
            }));

            // Settle: HOPPING -> IDLE
            setTimeout(() => {
                setNodes(ns => ns.map(n => {
                    if (n.state === NodeState.HOPPING) {
                        return { ...n, state: NodeState.IDLE };
                    }
                    return n;
                }));
            }, DURATION.HOPPING);

            // Update Links
            setLinks(ls => ls.map(l => ({ ...l, frequency: newFreq })));
            
        }, FREQUENCY_HOP_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [attackType, mitigationStrength]);

    // Packet Movement Loop
    useEffect(() => {
        const tick = () => {
            setPackets(prevPackets => {
                const nextPackets: Packet[] = [];
                
                prevPackets.forEach(p => {
                    let newProgress = p.progress + 0.015;
                    
                    if (newProgress >= 1) {
                        // Packet Reached Destination
                        handlePacketArrival(p.targetId);
                        // Packet consumed
                    } else {
                        nextPackets.push({ ...p, progress: newProgress });
                    }
                });

                // Spawn new packets
                if (Math.random() < 0.06) {
                    const activeLinks = links; 
                    if (activeLinks.length > 0) {
                        const l = activeLinks[Math.floor(Math.random() * activeLinks.length)];
                        const sId = getId(l.source);
                        const tId = getId(l.target);
                        
                        // Only spawn if source is not compromised
                        const sourceNode = nodes.find(n => n.id === sId);
                        if (sourceNode && sourceNode.state !== NodeState.COMPROMISED) {
                            nextPackets.push({
                                id: Math.random().toString(36),
                                sourceId: sId,
                                targetId: tId,
                                currentEdgeId: `${sId}-${tId}`,
                                progress: 0,
                                data: 'ENC',
                                isEncrypted: !l.isCompromised
                            });
                        }
                    }
                }
                
                return nextPackets;
            });

            simulationRef.current = requestAnimationFrame(tick);
        };

        simulationRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(simulationRef.current);
    }, [links, nodes, handlePacketArrival]);

    const toggleAttack = (type: AttackType) => {
        if (attackType === type) {
            setAttackType(AttackType.NONE);
            addLog('ATTACK_SIM', `Stopped ${type} simulation.`, 'info');
        } else {
            setAttackType(type);
            addLog('ATTACK_SIM', `Injecting ${type} vector...`, 'error');
        }
    };

    return {
        nodes,
        links,
        packets,
        logs,
        attackType,
        frequency,
        toggleAttack
    };
};