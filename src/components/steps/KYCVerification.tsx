// components/steps/KYCVerification.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput as PaperTextInput,
  HelperText,
  Surface,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import FileUploader from "../common/FileUploader";
import {
  Merchant,
  Mode,
  KycStatus,
  KYCDetails,
} from "../../types/merchantTypes";

interface KYCVerificationProps {
  initialData: Partial<Merchant>;
  mode: Mode;
  kycStatus: KycStatus;
  onNext: (data: Partial<Merchant>) => void;
  onBack: () => void;
}

interface TextFieldConfig {
  key: keyof Pick<
    KYCDetails,
    "panNumber" | "aadhaarNumber" | "gstNumber" | "registeredBusinessName"
  >;
  label: string;
  required: boolean;
  icon: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  maxLength?: number;
  validation?: (value: string) => string | undefined;
}

interface DocumentConfig {
  key: keyof Pick<
    KYCDetails,
    "panCardUrl" | "aadhaarUrl" | "addressProofUrl" | "selfieUrl"
  >;
  label: string;
  required: boolean;
  description?: string;
  icon: string;
  acceptedTypes?: string[];
}

// Text fields configuration
const TEXT_FIELDS: TextFieldConfig[] = [
  {
    key: "panNumber",
    label: "PAN Number",
    required: true,
    icon: "card-account-details",
    placeholder: "ABCDE1234F",
    validation: (value) => {
      if (!value?.trim()) return "PAN number is required";
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(value.toUpperCase())) {
        return "Invalid PAN format (e.g., ABCDE1234F)";
      }
      return undefined;
    },
  },
  {
    key: "aadhaarNumber",
    label: "Aadhaar Number",
    required: true,
    icon: "card-bulleted",
    placeholder: "1234 5678 9012",
    keyboardType: "numeric",
    maxLength: 14,
    validation: (value) => {
      if (!value?.trim()) return "Aadhaar number is required";
      const cleaned = value.replace(/\s/g, "");
      if (!/^\d{12}$/.test(cleaned)) {
        return "Aadhaar must be 12 digits";
      }
      return undefined;
    },
  },
  {
    key: "gstNumber",
    label: "GST Number",
    required: false,
    icon: "file-certificate",
    placeholder: "22AAAAA0000A1Z5",
    validation: (value) => {
      if (!value?.trim()) return undefined;
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
      if (!gstRegex.test(value.toUpperCase())) {
        return "Invalid GST format";
      }
      return undefined;
    },
  },
  {
    key: "registeredBusinessName",
    label: "Registered Business Name",
    required: false,
    icon: "store",
    placeholder: "Your registered business name",
    validation: (value) => {
      if (value && value.length < 3) {
        return "Business name must be at least 3 characters";
      }
      return undefined;
    },
  },
];

// Document uploads configuration
const REQUIRED_DOCUMENTS: DocumentConfig[] = [
  {
    key: "panCardUrl",
    label: "PAN Card",
    required: true,
    icon: "card-account-details",
    description: "Clear image of PAN card",
    acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
  },
  {
    key: "aadhaarUrl",
    label: "Aadhaar Card",
    required: true,
    icon: "card-bulleted",
    description: "Both sides of Aadhaar",
    acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
  },
  {
    key: "selfieUrl",
    label: "Selfie",
    required: true,
    icon: "face",
    description: "Clear front-facing photo",
    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
  },
  {
    key: "addressProofUrl",
    label: "Address Proof",
    required: true,
    icon: "home",
    description: "Utility bill or rent agreement",
    acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
  },
];

