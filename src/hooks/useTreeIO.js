export const useTreeIO = (nodes, edges, onLoad) => {
    const exportTree = () => {
      const data = JSON.stringify({ nodes, edges }, null, 2);
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
          const { nodes, edges } = JSON.parse(event.target.result);
          onLoad(nodes, edges);
        } catch {
          alert('Invalid file — please upload a family tree JSON file.');
        }
      };
      reader.readAsText(file);
    };
  
    return { exportTree, importTree };
  };