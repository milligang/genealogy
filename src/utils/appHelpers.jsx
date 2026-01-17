// Helper functions for App.jsx

// Create edges from connections data
export const createEdgesFromConnections = (newNodeId, connections, themeConfig) => {
    return connections.map(conn => {
      let edge;
      
      if (conn.type === 'spouse') {
        edge = {
          source: newNodeId,
          target: conn.personId,
          data: { type: 'spouse' }
        };
      } else if (conn.type === 'child') {
        // New person is parent, connected person is child
        edge = {
          source: newNodeId,
          target: conn.personId,
          data: { type: 'parent-child' }
        };
      } else {
        // New person is child, connected person is parent
        edge = {
          source: conn.personId,
          target: newNodeId,
          data: { type: 'parent-child' }
        };
      }
      
      const edgeType = conn.type === 'spouse' ? 'spouse' : 'parentChild';
      const edgeConfig = themeConfig.edgeStyles[edgeType];
      
      return {
        id: `e${newNodeId}-${conn.personId}-${Date.now()}-${Math.random()}`,
        ...edge,
        ...edgeConfig,
      };
    });
  };
  
  // Create a new node from form data
  export const createNodeFromFormData = (formData) => {
    const newNodeId = `${Date.now()}`;
    
    return {
      id: newNodeId,
      type: 'personNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        ...formData,
        birthDate: formData.birthDate ? formData.birthDate.toISOString() : null,
        deathDate: formData.deathDate ? formData.deathDate.toISOString() : null,
      },
    };
  };
  
  // Get display name for a person
  export const getPersonDisplayName = (nodeData) => {
    if (!nodeData) return 'Person';
    return nodeData.goesBy || nodeData.firstName || 'Person';
  };
  
  // Get initials from a person's name
  export const getPersonInitials = (nodeData) => {
    if (!nodeData) return '?';
    const name = nodeData.goesBy || nodeData.firstName || '';
    return name.charAt(0).toUpperCase();
  };