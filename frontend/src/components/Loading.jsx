import React from 'react';

const Loading = () => {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <div className="loading-text" style={{ marginTop: '1rem' }}>
        Loading healthcare ecosystem data...
      </div>
    </div>
  );
};

export default Loading;
