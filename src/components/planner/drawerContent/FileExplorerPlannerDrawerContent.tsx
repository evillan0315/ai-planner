const handlePathSelectedForUse = useCallback(
    (selectedPath: string) => {
      const normalizedPath = selectedPath.replace(/\\/g, '/');
      
      if (mode === 'root') {
        // Update the parent's path state (which also feeds back into FileExplorer's current view)
        onPathChange(normalizedPath);
        
        // FIX: Immediately set the project root globally in the fileTreeStore
        setProjectRoot(normalizedPath);
        
      } else if (mode === 'scan') {