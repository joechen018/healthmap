import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useWindowSize } from '../hooks/useWindowSize';
import { transformToGraphData, getNodeColor, getNodeSize, getLinkColor } from '../utils/dataUtils';

const GraphVisualization = ({ entities, onNodeClick, onResetView }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const graphRef = useRef();
  const windowSize = useWindowSize();
  
  // Transform entities into graph data format
  useEffect(() => {
    if (!entities || entities.length === 0) return;
    
    // Use our utility function to transform entities into graph data
    const data = transformToGraphData(entities);
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
        
        // Ensure we're using the correct color for the node
        ctx.fillStyle = node.color;
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
          ctx.fillStyle = node.color;
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
