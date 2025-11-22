import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, Packet, NodeState } from '../types';
import { COLORS } from '../constants';

interface GraphVisualizerProps {
  nodes: GraphNode[];
  links: GraphLink[];
  packets: Packet[];
  width: number;
  height: number;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes,
  links,
  packets,
  width,
  height
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);

  // Initialize simulation once
  useEffect(() => {
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<GraphNode>()
        // We only use the link force to store the link data structure, 
        // we don't strictly need it for positioning since we use fx/fy.
        .force("link", d3.forceLink<GraphNode, GraphLink>().id(d => d.id))
        .velocityDecay(1); // Stop all physics movement
    }
  }, []);

  // Update Data & Tick
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation || !width || !height) return;

    // 1. CALCULATE FIXED LAYOUT
    // This strictly positions nodes "at one place"
    const xPad = width * 0.1;
    const yPad = height * 0.2;
    const availWidth = width - (xPad * 2);
    const availHeight = height - (yPad * 2);

    // Group nodes for layout
    // Based on creation logic: 
    // SRC (0), 
    // Col 1 (1-4), 
    // Col 2 (5-9), 
    // Col 3 (10-13), 
    // DST (14)
    
    // Helper to assign fixed position
    const setPos = (n: GraphNode, x: number, y: number) => {
        n.fx = x;
        n.fy = y;
        n.x = x;
        n.y = y;
    };

    nodes.forEach(node => {
        if (node.id === 'SRC') {
            setPos(node, xPad, height / 2);
        } else if (node.id === 'DST') {
            setPos(node, width - xPad, height / 2);
        } else {
            // Router Nodes
            // Identify rough layer based on ID (assuming N1..N13)
            const idNum = parseInt(node.id.replace('N', ''));
            let col = 0;
            let rowIdx = 0;
            let totalInCol = 4;

            if (idNum >= 1 && idNum <= 4) {
                col = 1;
                rowIdx = idNum - 1;
                totalInCol = 4;
            } else if (idNum >= 5 && idNum <= 9) {
                col = 2;
                rowIdx = idNum - 5;
                totalInCol = 5;
            } else if (idNum >= 10 && idNum <= 13) {
                col = 3;
                rowIdx = idNum - 10;
                totalInCol = 4;
            }

            // Calculate Grid Position
            const colX = xPad + (col * (availWidth / 4));
            // Center rows vertically
            const rowStep = availHeight / (totalInCol - 1 || 1);
            // Offset to center the group if needed, but simple distribution works
            const rowY = yPad + (rowIdx * rowStep);
            
            setPos(node, colX, rowY);
        }
    });

    // 2. UPDATE SIMULATION DATA
    simulation.nodes(nodes);
    (simulation.force("link") as d3.ForceLink<GraphNode, GraphLink>).links(links);
    
    // 3. RENDER ON TICK (Or just once since they are fixed)
    // We run one tick to ensure attributes are set
    simulation.alpha(1).tick();
    
    const svg = d3.select(svgRef.current);

    // Update Links
    svg.selectAll<SVGGElement, GraphLink>(".link-group")
        .data(links)
        .join("g") // Use join to handle enter/update/exit cleanly
        .attr("class", "link-group")
        .each(function(d) {
            const group = d3.select(this);
            const s = d.source as GraphNode;
            const t = d.target as GraphNode;
            
            if (s.x === undefined || s.y === undefined || t.x === undefined || t.y === undefined) return;

            // Ensure lines exist
            if (group.select("line.link-base").empty()) {
                group.append("line").attr("class", "link-base").attr("stroke", "#1f2937").attr("stroke-width", 1);
                group.append("line").attr("class", "link-activity").attr("stroke-width", 0);
            }

            group.select("line.link-base")
                .attr("x1", s.x)
                .attr("y1", s.y)
                .attr("x2", t.x)
                .attr("y2", t.y);

            group.select("line.link-activity")
                .attr("x1", s.x)
                .attr("y1", s.y)
                .attr("x2", t.x)
                .attr("y2", t.y);
        });

    // Update Nodes
    svg.selectAll<SVGGElement, GraphNode>(".node-group")
        .data(nodes)
        .attr("transform", d => {
            if (d.x === undefined || d.y === undefined) return "";
            return `translate(${d.x},${d.y})`;
        });

    // Since they are fixed, we don't need a running simulation tick listener
    // We force one update when props change.

  }, [nodes, links, width, height]);


  // Calculate Packet Positions (Interpolation)
  const renderedPackets = useMemo(() => {
      return packets.map(p => {
          if (!p.currentEdgeId) return null;
          
          const link = links.find(l => {
              const s = (l.source as GraphNode).id || (l.source as string);
              const t = (l.target as GraphNode).id || (l.target as string);
              return `${s}-${t}` === p.currentEdgeId || `${t}-${s}` === p.currentEdgeId;
          });

          if (!link) return null;

          const sNode = nodes.find(n => n.id === (typeof link.source === 'object' ? link.source.id : link.source));
          const tNode = nodes.find(n => n.id === (typeof link.target === 'object' ? link.target.id : link.target));

          if (!sNode?.x || !sNode?.y || !tNode?.x || !tNode?.y) return null;

          const [hopSourceId] = p.currentEdgeId.split('-');
          const isReversed = hopSourceId !== sNode.id;

          const x1 = isReversed ? tNode.x : sNode.x;
          const y1 = isReversed ? tNode.y : sNode.y;
          const x2 = isReversed ? sNode.x : tNode.x;
          const y2 = isReversed ? sNode.y : tNode.y;

          const x = x1 + (x2 - x1) * p.progress;
          const y = y1 + (y2 - y1) * p.progress;

          return (
              <circle 
                key={p.id} 
                cx={x} 
                cy={y} 
                r={3} 
                fill={p.isEncrypted ? COLORS.HOPPING : COLORS.COMPROMISED} 
                className="drop-shadow-[0_0_8px_rgba(0,255,157,0.8)] pointer-events-none"
              />
          );
      });
  }, [packets, links, nodes]);

  return (
    <div className="w-full h-full bg-cyber-900 relative overflow-hidden rounded-lg shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{
             backgroundImage: `radial-gradient(#1f2937 1px, transparent 1px), radial-gradient(#111827 1px, transparent 1px)`,
             backgroundSize: '20px 20px',
             backgroundPosition: '0 0, 10px 10px'
           }}>
      </div>
      
      {/* HUD Elements */}
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-gray-600 flex flex-col items-end pointer-events-none select-none">
        <span>COORDS: {Math.round(width)}x{Math.round(height)}</span>
        <span>LAYOUT: FIXED_GRID</span>
        <span>GRID: ACTIVE</span>
      </div>

      <svg ref={svgRef} width={width} height={height} className="block relative z-10">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Links Layer */}
        <g className="links-layer">
            {links.map((link, i) => {
                const isActive = link.active;
                const isCompromised = link.isCompromised;
                
                return (
                    <g key={i} className="link-group">
                        <line 
                            className="link-base"
                            stroke="#1f2937" 
                            strokeWidth={1}
                        />
                        <line 
                            className="link-activity transition-all duration-300"
                            stroke={isCompromised ? COLORS.COMPROMISED : COLORS.HOPPING}
                            strokeWidth={isActive ? 2 : 0}
                            strokeOpacity={isActive ? 1 : 0}
                            filter={isActive ? "url(#glow)" : ""}
                        />
                    </g>
                )
            })}
        </g>

        {/* Nodes Layer */}
        <g className="nodes-layer">
            {nodes.map(node => {
                const isEndpoint = node.type === 'source' || node.type === 'target';
                const isSource = node.type === 'source';
                const color = COLORS[node.state];
                const isCompromised = node.state === NodeState.COMPROMISED;
                
                return (
                <g key={node.id} className="node-group cursor-pointer">
                    {/* Interaction Hit Area */}
                    <circle r={20} fill="transparent" />

                    {/* Router Visuals */}
                    {!isEndpoint && (
                        <>
                            <circle 
                                r={10} 
                                fill="#0a0a0a" 
                                stroke={color} 
                                strokeWidth={2}
                                className={`transition-colors duration-300 ${isCompromised ? 'animate-pulse' : ''}`}
                            />
                            <circle r={4} fill={color} className="opacity-50" />
                            {node.state === NodeState.ANALYZING && (
                                <circle r={14} fill="none" stroke={COLORS.ANALYZING} strokeWidth={1} strokeDasharray="2,2" className="animate-spin-slow" />
                            )}
                        </>
                    )}

                    {/* Endpoint Visuals (Source/Target) */}
                    {isEndpoint && (
                        <>
                           <rect 
                                x={-14} y={-14} width={28} height={28} 
                                rx={4}
                                fill="#0a0a0a"
                                stroke={color}
                                strokeWidth={2}
                                className={`transition-colors duration-300 shadow-lg ${isSource ? 'shadow-cyber-accent/20' : 'shadow-cyber-info/20'}`}
                           />
                           <line x1={-8} y1={-5} x2={8} y2={-5} stroke={color} strokeWidth={1} opacity={0.5} />
                           <line x1={-8} y1={0} x2={4} y2={0} stroke={color} strokeWidth={1} opacity={0.5} />
                           <line x1={-8} y1={5} x2={6} y2={5} stroke={color} strokeWidth={1} opacity={0.5} />
                        </>
                    )}

                    {/* Label */}
                    <g transform="translate(0, 24)">
                        <rect x={-20} y={-8} width={40} height={16} rx={8} fill="#000" fillOpacity={0.7} />
                        <text 
                            className="text-[9px] font-mono fill-gray-300 pointer-events-none select-none"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            y={1}
                        >
                            {node.label}
                        </text>
                    </g>

                    {/* Hopping Effect Halo */}
                    {node.state === NodeState.HOPPING && (
                        <circle r={22} fill="none" stroke={COLORS.HOPPING} strokeOpacity={0.2} strokeWidth={1} className="animate-ping" />
                    )}
                </g>
            )})}
        </g>

        {/* Packets Layer */}
        <g className="packets-layer">
            {renderedPackets}
        </g>
      </svg>
    </div>
  );
};