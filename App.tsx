import React, { useState, useEffect } from 'react';
import { useGraphSimulation } from './simulation/useGraphSimulation';
import { GraphVisualizer } from './components/GraphVisualizer';
import { SystemLog } from './components/SystemLog';
import { AttackType } from './types';
import { Shield, ShieldAlert, Radio, Activity, Network } from 'lucide-react';

const App: React.FC = () => {
  const { nodes, links, packets, logs, attackType, frequency, toggleAttack } = useGraphSimulation();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Responsive graph container
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('graph-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-900 text-gray-200 p-4 md:p-6 flex flex-col gap-4 font-sans">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-cyber-800 p-4 rounded-lg border border-cyber-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-cyber-accent/20 p-2 rounded-full border border-cyber-accent">
            <Network className="text-cyber-accent" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">LAMARR-TURING <span className="text-cyber-accent">GRAPH</span></h1>
            <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">Secure Frequency-Hopping Mesh Network</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm font-mono">
          <div className="flex items-center gap-2">
            <Radio size={18} className={attackType === AttackType.NONE ? "text-cyber-accent animate-pulse" : "text-cyber-warn"} />
            <span className="text-gray-400">FREQ:</span>
            <span className="text-cyber-accent font-bold text-lg">{frequency} MHz</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-cyber-info" />
            <span className="text-gray-400">NODES:</span>
            <span className="text-white font-bold">{nodes.length}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-cyber-900 border border-cyber-700">
            <div className={`w-2 h-2 rounded-full ${attackType === AttackType.NONE ? 'bg-cyber-accent' : 'bg-cyber-danger'} animate-ping`}></div>
            <span className={attackType === AttackType.NONE ? 'text-cyber-accent' : 'text-cyber-danger'}>
              {attackType === AttackType.NONE ? 'SECURE' : 'UNDER ATTACK'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left Control Panel */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          {/* Status Card */}
          <div className="bg-cyber-800 p-4 rounded-lg border border-cyber-700 shadow-md">
            <h3 className="text-cyber-info font-mono font-bold mb-4 flex items-center gap-2">
              <Shield size={16} /> THREAT_SIMULATION
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => toggleAttack(AttackType.SNIFFING)}
                className={`w-full p-3 rounded border transition-all flex items-center justify-between group
                    ${attackType === AttackType.SNIFFING
                    ? 'bg-cyber-danger/20 border-cyber-danger text-cyber-danger shadow-[0_0_10px_rgba(255,0,85,0.3)]'
                    : 'bg-cyber-700 border-cyber-600 hover:border-cyber-500 text-gray-300'}`}
              >
                <span className="font-mono font-bold">PACKET SNIFFING</span>
                <ShieldAlert size={18} className={`group-hover:scale-110 transition-transform ${attackType === AttackType.SNIFFING ? 'animate-bounce' : ''}`} />
              </button>

              <button
                onClick={() => toggleAttack(AttackType.MITM)}
                className={`w-full p-3 rounded border transition-all flex items-center justify-between group
                    ${attackType === AttackType.MITM
                    ? 'bg-cyber-warn/20 border-cyber-warn text-cyber-warn shadow-[0_0_10px_rgba(255,190,11,0.3)]'
                    : 'bg-cyber-700 border-cyber-600 hover:border-cyber-500 text-gray-300'}`}
              >
                <span className="font-mono font-bold">MITM ATTACK</span>
                <Activity size={18} className={`group-hover:scale-110 transition-transform ${attackType === AttackType.MITM ? 'animate-bounce' : ''}`} />
              </button>

              <button
                onClick={() => toggleAttack(AttackType.HIJACKING)}
                className={`w-full p-3 rounded border transition-all flex items-center justify-between group
                    ${attackType === AttackType.HIJACKING
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-cyber-700 border-cyber-600 hover:border-cyber-500 text-gray-300'}`}
              >
                <span className="font-mono font-bold">ROUTE HIJACKING</span>
                <Network size={18} className={`group-hover:scale-110 transition-transform ${attackType === AttackType.HIJACKING ? 'animate-bounce' : ''}`} />
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500 font-mono border-t border-cyber-700 pt-4">
              <p>PROTOCOL: <span className="text-cyber-accent">LMR-TRG-V4</span></p>
              <p>ENCRYPTION: <span className="text-cyber-accent">AES-256-GCM</span></p>
              <p>TOPOLOGY: <span className="text-cyber-accent">DYNAMIC MESH</span></p>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-cyber-800 p-4 rounded-lg border border-cyber-700 flex-1">
            <h3 className="text-gray-400 font-mono text-sm font-bold mb-3">VISUAL_KEY</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4b5563]"></div>
                <span>IDLE NODE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00ff9d]"></div>
                <span>HOPPING / SECURE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff0055]"></div>
                <span>COMPROMISED</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#00ff9d]"></div>
                <span>ACTIVE LINK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#ff0055]"></div>
                <span>UNSAFE PATH</span>
              </div>
            </div>
          </div>
        </section>

        {/* Center Graph */}
        <section id="graph-container" className="lg:col-span-6 h-[500px] lg:h-auto relative rounded-lg overflow-hidden bg-black/50 border-2 border-cyber-700/50">
          <GraphVisualizer
            nodes={nodes}
            links={links}
            packets={packets}
            attackType={attackType}
            width={dimensions.width}
            height={dimensions.height}
          />
        </section>

        {/* Right Logs */}
        <section className="lg:col-span-3 h-[300px] lg:h-auto">
          <SystemLog logs={logs} />
        </section>
      </main>
    </div>
  );
};

export default App;
