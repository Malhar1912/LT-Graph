import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNodeState } from './useNodeState';
import { usePacketSystem } from './usePacketSystem';
import { useAttackSimulation } from './useAttackSimulation';
import { AttackType, NodeState } from '../types';

describe('useNodeState', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with nodes and links', () => {
        const { result } = renderHook(() => useNodeState());

        act(() => {
            result.current.initializeGraph();
        });

        expect(result.current.nodes.length).toBeGreaterThan(0);
        expect(result.current.links.length).toBeGreaterThan(0);
        expect(result.current.nodes[0].id).toBe('SRC');
    });

    it('should handle packet arrival and state transitions', () => {
        const { result } = renderHook(() => useNodeState());

        act(() => {
            result.current.initializeGraph();
        });

        const targetNodeId = result.current.nodes[1].id;

        act(() => {
            result.current.handlePacketArrival(targetNodeId);
        });

        expect(result.current.nodes[1].state).toBe(NodeState.ANALYZING);

        act(() => {
            vi.advanceTimersByTime(600); // ANALYZING duration
        });

        expect(result.current.nodes[1].state).toBe(NodeState.ROUTING);

        act(() => {
            vi.advanceTimersByTime(600); // ROUTING duration
        });

        expect(result.current.nodes[1].state).toBe(NodeState.IDLE);
    });
});

describe('useAttackSimulation', () => {
    it('should toggle attack state', () => {
        const mockSetNodes = vi.fn();
        const mockSetLinks = vi.fn();
        const mockAddLog = vi.fn();
        const nodes = [];
        const frequency = 50;

        const { result } = renderHook(() => useAttackSimulation(nodes, mockSetNodes, mockSetLinks, frequency, mockAddLog));

        expect(result.current.attackType).toBe(AttackType.NONE);

        act(() => {
            result.current.toggleAttack(AttackType.SNIFFING);
        });

        expect(result.current.attackType).toBe(AttackType.SNIFFING);
        expect(mockAddLog).toHaveBeenCalledWith('ATTACK_SIM', expect.stringContaining('Injecting'), 'error');

        act(() => {
            result.current.toggleAttack(AttackType.SNIFFING);
        });

        expect(result.current.attackType).toBe(AttackType.NONE);
    });
});
