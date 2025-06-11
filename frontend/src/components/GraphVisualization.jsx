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
    if (onResetView) {
      onResetView(handleResetView);
    }
  }, [onResetView]);
  
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
    />
  );
};

export default GraphVisualization;
