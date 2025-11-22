import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, ShieldAlert, Cpu, Activity } from 'lucide-react';

interface SystemLogProps {
  logs: LogEntry[];
}

export const SystemLog: React.FC<SystemLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-cyber-900 border border-cyber-700 rounded-lg overflow-hidden font-mono text-xs md:text-sm shadow-[0_0_15px_rgba(0,255,157,0.1)]">
      <div className="bg-cyber-800 p-3 border-b border-cyber-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyber-accent">
          <Terminal size={16} />
          <span className="font-bold tracking-wider">KERNEL_LOG</span>
        </div>
        <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {logs.length === 0 && (
            <div className="text-gray-600 italic text-center mt-10">System initialized. Awaiting telemetry...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={`flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300`}>
            <span className="text-gray-500 shrink-0">
              [{log.timestamp.toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}]
            </span>
            
            <div className="mt-0.5">
              {log.source === 'AI_KERNEL' && <Cpu size={12} className="text-cyber-info" />}
              {log.source === 'ATTACK_SIM' && <ShieldAlert size={12} className="text-cyber-danger" />}
              {log.source === 'SYSTEM' && <Activity size={12} className="text-gray-400" />}
            </div>

            <span className={`
              break-words
              ${log.type === 'info' ? 'text-gray-300' : ''}
              ${log.type === 'success' ? 'text-cyber-accent' : ''}
              ${log.type === 'warning' ? 'text-cyber-warn' : ''}
              ${log.type === 'error' ? 'text-cyber-danger font-bold' : ''}
            `}>
              {log.source === 'AI_KERNEL' ? <span className="text-cyber-info font-bold">AI: </span> : ''}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
