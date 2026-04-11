// browsers/fileBrowser.ts
import {
  launchImageLibrary,
  launchCamera,
  ImageLibraryOptions,
  CameraOptions,
  Asset,
} from "react-native-image-picker";
import RNFS from "react-native-fs";
import { Platform } from "react-native";

export const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof allowedTypes)[number];

// Helper function to check if a MIME type is allowed (fixes readonly array includes issue)
const isAllowedMimeType = (mimeType: string): boolean => {
  return allowedTypes.some((type) => type === mimeType);
};

/**
 * Get file extension from URI
 */
const getFileExtension = (uri: string): string => {
  return uri.split(".").pop()?.toLowerCase() || "";
};

/**
 * Map file extension to MIME type
 */
const extensionToMimeType = (extension: string): string => {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf",
  };
  return map[extension] || "application/octet-stream";
};

/**
 * Get MIME type from asset
 */
export const getMimeTypeFromAsset = (asset: Asset): string => {
  // Priority 1: Use explicit mimeType if provided
  if (asset.type) {
    const mimeType = asset.type.toLowerCase();
    if (isAllowedMimeType(mimeType)) {
      return mimeType;
    }
  }

  // Priority 2: Check file extension
  const extension = getFileExtension(asset.uri || "");
  const mimeFromExt = extensionToMimeType(extension);

  if (isAllowedMimeType(mimeFromExt)) {
    return mimeFromExt;
  }

  // Priority 3: Default to image/jpeg
  return "image/jpeg";
};

/**
 * Convert file URI to base64 using react-native-fs
 */
export const convertFileToBase64 = async (file: {
  uri: string;
  type?: string;
}): Promise<string> => {
  if (!file.uri) throw new Error("File URI is required");

  try {
    // Check if file exists
    const exists = await RNFS.exists(file.uri);
    if (!exists) {
      throw new Error("File does not exist");
    }

    // Determine MIME type
    let mimeType = file.type;
    if (!mimeType) {
      mimeType = extensionToMimeType(getFileExtension(file.uri));
    }

    // Validate MIME type
    if (!isAllowedMimeType(mimeType)) {
      throw new Error(
        `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    // Read file as base64
    const base64Content = await RNFS.readFile(file.uri, "base64");

    // Return as data URL with proper prefix
    return `data:${mimeType};base64,${base64Content}`;
  } catch (error: any) {
    console.error("File conversion failed:", error);
    throw new Error(error.message || "Failed to convert file to base64");
  }
};

/**
 * Alternative method using fetch + blob (works for network URIs)
 */
export const convertFileToBase64Fallback = async (file: {
  uri: string;
  type?: string;
}): Promise<string> => {
  if (!file.uri) throw new Error("File URI is required");

  try {
    // Fetch the file as blob
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // Determine MIME type
    const mimeType =
      file.type || blob.type || extensionToMimeType(getFileExtension(file.uri));

    // Validate MIME type
    if (!isAllowedMimeType(mimeType)) {
      throw new Error(
        `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    // Convert to base64 using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result); // Already includes data:image/jpeg;base64, prefix
        } else {
          reject(new Error("Failed to convert file: Invalid result type"));
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            "FileReader error: " + (reader.error?.message || "Unknown error"),
          ),
        );
      };

      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    console.error("Fallback conversion failed:", error);
    throw new Error(error.message || "Failed to convert file to base64");
  }
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<Asset | null> => {
  try {
    const options: ImageLibraryOptions = {
      mediaType: "photo",
      quality: 0.8,
      includeBase64: false,
    };

    const result = await launchImageLibrary(options);

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      console.error("ImagePicker Error:", result.errorMessage);
      throw new Error(result.errorMessage || "Failed to pick image");
    }

    if (result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error: any) {
    console.error("Error picking image:", error);
    throw new Error(error.message || "Failed to pick image");
  }
};

/**
 * Pick PDF document from device
 */
export const pickPDFDocument = async (): Promise<Asset | null> => {
  try {
    // For PDF picking, we still need to use image picker with file type
    // Note: react-native-image-picker doesn't directly support PDF picking on iOS
    // For better PDF support, consider using react-native-document-picker

    const options: ImageLibraryOptions = {
      mediaType: "mixed",
      quality: 0.8,
      includeBase64: false,
    };

    const result = await launchImageLibrary(options);

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      console.error("Document Picker Error:", result.errorMessage);
      throw new Error(result.errorMessage || "Failed to pick document");
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      // Check if it's a PDF (by extension or type)
      const isPDF =
        asset.fileName?.toLowerCase().endsWith(".pdf") ||
        asset.type === "application/pdf";

      if (
        !isPDF &&
        asset.type !== "image/jpeg" &&
        asset.type !== "image/png" &&
        asset.type !== "image/jpg"
      ) {
        throw new Error("Please select a PDF document or image file");
      }

      return asset;
    }

    return null;
  } catch (error: any) {
    console.error("Error picking document:", error);
    throw new Error(error.message || "Failed to pick document");
  }
};

/**
 * Pick any file (image or PDF)
 */
export const pickAnyFile = async (): Promise<Asset | null> => {
  try {
    const options: ImageLibraryOptions = {
      mediaType: "mixed",
      quality: 0.8,
      includeBase64: false,
    };

    const result = await launchImageLibrary(options);

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      console.error("File Picker Error:", result.errorMessage);
      throw new Error(result.errorMessage || "Failed to pick file");
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileName = asset.fileName || "";
      const fileType = asset.type || "";

      // Validate file type
      const isValidType =
        fileType.startsWith("image/") ||
        fileName.toLowerCase().endsWith(".pdf") ||
        fileType === "application/pdf";

      if (!isValidType) {
        throw new Error(
          `Unsupported file type. Allowed types: ${allowedTypes.join(", ")}`,
        );
      }

      return asset;
    }

    return null;
  } catch (error: any) {
    console.error("Error picking file:", error);
    throw new Error(error.message || "Failed to pick file");
  }
};

/**
 * Take photo from camera
 */
export const takePhoto = async (): Promise<Asset | null> => {
  try {
    const options: CameraOptions = {
      mediaType: "photo",
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: true,
    };

    const result = await launchCamera(options);

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      console.error("Camera Error:", result.errorMessage);
      throw new Error(result.errorMessage || "Failed to take photo");
    }

    if (result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error: any) {
    console.error("Error taking photo:", error);
    throw new Error(error.message || "Failed to take photo");
  }
};

/**
 * Get file size in bytes
 */
export const getFileSize = async (uri: string): Promise<number> => {
  try {
    const stat = await RNFS.stat(uri);
    return stat.size;
  } catch (error) {
    console.error("Error getting file size:", error);
    return 0;
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Validate file size (max 5MB default)
 */
export const validateFileSize = (
  size: number,
  maxSizeMB: number = 5,
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

/**
 * Get file name from URI
 */
export const getFileNameFromUri = (uri: string): string => {
  return uri.split("/").pop() || "unknown";
};

/**
 * Create a file object compatible with the existing code
 */
export const createFileObject = (
  asset: Asset,
  customType?: string,
): { uri: string; type: string; name: string; size: number } => {
  return {
    uri: asset.uri || "",
    type:
      customType ||
      asset.type ||
      extensionToMimeType(getFileExtension(asset.uri || "")),
    name:
      asset.fileName ||
      `file_${Date.now()}.${getFileExtension(asset.uri || "")}`,
    size: asset.fileSize || 0,
  };
};
