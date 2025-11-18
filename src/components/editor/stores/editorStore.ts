import { atom } from 'nanostores';
import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService';
import type { IFileSystemEntry } from '@/components/file-explorer/types';
import { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES, AUDIO_MIME_TYPES } from '@/constants'; // Import constants
import { openFloatingWindow } from './floatingWindowsStore'; // IMPORT NEW STORE ACTION
import * as path from 'path-browserify'; // ADDED: path utility for base name extraction