export enum NodeState {
  IDLE = 'IDLE',
  ROUTING = 'ROUTING',
  ANALYZING = 'ANALYZING', // Turing Analysis
  HOPPING = 'HOPPING',     // Lamarr Frequency Hopping
  COMPROMISED = 'COMPROMISED',
  LOCKED = 'LOCKED'
}

export enum AttackType {
  NONE = 'NONE',
  SNIFFING = 'SNIFFING',
  MITM = 'MITM',
  HIJACKING = 'HIJACKING'
}

export interface GraphNode {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  type: 'source' | 'target' | 'router';
  state: NodeState;
  label: string;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  frequency: number; // 0-100 Hz (abstract)
  active: boolean;
  isCompromised: boolean;
}

export interface Packet {
  id: string;
  sourceId: string;
  targetId: string;
  currentEdgeId: string | null; // composite key source-target
  progress: number; // 0 to 1
  data: string;
  isEncrypted: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  source: 'SYSTEM' | 'AI_KERNEL' | 'ATTACK_SIM';
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}