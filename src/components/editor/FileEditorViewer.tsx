import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; // ADDED
import * as path from 'path-browserify'; // ADDED
import { useStore } from '@nanostores/react';
import { editorStore, updateDraftContent, saveFileContent, IEditorContent, loadFileContentFromPath } from '@/components/editor/stores/editorStore'; 
import { IWindowContent } from '@/components/editor/stores/floatingWindowsStore'; // Import the new window content type
import type { IFileSystemEntry } from '@/components/file-explorer/types'; // Import IFileSystemEntry