import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GraphNode, GraphLink, AttackType, NodeState, LogEntry } from '../types';
import { generateSystemAnalysis } from '../services/geminiService';

export const useAttackSimulation = (
    nodes: GraphNode[],
    setNodes: React.Dispatch<React.SetStateAction<GraphNode[]>>,
    setLinks: React.Dispatch<React.SetStateAction<GraphLink[]>>,
    frequency: number,
    addLog: (source: LogEntry['source'], message: string, type: LogEntry['type']) => void
) => {
    const [attackType, setAttackType] = useState<AttackType>(AttackType.NONE);
    const [mitigationStrength, setMitigationStrength] = useState(0);

    const toggleAttack = useCallback((type: AttackType) => {
        if (attackType === type) {
            setAttackType(AttackType.NONE);
            addLog('ATTACK_SIM', `Stopped ${type} simulation.`, 'info');
        } else {
            setAttackType(type);
            addLog('ATTACK_SIM', `Injecting ${type} vector...`, 'error');
        }
    }, [attackType, addLog]);

    // AI Analysis & Mitigation Adaptation
    useEffect(() => {
        if (attackType !== AttackType.NONE) {
            const compromisedCount = nodes.filter(n => n.state === NodeState.COMPROMISED).length;
            addLog('AI_KERNEL', `Detecting ${attackType} signature. Initiating adaptive mitigation...`, 'warning');

            setMitigationStrength(0.2);
            const adaptationInterval = setInterval(() => {
                setMitigationStrength(prev => Math.min(prev + 0.15, 0.95));
            }, 2000);

            generateSystemAnalysis(attackType, nodes.length, compromisedCount, frequency)
                .then(analysis => addLog('AI_KERNEL', analysis, 'success'))
                .catch(() => addLog('SYSTEM', 'AI Intelligence unavailable.', 'error'));

            return () => clearInterval(adaptationInterval);
        } else {
            addLog('SYSTEM', 'Threat levels nominal. Monitoring traffic.', 'info');
            setMitigationStrength(0);
        }
    }, [attackType, frequency, addLog]);

    const prevCompromisedCount = useRef<number>(0);

    // Reactive AI Analysis on Node Compromise
    useEffect(() => {
        const currentCompromisedCount = nodes.filter(n => n.state === NodeState.COMPROMISED).length;

        if (currentCompromisedCount > prevCompromisedCount.current && attackType !== AttackType.NONE) {
            generateSystemAnalysis(attackType, nodes.length, currentCompromisedCount, frequency)
                .then(analysis => addLog('AI_KERNEL', analysis, 'warning'))
                .catch(() => { });
        }

        prevCompromisedCount.current = currentCompromisedCount;
    }, [nodes, attackType, frequency, addLog]);

    // Attack Simulation Loop
    useEffect(() => {
        if (attackType === AttackType.NONE) {
            setNodes(ns => ns.map(n => ({ ...n, state: n.state === NodeState.COMPROMISED ? NodeState.IDLE : n.state })));
            setLinks(ls => ls.map(l => ({ ...l, isCompromised: false })));
            return;
        }

        const interval = setInterval(() => {
            setNodes(currentNodes => {
                const newNodes = [...currentNodes];
                const attackCount = attackType === AttackType.HIJACKING ? 2 : 1;

                for (let i = 0; i < attackCount; i++) {
                    const victimIdx = Math.floor(Math.random() * newNodes.length);
                    const victim = newNodes[victimIdx];

                    if (victim.id !== 'SRC' && victim.id !== 'DST' && victim.state !== NodeState.LOCKED && victim.state !== NodeState.COMPROMISED) {
                        newNodes[victimIdx] = { ...victim, state: NodeState.COMPROMISED };
                    }
                }
                return newNodes;
            });

            setLinks(currentLinks => currentLinks.map(l => {
                if (Math.random() > 0.9) return { ...l, isCompromised: true };
                return l;
            }));

        }, 2000);

        return () => clearInterval(interval);
    }, [attackType, setNodes, setLinks]);

    return {
        attackType,
        mitigationStrength,
        toggleAttack
    };
};
