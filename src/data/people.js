import dayjs from 'dayjs';
import supabase from '../supabaseClient';

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

// Save data to Supabase (authenticated)
export const saveFamilyData = async (nodes, edges) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('family_trees')
      .upsert({
        user_id: user.id,
        nodes,
        edges,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
  }
};

// Load data from Supabase (authenticated)
export const loadFamilyData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return initialFamilyData;
  }
  
  try {
    const { data, error } = await supabase
      .from('family_trees')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return initial data
        return initialFamilyData;
      }
      throw error;
    }

    return {
      nodes: data.nodes || initialFamilyData.nodes,
      edges: data.edges || initialFamilyData.edges,
    };
  } catch (error) {
    console.error('Error loading from Supabase:', error);
    return initialFamilyData;
  }
};

// Clear all data (reset to initial)
export const clearFamilyData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;
  
  try {
    await supabase
      .from('family_trees')
      .delete()
      .eq('user_id', user.id);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};