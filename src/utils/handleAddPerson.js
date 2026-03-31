let showAddPersonCallback = null;

/**
 * Initializes the plus util with a callback to open the PersonForm
 */
export const initPlusUtil = (callback) => {
  showAddPersonCallback = callback;
};

/**
 * Opens the add-person form modal.
 * @param {Object} params
 * @param {Object} params.data - Optional initial data for the form
 * @param {Array} params.connections - Optional connections for the new node
 * @param {Function} params.onAddPerson - Callback to add the person to state
 */
export const handleAddPerson = ({ data = null, connections = [], onAddPerson }) => {
  if (!showAddPersonCallback) return console.error('Plus util not initialized');
  showAddPersonCallback(true, { data, connections, onAddPerson });
};