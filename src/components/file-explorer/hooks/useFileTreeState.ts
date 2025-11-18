import { useState, useCallback, useEffect } from 'react';
import * as path from 'path-browserify';

import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService';
import type { IDirectoryListing, IFileSystemEntry } from '@/components/file-explorer/types';
import { clearSelections } from '@/components/file-explorer/stores/fileTreeStore';


/** State to track paths that are expanded and their loaded contents */
export interface FileExplorerTreeState {
  // Key: Absolute path of the directory
  cachedContents: Record<string, IDirectoryListing>;
  // Set of absolute paths currently being fetched
  loadingPaths: Set<string>;
  // Set of absolute paths that are currently expanded in the tree view
  expandedPaths: Set<string>;
}

// Fixed: correctly escape backslash in regex so string is terminated properly and replacement works
const normalizeForBrowser = (p: string) => path.normalize(p.replace(/\\/g, '/'));

interface UseFileTreeState {
  // Core state
  treeState: FileExplorerTreeState;
  currentDirectoryContents: IDirectoryListing | null;
  loadingRoot: boolean;
  rootError: string | null;
  
  // Handlers
  updateTreeState: (updater: (prevState: FileExplorerTreeState) => FileExplorerTreeState) => void;
  fetchContents: (targetPath: string, isRoot: boolean) => Promise<void>;
  handleToggleExpand: (entry: IFileSystemEntry) => Promise<void>;
  handleRefresh: () => void;
  handleNavigate: (newPath: string) => void;
  handleGoUp: () => void;
  
  // Navigation state managed by the hook
  currentPath: string; 
}

/**
 * Manages the state and logic for the file tree structure, including caching,
 * expansion, loading, and directory fetching.
 */
