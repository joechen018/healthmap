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
        
        // Load all entities from the data/entities directory
        const loadedEntities = await loadAllEntities();
        
        // Debug log to verify entity types before setting state
        console.log("Loaded entities in App.jsx:", loadedEntities);
        loadedEntities.forEach(entity => {
          console.log(`App.jsx entity: ${entity.name}, Type: ${entity.type}`);
        });
        
        setEntities(loadedEntities);
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
