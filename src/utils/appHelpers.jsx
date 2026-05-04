// Helper functions for App.jsx

/** Build a person record (with new id) from PersonForm data */
export const createPersonFromFormData = (formData) => {
  const id = crypto.randomUUID();
  return {
    id,
    firstName: formData.firstName ?? '',
    middleName: formData.middleName ?? '',
    lastName: formData.lastName ?? '',
    goesBy: formData.goesBy ?? '',
    gender: formData.gender ?? '',
    birthDate: formData.birthDate ? formData.birthDate.toISOString() : null,
    deathDate: formData.deathDate ? formData.deathDate.toISOString() : null,
    photo: formData.photo ?? '',
    notes: formData.notes ?? '',
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