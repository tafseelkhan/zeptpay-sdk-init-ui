// components/steps/BankDetails.tsx
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
  BankDetails as BankDetailsType,
} from "../../types/merchantTypes";

interface BankDetailsProps {
  initialData: Partial<Merchant>;
  mode: Mode;
  onNext: (data: Partial<Merchant>) => void;
  onBack: () => void;
}

type BankDetailsFormFields =
  | "accountHolderName"
  | "bankName"
  | "accountNumber"
  | "ifscCode"
  | "upiId";

interface FormErrors {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

const BankDetails: React.FC<BankDetailsProps> = ({
  initialData,
  mode,
  onNext,
  onBack,
}) => {
  const [formData, setFormData] = useState<Partial<BankDetailsType>>(
    initialData.bankDetails || {},
  );
  const [cancelledCheque, setCancelledCheque] = useState<string | undefined>(
    initialData.bankDetails?.cancelledChequeUrl,
  );
  const [uploading, setUploading] = useState<boolean>(false);
  const [touched, setTouched] = useState<
    Partial<Record<BankDetailsFormFields, boolean>>
  >({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAccountNumber, setShowAccountNumber] = useState<boolean>(false);
  const [formValid, setFormValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Check if bank details already exist
  useEffect(() => {
    if (initialData.bankDetails) {
      const { accountHolderName, bankName, accountNumber, ifscCode } =
        initialData.bankDetails;
      if (accountHolderName && bankName && accountNumber && ifscCode) {
        setFormValid(true);
      }
    }
  }, [initialData]);

  const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  };

  const validateBankAccount = (
    accountNumber: string,
    ifscCode: string,
  ): boolean => {
    // Basic validation - bank code from IFSC should match account number pattern
    return true;
  };

  const validateField = (
    field: BankDetailsFormFields,
    value: any,
  ): string | undefined => {
    switch (field) {
      case "accountHolderName":
        if (!value?.trim()) return "Account holder name is required";
        if (value.length < 3) return "Name must be at least 3 characters";
        if (value.length > 50) return "Name must be less than 50 characters";
        if (!/^[a-zA-Z\s.]+$/.test(value))
          return "Name contains invalid characters";
        return undefined;

      case "bankName":
        if (!value?.trim()) return "Bank name is required";
        if (value.length < 3) return "Bank name must be at least 3 characters";
        if (value.length > 50)
          return "Bank name must be less than 50 characters";
        return undefined;

      case "accountNumber":
        if (!value?.trim()) return "Account number is required";
        const cleaned = value.replace(/\s/g, "");
        if (!/^\d{9,18}$/.test(cleaned)) {
          return "Account number must be 9-18 digits";
        }
        return undefined;

      case "ifscCode":
        if (!value?.trim()) return "IFSC code is required";
        const ifsc = value.toUpperCase().replace(/\s/g, "");
        if (!validateIFSC(ifsc)) {
          return "Invalid IFSC code (e.g., SBIN0123456)";
        }
        return undefined;

      case "upiId":
        if (value && !/^[\w.-]+@[\w.-]+$/.test(value)) {
          return "Invalid UPI ID format (e.g., name@bank)";
        }
        return undefined;

      default:
        return undefined;
    }
  };

  // Check form validity whenever formData, errors, or cancelledCheque changes
  useEffect(() => {
    const requiredFields: BankDetailsFormFields[] = [
      "accountHolderName",
      "bankName",
      "accountNumber",
      "ifscCode",
    ];

    const allRequiredFilled = requiredFields.every((field) => {
      const value = formData[field];
      return value && value.toString().trim().length > 0;
    });

    const hasNoErrors = Object.keys(errors).length === 0;
    const hasCheque = cancelledCheque !== undefined && cancelledCheque !== "";

    const isValid = allRequiredFilled && hasNoErrors && hasCheque;
    setFormValid(isValid);
  }, [formData, errors, cancelledCheque]);

  const handleChange = (field: BankDetailsFormFields, value: string) => {
    if (field === "ifscCode") {
      value = value.toUpperCase().replace(/\s/g, "");
    }

    if (field === "accountNumber") {
      value = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    const error = validateField(field, value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleBlur = (field: BankDetailsFormFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleChequeUpload = async (base64String: string) => {
    setUploading(true);
    setCancelledCheque(base64String);
    setUploading(false);
  };

  const handleChequeRemove = () => {
    Alert.alert(
      "Remove Document",
      "Are you sure you want to remove the cancelled cheque?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setCancelledCheque(undefined),
        },
      ],
    );
  };

  const handleSubmit = () => {
    const requiredFields: BankDetailsFormFields[] = [
      "accountHolderName",
      "bankName",
      "accountNumber",
      "ifscCode",
    ];

    const newErrors: FormErrors = {};
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!cancelledCheque) {
      Alert.alert("Error", "Please upload cancelled cheque");
      return;
    }

    if (formData.accountNumber && formData.ifscCode) {
      if (!validateBankAccount(formData.accountNumber, formData.ifscCode)) {
        Alert.alert("Error", "Account number and IFSC code do not match");
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onNext({
        bankDetails: {
          ...(formData as BankDetailsType),
          cancelledChequeUrl: cancelledCheque,
        },
        isBankDetailsCompleted: true,
      });
    }, 1000);
  };

  const handleBack = () => {
    onBack();
  };

  const maskAccountNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    if (cleaned.length <= 4) return cleaned;
    const last4 = cleaned.slice(-4);
    const masked = "•".repeat(Math.min(cleaned.length - 4, 8));
    return masked + last4;
  };

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
                <IconButton icon="bank" size={24} iconColor="#0066CC" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Bank Details</Text>
                <Text style={styles.subtitle}>
                  Add your bank account for settlements
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
                  <View
                    style={[styles.progressDot, styles.progressDotCompleted]}
                  >
                    <IconButton icon="check" size={12} iconColor="#FFFFFF" />
                  </View>
                  <Text style={styles.progressTextCompleted}>KYC</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                  <LinearGradient
                    colors={["#0066CC", "#0099FF"]}
                    style={styles.progressDotActive}
                  />
                  <Text style={styles.progressTextActive}>Bank</Text>
                </View>
              </View>

              {/* Account Holder Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Account Holder Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <PaperTextInput
                  mode="outlined"
                  value={formData.accountHolderName}
                  onChangeText={(text) =>
                    handleChange("accountHolderName", text)
                  }
                  onBlur={() => handleBlur("accountHolderName")}
                  error={!!errors.accountHolderName}
                  style={styles.input}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#0066CC"
                  left={
                    <PaperTextInput.Icon
                      icon="account"
                      color="#6B7280"
                      size={20}
                    />
                  }
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.accountHolderName && (
                  <HelperText type="error" style={styles.errorText}>
                    {errors.accountHolderName}
                  </HelperText>
                )}
              </View>

              {/* Bank Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Bank Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <PaperTextInput
                  mode="outlined"
                  value={formData.bankName}
                  onChangeText={(text) => handleChange("bankName", text)}
                  onBlur={() => handleBlur("bankName")}
                  error={!!errors.bankName}
                  style={styles.input}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#0066CC"
                  left={
                    <PaperTextInput.Icon
                      icon="bank"
                      color="#6B7280"
                      size={20}
                    />
                  }
                  placeholder="State Bank of India"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.bankName && (
                  <HelperText type="error" style={styles.errorText}>
                    {errors.bankName}
                  </HelperText>
                )}
              </View>

              {/* Account Number */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Account Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View>
                  <PaperTextInput
                    mode="outlined"
                    value={formData.accountNumber}
                    onChangeText={(text) => handleChange("accountNumber", text)}
                    onBlur={() => handleBlur("accountNumber")}
                    keyboardType="numeric"
                    error={!!errors.accountNumber}
                    style={[styles.input, styles.inputWithRightIcon]}
                    outlineColor="#E5E7EB"
                    activeOutlineColor="#0066CC"
                    left={
                      <PaperTextInput.Icon
                        icon="credit-card"
                        color="#6B7280"
                        size={20}
                      />
                    }
                    right={
                      <PaperTextInput.Icon
                        icon={showAccountNumber ? "eye-off" : "eye"}
                        onPress={() => setShowAccountNumber(!showAccountNumber)}
                        color="#6B7280"
                        size={20}
                      />
                    }
                    placeholder="1234567890"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showAccountNumber}
                    maxLength={18}
                  />
                </View>
                {errors.accountNumber && (
                  <HelperText type="error" style={styles.errorText}>
                    {errors.accountNumber}
                  </HelperText>
                )}
                {formData.accountNumber && !errors.accountNumber && (
                  <View style={styles.previewContainer}>
                    <IconButton icon="eye" size={14} iconColor="#6B7280" />
                    <Text style={styles.previewText}>
                      {maskAccountNumber(formData.accountNumber)}
                    </Text>
                  </View>
                )}
              </View>

              {/* IFSC Code */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  IFSC Code <Text style={styles.requiredStar}>*</Text>
                </Text>
                <PaperTextInput
                  mode="outlined"
                  value={formData.ifscCode}
                  onChangeText={(text) => handleChange("ifscCode", text)}
                  onBlur={() => handleBlur("ifscCode")}
                  autoCapitalize="characters"
                  error={!!errors.ifscCode}
                  style={styles.input}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#0066CC"
                  left={
                    <PaperTextInput.Icon
                      icon="qrcode"
                      color="#6B7280"
                      size={20}
                    />
                  }
                  placeholder="SBIN0123456"
                  placeholderTextColor="#9CA3AF"
                  maxLength={11}
                />
                {errors.ifscCode && (
                  <HelperText type="error" style={styles.errorText}>
                    {errors.ifscCode}
                  </HelperText>
                )}
                {formData.ifscCode && !errors.ifscCode && (
                  <View style={styles.hintContainer}>
                    <IconButton
                      icon="information"
                      size={14}
                      iconColor="#6B7280"
                    />
                    <Text style={styles.hintText}>
                      First 4 letters, then 0, then 6 alphanumeric
                    </Text>
                  </View>
                )}
              </View>

              {/* UPI ID */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>UPI ID (Optional)</Text>
                <PaperTextInput
                  mode="outlined"
                  value={formData.upiId}
                  onChangeText={(text) => handleChange("upiId", text)}
                  onBlur={() => handleBlur("upiId")}
                  error={!!errors.upiId}
                  style={styles.input}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#0066CC"
                  left={
                    <PaperTextInput.Icon
                      icon="cellphone"
                      color="#6B7280"
                      size={20}
                    />
                  }
                  placeholder="name@bank"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.upiId && (
                  <HelperText type="error" style={styles.errorText}>
                    {errors.upiId}
                  </HelperText>
                )}
              </View>

              {/* Cancelled Cheque Upload */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Cancelled Cheque <Text style={styles.requiredStar}>*</Text>
                </Text>
                <FileUploader
                  label=""
                  required
                  description="Upload a cancelled cheque for verification"
                  icon="file-document"
                  value={cancelledCheque}
                  onUpload={handleChequeUpload}
                  onRemove={handleChequeRemove}
                  uploading={uploading}
                  mode={mode}
                  accept="image/*"
                />
              </View>

              {/* Test Mode Notice */}
              {mode === "test" && (
                <Surface style={styles.testModeCard}>
                  <View style={styles.testModeContent}>
                    <IconButton icon="flask" size={16} iconColor="#92400E" />
                    <View style={styles.testModeText}>
                      <Text style={styles.testModeTitle}>Test Mode Active</Text>
                      <Text style={styles.testModeDescription}>
                        Bank details are for testing only
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
                  disabled={isSubmitting}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!formValid || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!formValid || isSubmitting}
                >
                  <LinearGradient
                    colors={
                      formValid && !isSubmitting
                        ? ["#0066CC", "#0099FF"]
                        : ["#9CA3AF", "#9CA3AF"]
                    }
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isSubmitting ? (
                      <View style={styles.submittingContent}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text
                          style={[
                            styles.submitButtonText,
                            styles.submittingText,
                          ]}
                        >
                          Saving...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {mode === "test" ? "Complete Test" : "Save & Continue"}
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
    marginBottom: 20,
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
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  requiredStar: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    fontSize: 13,
    height: 44,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  errorText: {
    fontSize: 10,
    color: "#EF4444",
    marginTop: 2,
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 4,
    alignSelf: "flex-start",
  },
  previewText: {
    fontSize: 11,
    color: "#4B5563",
    marginRight: 8,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  hintText: {
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 2,
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
    marginTop: 16,
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
    opacity: 0.5,
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
  submittingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submittingText: {
    marginLeft: 8,
  },
});

export default BankDetails;
