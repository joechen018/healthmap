import React, { useState, useEffect, useCallback } from 'react';
import GraphVisualization from './components/GraphVisualization';
import EntityDetailsPanel from './components/EntityDetailsPanel';
import Header from './components/Header';
import Legend from './components/Legend';
import Controls from './components/Controls';
import Loading from './components/Loading';
import { loadAllEntities } from './utils/dataUtils';

const App = () => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load entity data
    const loadEntities = async () => {
      try {
        setLoading(true);
        
        // Add a simulated delay for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Hardcoded entity data with correct types
        const hardcodedEntities = [
          {
            name: "UnitedHealthcare",
            type: "Payer", // Blue
            parent: "UnitedHealth Group",
            revenue: "240B",
            subsidiaries: [
              "UnitedHealthcare Community & State",
              "UnitedHealthcare Medicare & Retirement",
              "UnitedHealthcare Employer & Individual"
            ],
            relationships: [
              {target: "UnitedHealth Group", type: "owned_by"},
              {target: "Optum", type: "partner"},
              {target: "Elevance Health", type: "competitor"},
              {target: "Kaiser Permanente", type: "competitor"},
              {target: "Humana", type: "competitor"},
              {target: "Cigna", type: "competitor"},
              {target: "CVS Health", type: "competitor"}
            ]
          },
          {
            name: "Elevance Health",
            type: "Payer", // Blue
            parent: null,
            revenue: "156B",
            subsidiaries: [
              "Anthem Blue Cross",
              "Anthem Blue Cross and Blue Shield",
              "Blue Cross Blue Shield of Georgia",
              "Empire Blue Cross Blue Shield",
              "Carelon",
              "Carelon Behavioral Health",
              "Carelon Insights",
              "Carelon Digital Platforms"
            ],
            relationships: [
              {target: "UnitedHealthcare", type: "competitor"},
              {target: "Kaiser Permanente", type: "competitor"},
              {target: "Humana", type: "competitor"},
              {target: "Cigna", type: "competitor"},
              {target: "CVS Health", type: "competitor"},
              {target: "Carelon", type: "owns"},
              {target: "Anthem Blue Cross", type: "owns"},
              {target: "Blue Cross Blue Shield Association", type: "partner"}
            ]
          },
          {
            name: "Kaiser Permanente",
            type: "Integrated", // Purple
            parent: null,
            revenue: "95B",
            subsidiaries: [
              "Kaiser Foundation Health Plan",
              "Kaiser Foundation Hospitals",
              "The Permanente Medical Groups",
              "Kaiser Permanente Insurance Company",
              "Kaiser Permanente International"
            ],
            relationships: [
              {target: "UnitedHealthcare", type: "competitor"},
              {target: "Elevance Health", type: "competitor"},
              {target: "Humana", type: "competitor"},
              {target: "Cigna", type: "competitor"},
              {target: "CVS Health", type: "competitor"},
              {target: "Kaiser Foundation Hospitals", type: "owns"},
              {target: "Kaiser Foundation Health Plan", type: "owns"},
              {target: "The Permanente Medical Groups", type: "partner"}
            ]
          }
        ];
        
        // Debug log to verify entity types before setting state
        console.log("Hardcoded entities in App.jsx:", hardcodedEntities);
        hardcodedEntities.forEach(entity => {
          console.log(`App.jsx entity: ${entity.name}, Type: ${entity.type}`);
        });
        
        setEntities(hardcodedEntities);
        setLoading(false);
      } catch (err) {
        console.error('Error loading entity data:', err);
        setError('Failed to load healthcare entity data. Please try again later.');
        setLoading(false);
      }
    };
    
    loadEntities();
  }, []);

  const handleNodeClick = (node) => {
    // Find the entity that matches the clicked node
    const entity = entities.find(e => e.name === node.id);
    setSelectedEntity(entity);
  };

  const handleClosePanel = () => {
    setSelectedEntity(null);
  };

  // Reference to the reset view function from GraphVisualization
  const [resetViewFn, setResetViewFn] = useState(null);
  
  const handleResetView = useCallback(() => {
    if (resetViewFn) {
      resetViewFn();
    }
  }, [resetViewFn]);

  return (
    <div className="app">
      <Header />
      
      <main className="main">
        <div className="graph-container">
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <GraphVisualization 
                entities={entities} 
                onNodeClick={handleNodeClick} 
                onResetView={setResetViewFn}
              />
              <Legend />
              <Controls onResetView={() => handleResetView()} />
            </>
          )}
        </div>
        
        {selectedEntity && (
          <EntityDetailsPanel 
            entity={selectedEntity} 
            onClose={handleClosePanel} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
