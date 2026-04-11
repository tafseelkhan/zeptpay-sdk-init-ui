// components/common/FileUploader.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  launchImageLibrary,
  launchCamera,
  Asset,
} from "react-native-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Mode } from "../../types/merchantTypes";
import {
  convertFileToBase64,
  getMimeTypeFromAsset,
  allowedTypes,
} from "../../browsers/filesBrowser";

interface FileUploaderProps {
  label: string;
  required?: boolean;
  description?: string;
  icon?: string;
  value?: string; // Base64 string with data:image prefix
  onUpload: (base64: string) => void; // ✅ Emits base64 string
  onRemove: () => void;
  uploading?: boolean;
  mode?: Mode;
  accept?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  required = false,
  description,
  value,
  onUpload,
  onRemove,
  uploading = false,
  mode = "test",
  accept = "image/*",
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Process selected asset - convert to base64 and validate
   */
  const processAsset = async (asset: Asset) => {
    try {
      setIsProcessing(true);

      // Step 1: Get proper MIME type from asset
      let mimeType: string;
      try {
        mimeType = getMimeTypeFromAsset(asset);
        console.log(`📁 Selected file type: ${mimeType}`);
      } catch (error: any) {
        Alert.alert("Invalid File Type", error.message);
        return;
      }

      // Step 2: Convert to base64
      try {
        const base64Data = await convertFileToBase64({
          uri: asset.uri || "",
          type: mimeType,
        });

        // Step 3: Verify we got a valid base64 string
        if (!base64Data || !base64Data.startsWith("data:")) {
          throw new Error("Invalid base64 data generated");
        }

        console.log(`✅ File converted successfully`);

        // Step 4: Emit base64 DIRECTLY to parent
        onUpload(base64Data);
      } catch (error: any) {
        console.error("Conversion error:", error);
        Alert.alert(
          "Conversion Failed",
          error.message || "Failed to process file. Please try again.",
        );
      }
    } catch (error) {
      console.error("Asset processing error:", error);
      Alert.alert("Error", "Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Request gallery permissions (Android 13+ needs READ_MEDIA_IMAGES)
  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      try {
        const PermissionsAndroid = require("react-native").PermissionsAndroid;
        // Android 13+ (API 33+) uses READ_MEDIA_IMAGES
        const permission =
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission, {
          title: "Gallery Permission",
          message: "App needs access to your gallery to select images",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        });
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error("Gallery permission error:", err);
        return false;
      }
    }
    return true; // iOS permissions are handled by react-native-image-picker
  };

  // ✅ Request camera permission
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      try {
        const PermissionsAndroid = require("react-native").PermissionsAndroid;
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs access to your camera to take photos",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error("Camera permission error:", err);
        return false;
      }
    }
    return true;
  };

  // ✅ Pick image from gallery
  const pickImage = async () => {
    try {
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission needed",
          "Please grant gallery permissions to select images",
        );
        return;
      }

      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error("ImagePicker Error:", result.errorMessage);
        Alert.alert("Error", result.errorMessage || "Failed to pick image");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        await processAsset(result.assets[0]);
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Error", "Failed to open image gallery");
    }
  };

  // ✅ Take photo with camera
  const takePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission needed",
          "Please grant camera permissions to take photos",
        );
        return;
      }

      const result = await launchCamera({
        mediaType: "photo",
        quality: 0.8,
        includeBase64: false,
        saveToPhotos: true,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error("Camera Error:", result.errorMessage);
        Alert.alert("Error", result.errorMessage || "Failed to take photo");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        await processAsset(result.assets[0]);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  // ✅ Show options menu
  const showOptions = () => {
    Alert.alert(
      `Upload ${label}`,
      `Choose an option (Allowed: ${allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")})`,
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  // ✅ Handle remove with confirmation
  const handleRemove = () => {
    Alert.alert(
      "Remove Document",
      `Are you sure you want to remove ${label}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onRemove },
      ],
    );
  };

  const isLoading = uploading || isProcessing;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      {value ? (
        <View style={styles.previewContainer}>
          {/* ✅ value is base64 string with data:image prefix - works directly */}
          <Image source={{ uri: value }} style={styles.preview} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              onPress={showOptions}
              style={styles.changeButton}
              disabled={isLoading}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRemove}
              style={styles.removeButton}
              disabled={isLoading}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadArea, isLoading && styles.uploadAreaDisabled]}
          onPress={showOptions}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0066CC" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <>
              <Icon name="cloud-upload" size={32} color="#6B7280" />
              <Text style={styles.uploadText}>Tap to upload</Text>
              <Text style={styles.uploadHint}>
                {allowedTypes
                  .map((t) => t.split("/")[1].toUpperCase())
                  .join(", ")}{" "}
                (max 10MB)
              </Text>
              {mode === "test" && (
                <Text style={styles.testModeHint}>(Test Mode)</Text>
              )}
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  required: {
    color: "#EF4444",
  },
  description: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    minHeight: 140,
  },
  uploadAreaDisabled: {
    opacity: 0.7,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  testModeHint: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 8,
    fontStyle: "italic",
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  preview: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  previewActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  changeButton: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  changeButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "500",
  },
  removeButton: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 1,
    borderLeftColor: "#E5E7EB",
  },
  removeButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default FileUploader;
