import React from 'react';

const EntityDetailsPanel = ({ entity, onClose }) => {
  if (!entity) return null;
  
  // Helper function to format relationship type for display
  const formatRelationshipType = (type) => {
    switch (type) {
      case 'owned_by': return 'Owned by';
      case 'owns': return 'Owns';
      case 'partner': return 'Partners with';
      case 'competitor': return 'Competes with';
      case 'customer': return 'Customer of';
      case 'vendor': return 'Vendor to';
      default: return 'Related to';
    }
  };
  
  return (
    <div className="entity-details-panel">
      <div className="panel-header">
        <h2>{entity.name}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        <div className="detail-item">
          <span className="label">Type:</span>
          <span className="value">{entity.type || 'Unknown'}</span>
        </div>
        
        {entity.parent && (
          <div className="detail-item">
            <span className="label">Parent:</span>
            <span className="value">{entity.parent}</span>
          </div>
        )}
        
        <div className="detail-item">
          <span className="label">Revenue:</span>
          <span className="value">{entity.revenue || 'Unknown'}</span>
        </div>
        
        {entity.subsidiaries && entity.subsidiaries.length > 0 && (
          <div className="detail-item">
            <span className="label">Subsidiaries:</span>
            <ul className="value-list">
              {entity.subsidiaries.map((sub, index) => (
                <li key={`sub-${index}`}>{sub}</li>
              ))}
            </ul>
          </div>
        )}
        
        {entity.relationships && entity.relationships.length > 0 && (
          <div className="detail-item">
            <span className="label">Relationships:</span>
            <ul className="value-list">
              {entity.relationships.map((rel, index) => (
                <li key={`rel-${index}`}>
                  {formatRelationshipType(rel.type)} {rel.target}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Additional information could be added here */}
        <div className="detail-item">
          <span className="label">Actions:</span>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(entity.name)}`, '_blank')}>
              Search Google
            </button>
            <button className="action-btn" onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(entity.name.replace(/ /g, '_'))}`, '_blank')}>
              View Wikipedia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityDetailsPanel;
