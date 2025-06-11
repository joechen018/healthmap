import React, { useState } from 'react';

const Controls = ({ onResetView }) => {
  const [legendVisible, setLegendVisible] = useState(true);
  
  // Toggle legend visibility
  const toggleLegend = () => {
    const legend = document.querySelector('.legend');
    if (legend) {
      legend.style.display = legendVisible ? 'none' : 'block';
      setLegendVisible(!legendVisible);
    }
  };
  
  return (
    <div className="controls">
      <button 
        className="control-btn"
        onClick={onResetView}
        title="Reset view to fit all nodes"
      >
        Reset View
      </button>
      
      <button 
        className="control-btn"
        onClick={toggleLegend}
        title={legendVisible ? "Hide legend" : "Show legend"}
      >
        {legendVisible ? "Hide Legend" : "Show Legend"}
      </button>
      
      {/* Additional controls can be added here */}
    </div>
  );
};

export default Controls;
