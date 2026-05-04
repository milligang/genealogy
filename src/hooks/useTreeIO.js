import { parseFamilyImport } from '../data/familyData';

export const useTreeIO = (familyModel, onImport) => {
  const exportTree = () => {
    const data = JSON.stringify(familyModel, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-tree-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTree = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const model = parseFamilyImport(parsed);
        onImport(model);
      } catch {
        alert('Invalid file — please upload a family tree JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  return { exportTree, importTree };
};
