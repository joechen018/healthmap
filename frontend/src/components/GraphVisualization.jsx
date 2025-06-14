import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceRadial, forceLink } from 'd3-force';
import { useWindowSize } from '../hooks/useWindowSize';
import { transformToGraphData, getNodeColor, getNodeSize, getLinkColor } from '../utils/dataUtils';

const GraphVisualization = ({ entities, onNodeClick, onResetView }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const graphRef = useRef();
  const windowSize = useWindowSize();
  
  // Transform entities into graph data format
  useEffect(() => {
    if (!entities || entities.length === 0) return;
    
    // Debug log to verify entities received by GraphVisualization
    console.log("Entities received by GraphVisualization:", entities);
    entities.forEach(entity => {
      console.log(`GraphVisualization entity: ${entity.name}, Type: ${entity.type}`);
    });
    
    // Use our utility function to transform entities into graph data
    const data = transformToGraphData(entities);
    console.log("Transformed graph data:", data);
    setGraphData(data);
  }, [entities]);
  
  // Handle reset view
  const handleResetView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };
  
  // Expose reset view function to parent
  useEffect(() => {
    if (onResetView && typeof onResetView === 'function') {
      onResetView(handleResetView);
    }
  }, [onResetView, handleResetView]);
  
  // Auto-zoom to fit when graph data changes
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      // Wait for graph to render
      setTimeout(() => {
        graphRef.current.zoomToFit(400);
      }, 500);
    }
  }, [graphData]);
  
  
  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      nodeLabel={node => `${node.name} (${node.type})\nRevenue: ${node.revenue || 'Unknown'}`}
      linkLabel={link => link.type}
      nodeColor={node => node.color}
      nodeVal={node => node.val}
      linkColor={link => getLinkColor(link)}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
      linkWidth={1.5}
      width={windowSize.width}
      height={windowSize.height - 60} // Subtract header height
      onNodeClick={(node) => onNodeClick && onNodeClick(node)}
      cooldownTicks={100}
      // Simpler approach with stronger center force
      d3AlphaDecay={0.05} // Default value
      d3VelocityDecay={0.4} // Default value
      // Use a stronger center force
      d3Force={(engine) => {
        // Increase the center force strength
        engine.force('center').strength(1);
        
        // Reduce the charge force (less repulsion)
        engine.force('charge').strength(-30);
        
        // Set fixed positions for major entities in a circle around the center
        const majorEntities = ['UnitedHealthcare', 'Elevance Health', 'Kaiser Permanente', 
                              'Humana', 'Cigna', 'CVS Health', 'Aetna', 'Centene'];
        
        const radius = 150; // Distance from center
        const nodes = engine.nodes();
        
        // Position major entities in a circle
        nodes.forEach(node => {
          const index = majorEntities.indexOf(node.id);
          if (index !== -1) {
            // Calculate position in a circle
            const angle = (index / majorEntities.length) * 2 * Math.PI;
            const fx = radius * Math.cos(angle);
            const fy = radius * Math.sin(angle);
            
            // Set fixed position
            node.fx = fx;
            node.fy = fy;
          } else {
            // Clear any fixed position for non-major entities
            node.fx = null;
            node.fy = null;
          }
        });
      }}
      onEngineStop={() => {
        // Once the simulation has stabilized, zoom to fit
        graphRef.current.zoomToFit(400);
      }}
      // Custom node rendering to display entity names
      nodeCanvasObject={(node, ctx, globalScale) => {
        // Draw the node circle with the correct color based on entity type
        const label = node.name;
        const fontSize = 12/globalScale;
        const nodeR = Math.sqrt(node.val) * 4;
        
        // Debug log to verify node properties
        console.log(`Rendering node: ${node.name}, Type: ${node.type}, Color: ${node.color}`);
        
        // Force color based on type for debugging
        let nodeColor = node.color;
        if (node.type === 'Payer') {
          nodeColor = '#4285F4'; // Blue
        } else if (node.type === 'Integrated') {
          nodeColor = '#9C27B0'; // Purple
        } else if (node.type === 'Provider') {
          nodeColor = '#34A853'; // Green
        } else if (node.type === 'Vendor') {
          nodeColor = '#FBBC05'; // Yellow
        } else {
          nodeColor = 'rgba(180, 180, 180, 0.7)'; // Transparent gray (glassy) for Unknown
        }
        
        // Ensure we're using the correct color for the node
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw the text label - always white for consistency
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        
        // For nodes large enough to fit text inside
        if (nodeR > fontSize * label.length / 3) {
          // Draw text inside the node
          ctx.fillText(label, node.x, node.y);
        } else {
          // For smaller nodes, draw text with a background matching the node color
          const textWidth = ctx.measureText(label).width;
          const bgPadding = 2;
          
          // Draw text background using the same color as the node
          ctx.fillStyle = nodeColor; // Use the forced nodeColor
          ctx.fillRect(
            node.x + nodeR + fontSize/2 - textWidth/2 - bgPadding,
            node.y - fontSize/2 - bgPadding,
            textWidth + bgPadding * 2,
            fontSize + bgPadding * 2
          );
          
          // Draw white text on the colored background
          ctx.fillStyle = 'white';
          ctx.fillText(label, node.x + nodeR + fontSize/2, node.y);
        }
      }}
    />
  );
};

export default GraphVisualization;
