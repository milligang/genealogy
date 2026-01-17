import dayjs from 'dayjs';

// Initial family tree data
export const initialFamilyData = {
  nodes: [
    {
      id: '1',
      type: 'personNode',
      position: { x: 250, y: 100 },
      data: { 
        firstName: 'John',
        middleName: 'Robert',
        lastName: 'Smith',
        goesBy: 'John',
        gender: 'male',
        birthDate: dayjs('1950-01-15').toISOString(),
        deathDate: null,
        photo: '',
        notes: 'Family patriarch'
      },
    },
    {
      id: '2',
      type: 'personNode',
      position: { x: 100, y: 280 },
      data: { 
        firstName: 'Sarah',
        middleName: 'Marie',
        lastName: 'Smith',
        goesBy: 'Sarah',
        gender: 'female',
        birthDate: dayjs('1975-05-20').toISOString(),
        deathDate: null,
        photo: '',
        notes: ''
      },
    },
    {
      id: '3',
      type: 'personNode',
      position: { x: 400, y: 280 },
      data: { 
        firstName: 'Michael',
        middleName: 'James',
        lastName: 'Smith',
        goesBy: 'Mike',
        gender: 'male',
        birthDate: dayjs('1978-08-10').toISOString(),
        deathDate: null,
        photo: '',
        notes: ''
      },
    },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: false },
    { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', animated: false },
  ]
};

// Save data to localStorage
export const saveFamilyData = (nodes, edges) => {
  const data = {
    nodes,
    edges,
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem('familyTreeData', JSON.stringify(data));
};

// Load data from localStorage
export const loadFamilyData = () => {
  const stored = localStorage.getItem('familyTreeData');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return {
        nodes: data.nodes || initialFamilyData.nodes,
        edges: data.edges || initialFamilyData.edges
      };
    } catch (error) {
      console.error('Error loading family data:', error);
      return initialFamilyData;
    }
  }
  return initialFamilyData;
};

// Clear all data (reset to initial)
export const clearFamilyData = () => {
  localStorage.removeItem('familyTreeData');
};