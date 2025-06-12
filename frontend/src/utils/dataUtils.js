/**
 * Utility functions for handling entity data
 */

/**
 * Load all entity data from the data directory
 * @returns {Promise<Array>} Promise resolving to an array of entity data
 */
export const loadAllEntities = async () => {
  try {
    console.log("Loading entities from data/entities directory...");
    
    // List of entity files to load - now includes all the new entities
    const entityFiles = [
      'unitedhealth_group.json',
      'unitedhealthcare.json',
      'elevance_health.json',
      'kaiser_permanente.json',
      'aetna.json',
      'anthem.json',
      'centene.json',
      'cigna.json',
      'cvs_health.json',
      'humana.json',
      'molina_healthcare.json'
    ];
    
    // First, check if we can access the data directory
    try {
      const testResponse = await fetch('/data/entities/');
      console.log("Data directory access test:", testResponse.status, testResponse.statusText);
    } catch (err) {
      console.error("Error accessing data directory:", err);
    }
    
    // Load each entity file
    const entitiesPromises = entityFiles.map(async (filename) => {
      try {
        console.log(`Attempting to load: /data/entities/${filename}`);
        const response = await fetch(`/data/entities/${filename}`);
        
        if (!response.ok) {
          console.warn(`Failed to load entity file: ${filename}`, response.status, response.statusText);
          return null;
        }
        
        const data = await response.json();
        console.log(`Successfully loaded ${filename}:`, data);
        return data;
      } catch (err) {
        console.warn(`Error loading entity file ${filename}:`, err);
        return null;
      }
    });
    
    // Wait for all files to load
    const loadedEntities = await Promise.all(entitiesPromises);
    
    // Filter out any null values (failed loads)
    const entities = loadedEntities.filter(entity => entity !== null);
    
    console.log(`Successfully loaded ${entities.length} of ${entityFiles.length} entity files`);
    
    if (entities.length === 0) {
      throw new Error('No entity data could be loaded. Check if the data directory is accessible.');
    }
    
    // Debug log to verify entity types
    entities.forEach(entity => {
      console.log(`Loaded entity: ${entity.name}, Type: ${entity.type}`);
    });
    
    return entities;
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
  
  console.log("transformToGraphData received entities:", entities);
  
  const nodes = [];
  const links = [];
  const nodeMap = {};
  const addedNodes = new Set();
  
  // First pass: Create nodes for all entities
  entities.forEach(entity => {
    if (!entity || !entity.name) return;
    
    // Skip if node already exists
    if (addedNodes.has(entity.name)) return;
    
    // Force correct types for known entities
    let entityType = entity.type || 'Unknown';
    let nodeColor;
    
    // Force types for specific entities
    if (entity.name === "Kaiser Permanente") {
      entityType = "Integrated";
      nodeColor = "#9C27B0"; // Purple
    } else if (entity.name === "Elevance Health" || entity.name === "UnitedHealthcare") {
      entityType = "Payer";
      nodeColor = "#4285F4"; // Blue
    } else {
      nodeColor = getNodeColor(entityType);
    }
    
    // Debug log to verify entity types and colors
    console.log(`Entity: ${entity.name}, Type: ${entityType}, Color: ${nodeColor}`);
    
    const node = {
      id: entity.name,
      name: entity.name,
      type: entityType,
      revenue: entity.revenue,
      parent: entity.parent,
      val: getNodeSize(entity.revenue), // Size based on revenue
      color: nodeColor  // Color based on type
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
          val: 8, // Updated default size
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
          val: 8, // Updated default size
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
 * @returns {string} Color value
 */
export const getNodeColor = (type) => {
  // Ensure type is a string and normalize to handle case sensitivity
  const normalizedType = String(type || '').trim();
  
  // Debug log to verify type being processed
  console.log(`Getting color for type: "${normalizedType}"`);
  
  const typeColors = {
    'Payer': '#4285F4',     // Blue
    'Provider': '#34A853',  // Green
    'Vendor': '#FBBC05',    // Yellow
    'Integrated': '#9C27B0', // Purple
    'Unknown': 'rgba(180, 180, 180, 0.7)',   // Transparent gray (glassy)
    'default': 'rgba(180, 180, 180, 0.7)'    // Transparent gray (glassy)
  };
  
  // Case-insensitive matching for more robustness
  const matchedType = Object.keys(typeColors).find(
    key => key.toLowerCase() === normalizedType.toLowerCase()
  );
  
  const color = matchedType ? typeColors[matchedType] : typeColors.default;
  console.log(`Matched type: ${matchedType || 'none'}, Color: ${color}`);
  
  return color;
};

/**
 * Get node size based on revenue
 * @param {string} revenue Revenue string (e.g., "226B")
 * @returns {number} Node size value
 */
export const getNodeSize = (revenue) => {
  if (!revenue) return 8;  // Increased minimum size
  
  // Extract numeric value from revenue string (e.g., "226B" -> 226)
  const match = revenue.match(/(\d+(\.\d+)?)/);
  if (!match) return 8;  // Increased minimum size
  
  const value = parseFloat(match[1]);
  const suffix = revenue.includes('B') ? 'B' : revenue.includes('M') ? 'M' : '';
  
  // Scale based on B (billions) or M (millions)
  // Increased multiplier to make nodes larger
  const multiplier = suffix === 'B' ? 1.5 : suffix === 'M' ? 0.2 : 0.05;
  return Math.max(8, Math.min(25, value * multiplier));  // Increased min and max sizes
};

/**
 * Get link color based on relationship type
 * @param {Object} link Link object with type property
 * @returns {string} Color value
 */
export const getLinkColor = (link) => {
  const typeColors = {
    'owned_by': 'rgba(0, 0, 0, 0.5)',      // Black (semi-transparent)
    'owns': 'rgba(0, 0, 0, 0.5)',          // Black (semi-transparent)
    'partner': 'rgba(0, 102, 204, 0.5)',   // Blue (semi-transparent)
    'competitor': 'rgba(220, 53, 69, 0.3)', // Red (semi-transparent)
    'customer': 'rgba(40, 167, 69, 0.5)',  // Green (semi-transparent)
    'vendor': 'rgba(255, 193, 7, 0.5)',    // Yellow (semi-transparent)
    'default': 'rgba(108, 117, 125, 0.3)'  // Gray (semi-transparent)
  };
  return typeColors[link.type] || typeColors.default;
};