const KYCVerification: React.FC<KYCVerificationProps> = ({
  initialData,
  mode,
  kycStatus,
  onNext,
  onBack,
}) => {
  // Initialize with new KYCDetails structure
  const [kycDetails, setKycDetails] = useState<Partial<KYCDetails>>(
    initialData.kycDetails || {},
  );

  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationComplete, setVerificationComplete] =
    useState<boolean>(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Check if KYC is already verified
  useEffect(() => {
    if (kycStatus === "verified") {
      setVerificationComplete(true);
    }
  }, [kycStatus]);

  // Validate a specific field
  const validateField = (key: string, value: any): string | undefined => {
    const textField = TEXT_FIELDS.find((f) => f.key === key);
    if (textField?.validation && value !== undefined) {
      return textField.validation(value);
    }
    return undefined;
  };

  // Handle text input change
  const handleTextChange = (
    key: keyof Pick<
      KYCDetails,
      "panNumber" | "aadhaarNumber" | "gstNumber" | "registeredBusinessName"
    >,
    value: string,
  ) => {
    // Format Aadhaar number with spaces
    if (key === "aadhaarNumber") {
      value = value.replace(/\D/g, "");
      if (value.length > 12) value = value.slice(0, 12);
      // Add space after every 4 digits
      const parts = value.match(/.{1,4}/g);
      value = parts ? parts.join(" ") : value;
    }

    // Format PAN to uppercase
    if (key === "panNumber" || key === "gstNumber") {
      value = value.toUpperCase();
    }

    setKycDetails((prev) => ({ ...prev, [key]: value }));

    // Validate on change
    const error = validateField(key, value);
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[key] = error;
      } else {
        delete newErrors[key];
      }
      return newErrors;
    });
  };

  const handleBlur = (key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const value = kycDetails[key as keyof KYCDetails];
    const error = validateField(key, value);
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[key] = error;
      } else {
        delete newErrors[key];
      }
      return newErrors;
    });
  };

  // Handle document upload - receives base64 string directly
  const handleDocumentUpload = async (
    documentKey: keyof Pick<
      KYCDetails,
      "panCardUrl" | "aadhaarUrl" | "addressProofUrl" | "selfieUrl"
    >,
    base64String: string,
  ) => {
    setUploadingFor(documentKey as string);

    setKycDetails((prev) => ({
      ...prev,
      [documentKey]: base64String,
    }));

    setUploadingFor(null);

    if (mode === "test") {
      console.log(`✅ ${documentKey} uploaded in test mode`);
    }
  };

  const handleDocumentRemove = (
    documentKey: keyof Pick<
      KYCDetails,
      "panCardUrl" | "aadhaarUrl" | "addressProofUrl" | "selfieUrl"
    >,
  ) => {
    Alert.alert(
      "Remove Document",
      "Are you sure you want to remove this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updated = { ...kycDetails };
            delete updated[documentKey];
            setKycDetails(updated);
          },
        },
      ],
    );
  };

  const getKYCStatusBadge = () => {
    switch (kycStatus) {
      case "verified":
        return (
          <View style={[styles.statusBadge, styles.verified]}>
            <IconButton icon="check-circle" size={16} iconColor="#10B981" />
            <Text style={styles.statusTextVerified}>Verified</Text>
          </View>
        );
      case "pending":
        return (
          <View style={[styles.statusBadge, styles.pending]}>
            <IconButton icon="clock-outline" size={16} iconColor="#D97706" />
            <Text style={styles.statusTextPending}>Pending</Text>
          </View>
        );
      case "rejected":
        return (
          <View style={[styles.statusBadge, styles.rejected]}>
            <IconButton icon="alert-circle" size={16} iconColor="#DC2626" />
            <Text style={styles.statusTextRejected}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.notSubmitted]}>
            <IconButton icon="clock-outline" size={16} iconColor="#6B7280" />
            <Text style={styles.statusTextNotSubmitted}>Not Submitted</Text>
          </View>
        );
    }
  };

  const isRequiredFieldsFilled = () => {
    // Check required text fields
    const textFieldsValid = TEXT_FIELDS.filter((field) => field.required).every(
      (field) => {
        const value = kycDetails[field.key];
        return value && value.trim().length > 0;
      },
    );

    // Check required documents
    const documentsValid = REQUIRED_DOCUMENTS.filter(
      (doc) => doc.required,
    ).every((doc) => kycDetails[doc.key]);

    return (
      textFieldsValid && documentsValid && Object.keys(fieldErrors).length === 0
    );
  };

  const handleSubmit = () => {
    // Validate all required fields
    if (!isRequiredFieldsFilled()) {
      Alert.alert(
        "Error",
        "Please fill all required fields and upload required documents",
      );
      return;
    }

    // Show verifying state
    setIsVerifying(true);

    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false);

      if (mode === "test") {
        onNext({
          kycDetails: kycDetails as KYCDetails,
          isKycCompleted: true,
          kycStatus: "verified",
        });
      } else {
        onNext({
          kycDetails: kycDetails as KYCDetails,
          isKycCompleted: false,
          kycStatus: "pending",
        });
      }
    }, 1500);
  };

  const handleBack = () => {
    onBack();
  };

  const requiredTextCount = TEXT_FIELDS.filter((f) => f.required).length;
  const requiredDocCount = REQUIRED_DOCUMENTS.filter((d) => d.required).length;
  const totalRequired = requiredTextCount + requiredDocCount;

  const filledTextCount = TEXT_FIELDS.filter(
    (f) => f.required && kycDetails[f.key],
  ).length;
  const filledDocCount = REQUIRED_DOCUMENTS.filter(
    (d) => d.required && kycDetails[d.key],
  ).length;
  const filledTotal = filledTextCount + filledDocCount;
  const progress = (filledTotal / totalRequired) * 100;

  // If already verified, show success state
  if (verificationComplete) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.gradient}>
          <View style={styles.verifiedContainer}>
            <View style={styles.verifiedIcon}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.verifiedCircle}
              >
                <IconButton icon="check" size={40} iconColor="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.verifiedTitle}>KYC Already Verified</Text>
            <Text style={styles.verifiedSubtitle}>
              Your identity has been verified successfully
            </Text>

            <TouchableOpacity
              style={styles.verifiedButton}
              onPress={() =>
                onNext({ kycStatus: "verified", isKycCompleted: true })
              }
            >
              <LinearGradient
                colors={["#0066CC", "#0099FF"]}
                style={styles.verifiedButtonGradient}
              >
                <Text style={styles.verifiedButtonText}>
                  Continue to Bank Details
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.container}>
        <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.gradient}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Card */}
            <Surface style={styles.headerCard}>
              <View style={styles.headerIcon}>
                <IconButton
                  icon="shield-account"
                  size={24}
                  iconColor="#0066CC"
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>KYC Verification</Text>
                <Text style={styles.subtitle}>
                  Enter your details and upload documents
                </Text>
              </View>
            </Surface>

            {/* Form Card */}
            <Surface style={styles.formCard}>
              {/* Progress Steps */}
              <View style={styles.progressContainer}>
                <View style={styles.progressStep}>
                  <View
                    style={[styles.progressDot, styles.progressDotCompleted]}
                  >
                    <IconButton icon="check" size={12} iconColor="#FFFFFF" />
                  </View>
                  <Text style={styles.progressTextCompleted}>Basic</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                  <LinearGradient
                    colors={["#0066CC", "#0099FF"]}
                    style={styles.progressDotActive}
                  />
                  <Text style={styles.progressTextActive}>KYC</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                  <View
                    style={[styles.progressDot, styles.progressDotInactive]}
                  />
                  <Text style={styles.progressText}>Bank</Text>
                </View>
              </View>

              {/* KYC Status */}
              <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>Status:</Text>
                {getKYCStatusBadge()}
              </View>

              {/* Upload Progress */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={["#0066CC", "#0099FF"]}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.progressText}>
                  {filledTotal}/{totalRequired} Completed
                </Text>
              </View>

              {/* Rejection Message */}
              {kycStatus === "rejected" && (
                <Surface style={styles.rejectionCard}>
                  <View style={styles.rejectionContent}>
                    <IconButton
                      icon="alert-circle"
                      size={16}
                      iconColor="#DC2626"
                    />
                    <View style={styles.rejectionText}>
                      <Text style={styles.rejectionTitle}>KYC Rejected</Text>
                      <Text style={styles.rejectionMessage}>
                        Please check and resubmit your details
                      </Text>
                    </View>
                  </View>
                </Surface>
              )}

              {/* Text Fields Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Personal Details</Text>
                <Text style={styles.sectionSubtitle}>
                  Enter your identification numbers
                </Text>

                {TEXT_FIELDS.map((field) => (
                  <View key={field.key} style={styles.fieldContainer}>
                    <Text style={styles.label}>
                      {field.label}{" "}
                      {field.required && (
                        <Text style={styles.requiredStar}>*</Text>
                      )}
                    </Text>
                    <PaperTextInput
                      mode="outlined"
                      value={kycDetails[field.key] || ""}
                      onChangeText={(text) => handleTextChange(field.key, text)}
                      onBlur={() => handleBlur(field.key)}
                      keyboardType={field.keyboardType || "default"}
                      error={!!fieldErrors[field.key]}
                      style={styles.input}
                      outlineColor="#E5E7EB"
                      activeOutlineColor="#0066CC"
                      left={
                        <PaperTextInput.Icon
                          icon={field.icon}
                          color="#6B7280"
                        />
                      }
                      placeholder={field.placeholder}
                      placeholderTextColor="#9CA3AF"
                      maxLength={field.maxLength}
                    />
                    {fieldErrors[field.key] && (
                      <HelperText type="error" style={styles.errorText}>
                        {fieldErrors[field.key]}
                      </HelperText>
                    )}
                  </View>
                ))}
              </View>

              {/* Document Upload Section */}
              <View style={[styles.sectionContainer, styles.documentSection]}>
                <Text style={styles.sectionTitle}>Document Uploads</Text>
                <Text style={styles.sectionSubtitle}>
                  Upload clear images of your documents
                </Text>

                {REQUIRED_DOCUMENTS.map((doc, index) => (
                  <View key={doc.key} style={styles.documentItem}>
                    {index > 0 && <View style={styles.documentDivider} />}
                    <FileUploader
                      label={doc.label}
                      required={doc.required}
                      description={doc.description}
                      icon={doc.icon}
                      value={kycDetails[doc.key]}
                      onUpload={(base64) =>
                        handleDocumentUpload(doc.key, base64)
                      }
                      onRemove={() => handleDocumentRemove(doc.key)}
                      uploading={uploadingFor === doc.key}
                      mode={mode}
                      accept={doc.acceptedTypes?.join(",") || "*"}
                    />
                  </View>
                ))}
              </View>

              {/* Test Mode Notice */}
              {mode === "test" && (
                <Surface style={styles.testModeCard}>
                  <View style={styles.testModeContent}>
                    <IconButton icon="flask" size={16} iconColor="#92400E" />
                    <View style={styles.testModeText}>
                      <Text style={styles.testModeTitle}>Test Mode Active</Text>
                      <Text style={styles.testModeDescription}>
                        Auto-approved in test mode
                      </Text>
                    </View>
                  </View>
                </Surface>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  disabled={isVerifying}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!isRequiredFieldsFilled() || isVerifying) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!isRequiredFieldsFilled() || isVerifying}
                >
                  <LinearGradient
                    colors={
                      isRequiredFieldsFilled() && !isVerifying
                        ? ["#0066CC", "#0099FF"]
                        : ["#9CA3AF", "#9CA3AF"]
                    }
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isVerifying ? (
                      <View style={styles.verifyingContent}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text
                          style={[
                            styles.submitButtonText,
                            styles.verifyingText,
                          ]}
                        >
                          Verifying...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {mode === "test" ? "Continue" : "Submit KYC"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Surface>
          </ScrollView>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  progressStep: {
    alignItems: "center",
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotCompleted: {
    backgroundColor: "#10B981",
  },
  progressDotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  progressDotInactive: {
    backgroundColor: "#E5E7EB",
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  progressTextCompleted: {
    fontSize: 9,
    color: "#10B981",
    marginTop: 4,
    fontWeight: "500",
  },
  progressTextActive: {
    fontSize: 9,
    color: "#0066CC",
    marginTop: 4,
    fontWeight: "600",
  },
  progressText: {
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    height: 28,
  },
  verified: {
    backgroundColor: "#D1FAE5",
  },
  pending: {
    backgroundColor: "#FEF3C7",
  },
  rejected: {
    backgroundColor: "#FEE2E2",
  },
  notSubmitted: {
    backgroundColor: "#F3F4F6",
  },
  statusTextVerified: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "500",
    marginRight: 4,
  },
  statusTextPending: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "500",
    marginRight: 4,
  },
  statusTextRejected: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "500",
    marginRight: 4,
  },
  statusTextNotSubmitted: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginRight: 4,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  rejectionCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  rejectionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  rejectionText: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#991B1B",
  },
  rejectionMessage: {
    fontSize: 11,
    color: "#7F1D1D",
    marginTop: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  documentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  requiredStar: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    height: 48,
  },
  errorText: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 2,
  },
  documentsContainer: {
    marginBottom: 8,
  },
  documentItem: {
    marginBottom: 8,
  },
  documentDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
  },
  testModeCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    marginVertical: 8,
    overflow: "hidden",
  },
  testModeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  testModeText: {
    flex: 1,
  },
  testModeTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  testModeDescription: {
    fontSize: 11,
    color: "#92400E",
    marginTop: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  submitButton: {
    flex: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 10,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  verifyingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyingText: {
    marginLeft: 8,
  },
  verifiedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 400,
  },
  verifiedIcon: {
    marginBottom: 24,
  },
  verifiedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  verifiedSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },
  verifiedButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  verifiedButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  verifiedButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default KYCVerification;
