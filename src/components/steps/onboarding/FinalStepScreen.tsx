import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  Surface,
  IconButton,
} from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import { useZeptPay } from "../../../hooks/useZeptPay";
import { useMerchantOnboarding } from "../../../hooks/useMerchantOnboarding";
import { CreateMerchantPayload } from "../../../types/merchantTypes";
import { UI_TEXTS } from "../../../etc/constants";

interface FinalStepScreenProps {
  publicKey: string;
  onSuccess: (response: any) => void;
  onError?: (error: any) => void;
  initialData?: Partial<CreateMerchantPayload>;
  onSubmitToBackend?: (data: any) => Promise<any>;
}

export const FinalStepScreen: React.FC<FinalStepScreenProps> = ({
  publicKey,
  onSuccess,
  onError,
  initialData = {},
  onSubmitToBackend,
}) => {
  // Use both hooks
  const {
    loading: zeptpayLoading,
    error: zeptpayError,
    submitToBackend,
    clearError: clearZeptPayError,
  } = useZeptPay();
  const {
    loading: merchantLoading,
    error: merchantError,
    createMerchant,
    clearError: clearMerchantError,
  } = useMerchantOnboarding();

  const [formData] = useState<CreateMerchantPayload>({
    merchantName: initialData.merchantName || "",
    merchantEmail: initialData.merchantEmail || "",
    merchantPhone: initialData.merchantPhone || "",
    businessName: initialData.businessName || "",
    businessType: initialData.businessType || "individual",
    businessCategory: initialData.businessCategory || "",
    country: initialData.country || "India",
    nationality: initialData.nationality || "Indian",
    mode: initialData.mode || "test",
    ...initialData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "backend" | "merchant">("form");
  const [backendResponse, setBackendResponse] = useState<any>(null);

  // Handle errors from both hooks
  useEffect(() => {
    if (zeptpayError) {
      onError?.(zeptpayError);
      clearZeptPayError();
    }
  }, [zeptpayError, onError, clearZeptPayError]);

  useEffect(() => {
    if (merchantError) {
      onError?.(merchantError);
      clearMerchantError();
    }
  }, [merchantError, onError, clearMerchantError]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      let backendResult = null;

      // 📤 STEP 1: Developer ka backend API call (if provided)
      if (onSubmitToBackend) {
        setStep("backend");
        console.log("📤 Calling developer backend API...");

        backendResult = await submitToBackend(formData, onSubmitToBackend);
        setBackendResponse(backendResult);

        console.log("✅ Backend API response received:", backendResult);
      }

      // 🚀 STEP 2: Create merchant in ZeptPay
      setStep("merchant");
      console.log("🚀 Creating merchant in ZeptPay...");

      const merchantResponse = await createMerchant(formData);

      console.log("✅ Merchant created in ZeptPay:", merchantResponse);

      // 🎉 STEP 3: Success callback with both responses
      onSuccess({
        backend: backendResult,
        merchant: merchantResponse,
      });
    } catch (err: any) {
      console.error("❌ Error:", err);
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = (): boolean => {
    const requiredFields: (keyof CreateMerchantPayload)[] = [
      "merchantName",
      "merchantEmail",
    ];
    if (formData.businessType === "company") {
      requiredFields.push("businessName");
    }

    const allFilled = requiredFields.every((field) => {
      const value = formData[field];
      return value && value.toString().trim().length > 0;
    });

    return allFilled;
  };

  const isLoading = isSubmitting || zeptpayLoading || merchantLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <Surface style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <LinearGradient
                colors={["#0066CC", "#0099FF"]}
                style={styles.iconGradient}
              >
                <IconButton icon="check-circle" size={24} iconColor="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{UI_TEXTS.FINAL_STEP.TITLE}</Text>
              <Text style={styles.subtitle}>
                {UI_TEXTS.FINAL_STEP.SUBTITLE}
              </Text>
            </View>
          </Surface>

          {/* Form Card */}
          <Surface style={styles.formCard}>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, styles.progressDotCompleted]}>
                  <IconButton icon="check" size={12} iconColor="#FFFFFF" />
                </View>
                <Text style={styles.progressText}>Basic</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, styles.progressDotCompleted]}>
                  <IconButton icon="check" size={12} iconColor="#FFFFFF" />
                </View>
                <Text style={styles.progressText}>KYC</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, styles.progressDotCompleted]}>
                  <IconButton icon="check" size={12} iconColor="#FFFFFF" />
                </View>
                <Text style={styles.progressText}>Bank</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <LinearGradient
                  colors={["#0066CC", "#0099FF"]}
                  style={styles.progressDotActive}
                />
                <Text style={styles.progressTextActive}>Final</Text>
              </View>
            </View>

            {/* Review Section */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Review Your Information</Text>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Business Name</Text>
                <Text style={styles.reviewValue}>
                  {formData.businessName || formData.merchantName}
                </Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Contact Email</Text>
                <Text style={styles.reviewValue}>{formData.merchantEmail}</Text>
              </View>

              {formData.merchantPhone && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Phone</Text>
                  <Text style={styles.reviewValue}>
                    {formData.merchantPhone}
                  </Text>
                </View>
              )}

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Business Type</Text>
                <Text style={styles.reviewValue}>
                  {formData.businessType === "company"
                    ? "Company"
                    : "Individual"}
                </Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Country</Text>
                <Text style={styles.reviewValue}>{formData.country}</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Mode</Text>
                <View
                  style={[
                    styles.modeBadge,
                    formData.mode === "live"
                      ? styles.liveBadge
                      : styles.testBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      formData.mode === "live"
                        ? styles.liveText
                        : styles.testText,
                    ]}
                  >
                    {formData.mode?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Terms Agreement */}
            <View style={styles.termsContainer}>
              <IconButton
                icon="checkbox-marked-circle"
                size={20}
                iconColor="#10B981"
              />
              <Text style={styles.termsText}>
                I confirm that all information provided is accurate and
                complete.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid() || isLoading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid() || isLoading}
            >
              <LinearGradient
                colors={
                  isFormValid() && !isLoading
                    ? ["#0066CC", "#0099FF"]
                    : ["#9CA3AF", "#9CA3AF"]
                }
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      {step === "backend"
                        ? "Calling Backend..."
                        : step === "merchant"
                          ? "Creating Account..."
                          : UI_TEXTS.FINAL_STEP.PROCESSING}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {UI_TEXTS.FINAL_STEP.CREATE_BUTTON}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Surface>
        </ScrollView>
      </LinearGradient>
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
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerIcon: {
    marginRight: 12,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 24,
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
    width: 20,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  progressText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
  },
  progressTextActive: {
    fontSize: 10,
    color: "#0066CC",
    marginTop: 4,
    fontWeight: "600",
  },
  reviewSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  reviewLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadge: {
    backgroundColor: "#FEE2E2",
  },
  testBadge: {
    backgroundColor: "#FEF3C7",
  },
  modeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  liveText: {
    color: "#DC2626",
  },
  testText: {
    color: "#D97706",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    marginLeft: 8,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});

export default FinalStepScreen;
