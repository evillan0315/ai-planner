import axios from 'axios';
import { getAuthHeaders, API_BASE_URL } from '@/api/authService';
import type { 
  IDirectoryListing,
  IReadFileRequest,
  IReadFileResponse,
  ICreateFileRequest,
  IFileOperationResult,
  IWriteFileRequest,
  IDeleteFileRequest,
  IRenameFileRequest,
  IRenameFileResponse,
  ICopyFileRequest,
  ICopyFileResponse,
  IMoveFileRequest,
  IMoveFileResponse
} from '@/components/file-explorer/types'; 

/**
 * Service for interacting with the backend's local file system endpoints (/api/file).
 */
export const fileExplorerService = {
  
  async  getFileStreamUrl(filePath: string): Promise<string> {
    try {
      console.log(filePath);
      const url = new URL(`${API_BASE_URL}/file/stream`, window.location.origin);
      url.searchParams.append('filePath', filePath);
     
      return url.href;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to browse directory: ${targetPath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while browsing directory: ${targetPath}.`,
      );
    }
},
  
  /**
   * Fetches the contents of a directory (subdirectories and files).
   * @param targetPath The absolute path of the directory to browse.
   * @returns A promise that resolves to an IDirectoryListing (array of IFileSystemEntry).
   */
  async fetchDirectoryContents(targetPath: string): Promise<IDirectoryListing> {
    try {
      const response = await axios.get<IDirectoryListing>(
        `${API_BASE_URL}/file/list?directory=${encodeURIComponent(targetPath)}&recursive=false`,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to browse directory: ${targetPath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while browsing directory: ${targetPath}.`,
      );
    }
  },

  /**
   * Reads the content of a specific file.
   * @param filePath The path of the file to open.
   */
  async readFileContent(filePath: string): Promise<IReadFileResponse> {
    const payload: IReadFileRequest = { filePath };
    try {
      const response = await axios.post<IReadFileResponse>(
        `${API_BASE_URL}/file/read`,
        payload,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to read file: ${filePath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while reading file: ${filePath}.`,
      );
    }
  },

  /**
   * Creates a new file or folder.
   * @param data Details for the new file/folder creation.
   */
  async createFileOrFolder(data: ICreateFileRequest): Promise<IFileOperationResult> {
    try {
      const response = await axios.post<IFileOperationResult>(
        `${API_BASE_URL}/file/create`,
        data,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to create path: ${data.filePath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while creating path: ${data.filePath}.`,
      );
    }
  },

  /**
   * Writes content to an existing file (or creates it if missing).
   * @param filePath The path of the file to write to.
   * @param content The content to write.
   */
  async writeFileContent(filePath: string, content: string): Promise<IFileOperationResult> {
    const data: IWriteFileRequest = { filePath, content };
    try {
      const response = await axios.post<IFileOperationResult>(
        `${API_BASE_URL}/file/write`,
        data,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to write to file: ${filePath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while writing file: ${filePath}.`,
      );
    }
  },

  /**
   * Deletes a file or folder.
   * @param filePath The path of the file/folder to delete.
   */
  async deleteFileOrFolder(filePath: string): Promise<IFileOperationResult> {
    const data: IDeleteFileRequest = { filePath };
    try {
      const response = await axios.post<IFileOperationResult>(
        `${API_BASE_URL}/file/delete`,
        data,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to delete path: ${filePath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while deleting path: ${filePath}.`,
      );
    }
  },

  /**
   * Renames a file or folder.
   * @param oldPath Current path.
   * @param newPath New path/name.
   */
  async renameFileOrFolder(oldPath: string, newPath: string): Promise<IRenameFileResponse> {
    const data: IRenameFileRequest = { oldPath, newPath };
    try {
      const response = await axios.post<IRenameFileResponse>(
        `${API_BASE_URL}/file/rename`,
        data,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to rename ${oldPath} to ${newPath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while renaming: ${oldPath}.`,
      );
    }
  },

  /**
   * Copies a file or folder.
   * @param sourcePath Source path.
   * @param destinationPath Destination path.
   */
  async copyFileOrFolder(sourcePath: string, destinationPath: string): Promise<ICopyFileResponse> {
    const data: ICopyFileRequest = { sourcePath, destinationPath };
    try {
      const response = await axios.post<ICopyFileResponse>(
        `${API_BASE_URL}/file/copy`,
        data,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to copy ${sourcePath} to ${destinationPath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while copying: ${sourcePath}.`,
      );
    }
  },

  /**
   * Moves a file or folder.
   * @param sourcePath Source path.
   * @param destinationPath Destination path.
   */
  async moveFileOrFolder(sourcePath: string, destinationPath: string): Promise<IMoveFileResponse> {
    const data: IMoveFileRequest = { sourcePath, destinationPath };
    try {
      const response = await axios.post<IMoveFileResponse>(
        `${API_BASE_URL}/file/move`,
        data,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || `Failed to move ${sourcePath} to ${destinationPath}`,
        );
      }
      throw new Error(
        `An unexpected error occurred while moving: ${sourcePath}.`,
      );
    }
  },
};
