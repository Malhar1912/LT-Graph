import { useState, useEffect, useCallback } from 'react';
import { LogEntry } from '../types';
import { FREQUENCY_HOP_INTERVAL_MS } from '../constants';
import { useNodeState } from './useNodeState';
import { usePacketSystem } from './usePacketSystem';
import { useAttackSimulation } from './useAttackSimulation';

export const useGraphSimulation = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = useCallback((source: LogEntry['source'], message: string, type: LogEntry['type']) => {
        setLogs(prev => {
            const newLog: LogEntry = { id: Date.now().toString() + Math.random(), timestamp: new Date(), source, message, type };
            return [...prev.slice(-49), newLog];
        });
    }, []);

    const {
        nodes, setNodes, links, setLinks, frequency,
        initializeGraph, handlePacketArrival, updateFrequency
    } = useNodeState();

    const {
        attackType, mitigationStrength, toggleAttack
    } = useAttackSimulation(nodes, setNodes, setLinks, frequency, addLog);

    const { packets } = usePacketSystem(nodes, links, handlePacketArrival);

    // Initialize
    useEffect(() => {
        initializeGraph();
        addLog('SYSTEM', 'Graph topology initialized. Lamarr-Turing Kernel active.', 'info');
    }, [initializeGraph, addLog]);

    // Frequency Hopping Loop
    useEffect(() => {
        const interval = setInterval(() => {
            updateFrequency(mitigationStrength, attackType);
        }, FREQUENCY_HOP_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [updateFrequency, mitigationStrength, attackType]);

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