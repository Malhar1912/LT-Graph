import { useState, useEffect, useRef, useCallback } from 'react';
import { GraphNode, GraphLink, Packet, NodeState } from '../types';

// Helper to handle d3 object vs string id references
const getId = (n: string | GraphNode): string => {
    if (typeof n === 'string') return n;
    return n.id;
};

export const usePacketSystem = (
    nodes: GraphNode[],
    links: GraphLink[],
    onPacketArrival: (nodeId: string) => void
) => {
    const [packets, setPackets] = useState<Packet[]>([]);
    const simulationRef = useRef<number>(0);

    const tick = useCallback(() => {
        setPackets(prevPackets => {
            const nextPackets: Packet[] = [];

            prevPackets.forEach(p => {
                let newProgress = p.progress + 0.015;

                if (newProgress >= 1) {
                    // Packet Reached Destination
                    onPacketArrival(p.targetId);
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
    }, [nodes, links, onPacketArrival]);

    useEffect(() => {
        simulationRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(simulationRef.current);
    }, [tick]);

    return { packets };
};
