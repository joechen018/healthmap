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
    // For now, we'll use mock data
    
    console.log("Loading mock entities...");
    
    // Mock data for demonstration purposes
    const mockEntities = [
      {
        "name": "UnitedHealthcare",
        "type": "Payer", // Blue
        "parent": "UnitedHealth Group",
        "revenue": "240B",
        "subsidiaries": [
          "UnitedHealthcare Community & State",
          "UnitedHealthcare Medicare & Retirement",
          "UnitedHealthcare Employer & Individual"
        ],
        "relationships": [
          {"target": "UnitedHealth Group", "type": "owned_by"},
          {"target": "Optum", "type": "partner"},
          {"target": "Elevance Health", "type": "competitor"},
          {"target": "Kaiser Permanente", "type": "competitor"},
          {"target": "Humana", "type": "competitor"},
          {"target": "Cigna", "type": "competitor"},
          {"target": "CVS Health", "type": "competitor"}
        ]
      },
      {
        "name": "Elevance Health",
        "type": "Payer", // Blue
        "parent": null,
        "revenue": "156B",
        "subsidiaries": [
          "Anthem Blue Cross",
          "Anthem Blue Cross and Blue Shield",
          "Blue Cross Blue Shield of Georgia",
          "Empire Blue Cross Blue Shield",
          "Carelon",
          "Carelon Behavioral Health",
          "Carelon Insights",
          "Carelon Digital Platforms"
        ],
        "relationships": [
          {"target": "UnitedHealthcare", "type": "competitor"},
          {"target": "Kaiser Permanente", "type": "competitor"},
          {"target": "Humana", "type": "competitor"},
          {"target": "Cigna", "type": "competitor"},
          {"target": "CVS Health", "type": "competitor"},
          {"target": "Carelon", "type": "owns"},
          {"target": "Anthem Blue Cross", "type": "owns"},
          {"target": "Blue Cross Blue Shield Association", "type": "partner"}
        ]
      },
      {
        "name": "Kaiser Permanente",
        "type": "Integrated", // Purple
        "parent": null,
        "revenue": "95B",
        "subsidiaries": [
          "Kaiser Foundation Health Plan",
          "Kaiser Foundation Hospitals",
          "The Permanente Medical Groups",
          "Kaiser Permanente Insurance Company",
          "Kaiser Permanente International"
        ],
        "relationships": [
          {"target": "UnitedHealthcare", "type": "competitor"},
          {"target": "Elevance Health", "type": "competitor"},
          {"target": "Humana", "type": "competitor"},
          {"target": "Cigna", "type": "competitor"},
          {"target": "CVS Health", "type": "competitor"},
          {"target": "Kaiser Foundation Hospitals", "type": "owns"},
          {"target": "Kaiser Foundation Health Plan", "type": "owns"},
          {"target": "The Permanente Medical Groups", "type": "partner"}
        ]
      }
    ];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Debug log to verify entity types before returning
    mockEntities.forEach(entity => {
      console.log(`Loaded entity: ${entity.name}, Type: ${entity.type}`);
    });
    
    return mockEntities;
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
    'Unknown': '#EA4335',   // Red
    'default': '#EA4335'    // Red
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