export const useFileTreeState = (
    initialPath: string, 
    refreshTrigger: number,
    // Optional external hook to notify when navigation happens if needed for other state sync
): UseFileTreeState => {
  
  const effectiveInitialPath = normalizeForBrowser(initialPath ?? '/');

  const [currentPath, setCurrentPath] = useState<string>(effectiveInitialPath);
  const [currentDirectoryContents, setCurrentDirectoryContents] = useState<IDirectoryListing | null>(null);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  
  const [treeState, setTreeState] = useState<FileExplorerTreeState>({
    cachedContents: {},
    loadingPaths: new Set(),
    expandedPaths: new Set([effectiveInitialPath]), // Start root directory expanded
  });

  const updateTreeState = useCallback((updater: (prevState: FileExplorerTreeState) => FileExplorerTreeState) => {
    setTreeState(updater);
  }, []);

  // Fetch directory contents for a given path (used both for root and expansion)
  const fetchContents = useCallback(
    async (targetPath: string, isRoot: boolean) => {
      if (isRoot) {
        setLoadingRoot(true);
        setRootError(null);
      } else {
        updateTreeState(prev => ({
          ...prev,
          loadingPaths: new Set(prev.loadingPaths).add(targetPath),
        }));
      }

      try {
        const raw = await fileExplorerService.fetchDirectoryContents(targetPath);
        const arr = Array.isArray(raw) ? raw : [];

        const sortedContents = arr
          .filter(entry => entry && entry.name !== '.' && entry.name !== '..')
          .sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
          });

        if (isRoot) {
          setCurrentDirectoryContents(sortedContents as IDirectoryListing);
        } else {
          updateTreeState(prev => ({
            ...prev,
            cachedContents: {
              ...prev.cachedContents,
              [targetPath]: sortedContents as IDirectoryListing,
            },
          }));
        }
      } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'message' in err
          ? String((err as Error).message)
          : `Failed to load contents for ${targetPath}`;
        
        if (isRoot) {
          setRootError(message);
          setCurrentDirectoryContents(null);
        } else {
           // We silently fail child load errors for now
        }

      } finally {
        if (isRoot) {
          setLoadingRoot(false);
        }
        
        updateTreeState(prev => {
          const newLoadingPaths = new Set(prev.loadingPaths);
          newLoadingPaths.delete(targetPath);
          return { ...prev, loadingPaths: newLoadingPaths };
        });
      }
    },
    [updateTreeState]
  );
  
  const handleRefreshInternal = useCallback((path: string) => {
    // Re-fetch root contents
    fetchContents(path, true);
    // Clear cache of expanded items below root to force reload on toggle
    setTreeState(prev => ({
        ...prev,
        cachedContents: {},
        loadingPaths: new Set(Array.from(prev.loadingPaths).filter(p => p === path)),
    }));
    clearSelections(); // Clear selections on refresh
  }, [fetchContents]);


  const handleNavigate = useCallback(
    (newPath: string) => {
      const normalized = normalizeForBrowser(newPath);
      if (normalized !== currentPath) {
        setCurrentPath(normalized);
        clearSelections(); // Clear selections on navigating to new root
        
        // Clear children cache when navigating to a new root directory
        setTreeState({
            cachedContents: {},
            loadingPaths: new Set(),
            expandedPaths: new Set([normalized]),
        });
        
        // Immediately fetch new root contents
        fetchContents(normalized, true);
      }
    },
    [currentPath, fetchContents]
  );
  
  const handleGoUpInternal = useCallback((currentPath: string) => {
    const parentPath = path.dirname(currentPath);
    const normalizedParent = normalizeForBrowser(parentPath);
    const normalizedCurrent = normalizeForBrowser(currentPath);

    if (normalizedParent && normalizedParent !== normalizedCurrent) {
      handleNavigate(normalizedParent);
    }
  }, [handleNavigate]);

  // --- Tree Expansion/Collapse Logic ---

  const handleToggleExpand = useCallback(async (entry: IFileSystemEntry) => {
    const entryPath = entry.path;
    const isExpanded = treeState.expandedPaths.has(entryPath);
    const newExpandedPaths = new Set(treeState.expandedPaths);

    if (isExpanded) {
      newExpandedPaths.delete(entryPath);
      // We don't clear the cache on collapse, just collapse the view
    } else {
      newExpandedPaths.add(entryPath);
      // If expanding and contents not loaded/cached, fetch them
      if (!treeState.cachedContents[entryPath] && !treeState.loadingPaths.has(entryPath)) {
        fetchContents(entryPath, false);
      }
    }

    setTreeState(prev => ({
      ...prev,
      expandedPaths: newExpandedPaths,
    }));
  }, [treeState.expandedPaths, treeState.cachedContents, treeState.loadingPaths, fetchContents]);


  // Effect to handle root path change and initial fetch
  useEffect(() => {
    const normalized = normalizeForBrowser(currentPath);
    // 1. Initial/Path change fetch
    if (!currentDirectoryContents && !loadingRoot) {
        fetchContents(normalized, true);
    }
    
    // 2. Ensure currentPath is the anchor for expansion
    setTreeState(prev => {
        const newExpandedPaths = new Set(prev.expandedPaths);
        newExpandedPaths.add(normalized);
        return {...prev, expandedPaths: newExpandedPaths}
    });
    
  }, [currentPath, fetchContents, currentDirectoryContents, loadingRoot]);

  // Effect to listen for refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
        handleRefreshInternal(currentPath);
    }
  }, [refreshTrigger, handleRefreshInternal, currentPath]);
  
  // Effect to sync currentPath if initialPath prop changes externally
  useEffect(() => {
    const normalizedInitial = normalizeForBrowser(initialPath);
    if (normalizedInitial && normalizedInitial !== currentPath) {
        handleNavigate(normalizedInitial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPath]); // Only react to external prop change

  
  return {
    treeState,
    currentDirectoryContents,
    loadingRoot,
    rootError,
    currentPath,
    updateTreeState,
    fetchContents,
    handleToggleExpand,
    handleRefresh: () => handleRefreshInternal(currentPath), // Wrap to use current state
    handleNavigate,
    handleGoUp: () => handleGoUpInternal(currentPath), // Wrap to use current state
  };
};
