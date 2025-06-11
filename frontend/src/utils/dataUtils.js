/**
 * Utility functions for handling entity data
 */

/**
 * Load all entity data from the data directory
 * @returns {Promise<Array>} Promise resolving to an array of entity data
 */
export const loadAllEntities = async () => {
  try {
    // In a production environment, this would be an API call
    // For now, we'll use static imports
    
    // Import the entity data files
    const unitedHealthcare = await import('../../data/entities/unitedhealthcare.json');
    const elevanceHealth = await import('../../data/entities/elevance_health.json');
    const kaiserPermanente = await import('../../data/entities/kaiser_permanente.json');
    
    // Combine the entities
    return [unitedHealthcare.default, elevanceHealth.default, kaiserPermanente.default];
  } catch (error) {
    console.error('Error loading entity data:', error);
    throw new Error('Failed to load healthcare entity data');
  }
};

/**
 * Transform entity data into graph data format
 * @param {Array} entities Array of entity data
 * @returns {Object} Object with nodes and links arrays for the graph
 */
export const transformToGraphData = (entities) => {
  if (!entities || entities.length === 0) {
    return { nodes: [], links: [] };
  }
  
  const nodes = [];
  const links = [];
  const nodeMap = {};
  const addedNodes = new Set();
  
  // First pass: Create nodes for all entities
  entities.forEach(entity => {
    if (!entity || !entity.name) return;
    
    // Skip if node already exists
    if (addedNodes.has(entity.name)) return;
    
    const node = {
      id: entity.name,
      name: entity.name,
      type: entity.type || 'Unknown',
      revenue: entity.revenue,
      parent: entity.parent,
      val: getNodeSize(entity.revenue), // Size based on revenue
      color: getNodeColor(entity.type)  // Color based on type
    };
    
    nodes.push(node);
    nodeMap[entity.name] = node;
    addedNodes.add(entity.name);
    
    // Add subsidiaries as nodes if they don't exist yet
    if (entity.subsidiaries && Array.isArray(entity.subsidiaries)) {
      entity.subsidiaries.forEach(subsidiary => {
        if (!subsidiary || addedNodes.has(subsidiary)) return;
        
        const subNode = {
          id: subsidiary,
          name: subsidiary,
          type: 'Unknown', // We don't know the type of subsidiaries
          val: 5, // Default size
          color: getNodeColor('Unknown')
        };
        
        nodes.push(subNode);
        nodeMap[subsidiary] = subNode;
        addedNodes.add(subsidiary);
      });
    }
    
    // Add relationship targets as nodes if they don't exist yet
    if (entity.relationships && Array.isArray(entity.relationships)) {
      entity.relationships.forEach(rel => {
        if (!rel.target || addedNodes.has(rel.target)) return;
        
        const targetNode = {
          id: rel.target,
          name: rel.target,
          type: 'Unknown', // We don't know the type of relationship targets
          val: 5, // Default size
          color: getNodeColor('Unknown')
        };
        
        nodes.push(targetNode);
        nodeMap[rel.target] = targetNode;
        addedNodes.add(rel.target);
      });
    }
  });
  
  // Second pass: Create links
  entities.forEach(entity => {
    if (!entity || !entity.name) return;
    
    // Add parent relationship if exists
    if (entity.parent && nodeMap[entity.parent]) {
      links.push({
        source: entity.name,
        target: entity.parent,
        type: 'owned_by'
      });
    }
    
    // Add subsidiary relationships
    if (entity.subsidiaries && Array.isArray(entity.subsidiaries)) {
      entity.subsidiaries.forEach(subsidiary => {
        if (!subsidiary || !nodeMap[subsidiary]) return;
        
        links.push({
          source: entity.name,
          target: subsidiary,
          type: 'owns'
        });
      });
    }
    
    // Add other relationships
    if (entity.relationships && Array.isArray(entity.relationships)) {
      entity.relationships.forEach(rel => {
        if (!rel.target || !nodeMap[rel.target] || !rel.type) return;
        
        links.push({
          source: entity.name,
          target: rel.target,
          type: rel.type
        });
      });
    }
  });
  
  return { nodes, links };
};

/**
 * Get node color based on entity type
 * @param {string} type Entity type
 * @returns {string} CSS color variable
 */
export const getNodeColor = (type) => {
  const typeColors = {
    'Payer': 'var(--color-payer)',
    'Provider': 'var(--color-provider)',
    'Vendor': 'var(--color-vendor)',
    'Integrated': 'var(--color-integrated)',
    'default': 'var(--color-default)'
  };
  return typeColors[type] || typeColors.default;
};

/**
 * Get node size based on revenue
 * @param {string} revenue Revenue string (e.g., "226B")
 * @returns {number} Node size value
 */
export const getNodeSize = (revenue) => {
  if (!revenue) return 5;
  
  // Extract numeric value from revenue string (e.g., "226B" -> 226)
  const match = revenue.match(/(\d+(\.\d+)?)/);
  if (!match) return 5;
  
  const value = parseFloat(match[1]);
  const suffix = revenue.includes('B') ? 'B' : revenue.includes('M') ? 'M' : '';
  
  // Scale based on B (billions) or M (millions)
  const multiplier = suffix === 'B' ? 1 : suffix === 'M' ? 0.1 : 0.01;
  return Math.max(5, Math.min(20, value * multiplier));
};

/**
 * Get link color based on relationship type
 * @param {Object} link Link object with type property
 * @returns {string} CSS color
 */
export const getLinkColor = (link) => {
  const typeColors = {
    'owned_by': 'rgba(0, 0, 0, 0.5)',
    'owns': 'rgba(0, 0, 0, 0.5)',
    'partner': 'rgba(0, 102, 204, 0.5)',
    'competitor': 'rgba(220, 53, 69, 0.3)',
    'customer': 'rgba(40, 167, 69, 0.5)',
    'vendor': 'rgba(255, 193, 7, 0.5)',
    'default': 'rgba(108, 117, 125, 0.3)'
  };
  return typeColors[link.type] || typeColors.default;
};
