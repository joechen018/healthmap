import React from 'react';

const Legend = () => {
  // Entity type definitions
  const entityTypes = [
    { type: 'Payer', color: 'var(--color-payer)', description: 'Insurance companies' },
    { type: 'Provider', color: 'var(--color-provider)', description: 'Healthcare providers' },
    { type: 'Vendor', color: 'var(--color-vendor)', description: 'Healthcare vendors' },
    { type: 'Integrated', color: 'var(--color-integrated)', description: 'Integrated health systems' },
    { type: 'Unknown', color: 'var(--color-default)', description: 'Unclassified entities' }
  ];
  
  // Relationship type definitions
  const relationshipTypes = [
    { type: 'owned_by', color: 'rgba(0, 0, 0, 0.5)', description: 'Owned by parent' },
    { type: 'owns', color: 'rgba(0, 0, 0, 0.5)', description: 'Owns subsidiary' },
    { type: 'partner', color: 'rgba(0, 102, 204, 0.5)', description: 'Partnership' },
    { type: 'competitor', color: 'rgba(220, 53, 69, 0.3)', description: 'Competition' },
    { type: 'customer', color: 'rgba(40, 167, 69, 0.5)', description: 'Customer relationship' },
    { type: 'vendor', color: 'rgba(255, 193, 7, 0.5)', description: 'Vendor relationship' }
  ];
  
  return (
    <div className="legend">
      <div className="legend-title">Entity Types</div>
      <div className="legend-items">
        {entityTypes.map((item) => (
          <div key={item.type} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: item.color }}></div>
            <div className="legend-label">{item.type} - {item.description}</div>
          </div>
        ))}
      </div>
      
      <div className="legend-title" style={{ marginTop: '1rem' }}>Relationship Types</div>
      <div className="legend-items">
        {relationshipTypes.map((item) => (
          <div key={item.type} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: item.color }}></div>
            <div className="legend-label">{item.type} - {item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
