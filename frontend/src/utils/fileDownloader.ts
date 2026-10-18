import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const DIR_CACHE_FILE = `${FileSystem.documentDirectory}saved_pdf_dir_uri.txt`;

/**
 * Get the cached SAF directory URI from a previous download
 */
export async function getSavedDirectoryUri(): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(DIR_CACHE_FILE);
    if (info.exists) {
      const uri = await FileSystem.readAsStringAsync(DIR_CACHE_FILE);
      if (uri && uri.trim().length > 0) {
        return uri.trim();
      }
    }
  } catch (e) {
    console.log("Error reading cached directory URI:", e);
  }
  return null;
}

/**
 * Cache the SAF directory URI for future one-tap downloads
 */
export async function setSavedDirectoryUri(uri: string): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(DIR_CACHE_FILE, uri);
  } catch (e) {
    console.log("Error saving directory URI cache:", e);
  }
}

/**
 * Downloads/saves a PDF or document file to device storage.
 * On Android:
 * - If a directory permission was previously granted, writes silently without asking again.
 * - If not yet granted, prompts the user to select a folder (e.g. Documents) once and caches it.
 * On iOS:
 * - Uses Sharing.shareAsync with native "Save to Files" option.
 */
export async function downloadFileToDevice(
  localUri: string,
  fileName: string,
  mimeType: string = 'application/pdf',
  onSuccess?: (msg: string) => void,
  onError?: (msg: string) => void
): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      let dirUri = await getSavedDirectoryUri();

      // If no directory cached yet, request permission once with initial directory (Documents or Pictures)
      if (!dirUri) {
        let initialDir: string | undefined = undefined;
        try {
          initialDir = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Documents');
        } catch (e) {
          // fallback if getUriForDirectoryInRoot not supported
        }

        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialDir);
        if (!permissions.granted) {
          if (onError) onError("Folder selection was canceled. You can use the Share button to send or save this file.");
          return false;
        }
        dirUri = permissions.directoryUri;
        await setSavedDirectoryUri(dirUri);
      }

      // Read source file as Base64
      const fileData = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Write file into chosen directory
      try {
        const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          dirUri,
          fileName,
          mimeType
        );
        await FileSystem.writeAsStringAsync(newFileUri, fileData, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (onSuccess) {
          onSuccess(`Saved ${fileName} successfully to your device!`);
        }
        return true;
      } catch (writeErr) {
        // If cached directory was revoked or removed, reset and ask once
        console.log("Cached directory invalid, prompting folder selection:", writeErr);
        await FileSystem.deleteAsync(DIR_CACHE_FILE, { idempotent: true });

        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          await setSavedDirectoryUri(permissions.directoryUri);
          const retryFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            mimeType
          );
          await FileSystem.writeAsStringAsync(retryFileUri, fileData, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (onSuccess) {
            onSuccess(`Saved ${fileName} successfully!`);
          }
          return true;
        } else {
          if (onError) onError("Folder selection was canceled.");
          return false;
        }
      }
    } catch (err: any) {
      console.error("Android file download error:", err);
      if (onError) {
        onError("Could not save file to device. You can use the Share button to send or save this file.");
      }
      return false;
    }
  } else {
    // iOS: Native share sheet with Save to Files
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, { mimeType, dialogTitle: 'Save / Download File' });
        return true;
      }
    } catch (err) {
      console.error("iOS share error:", err);
    }
    return false;
  }
}
