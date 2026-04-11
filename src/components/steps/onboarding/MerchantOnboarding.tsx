import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import {
  ActivityIndicator,
  Snackbar,
  Text,
  Surface,
  IconButton,
  Avatar,
} from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";

import StepIndicator from "../../common/StepIndicator";
import BasicDetailsForm from "../BasicDetailsForm";
import KYCVerification from "../KYCVerification";
import BankDetails from "../BankDetails";
import { FinalStepScreen } from "./FinalStepScreen";
import { OnboardingCompleteScreen } from "../OnboardingComplete";
import {
  Merchant,
  MerchantOnboardingProps,
  StepConfig,
  FormErrors,
  StepCompletion,
} from "../../../types/merchantTypes";
import { useZeptPaySafe } from "../../../contexts/ZeptPayProvider";
import { useMerchantOnboarding } from "../../../hooks/useMerchantOnboarding";
import { verifyPublicKey } from "../../../api/clients/verifyPublicKey";
import { tokenService } from "../../../utils/token/tokenService";

const { width } = Dimensions.get("window");

// ✅ Polyfill for Object.values (for older TypeScript targets)
const getObjectValues = <T extends object>(obj: T): T[keyof T][] => {
  return Object.keys(obj).map((key) => obj[key as keyof T]);
};

interface ExtendedStepConfig extends StepConfig {
  icon?: string;
}

interface ExtendedMerchantOnboardingProps extends MerchantOnboardingProps {
  onSubmitToBackend?: (data: any) => Promise<any>;
}

const STEPS: ExtendedStepConfig[] = [
  {
    id: 1,
    name: "Basic Details",
    key: "basic",
    isRequired: true,
    icon: "account",
  },
  {
    id: 2,
    name: "KYC Verification",
    key: "kyc",
    isRequired: true,
    icon: "shield-account",
  },
  { id: 3, name: "Bank Details", key: "bank", isRequired: true, icon: "bank" },
  {
    id: 4,
    name: "Final Review",
    key: "final",
    isRequired: true,
    icon: "file-document",
  },
  {
    id: 5,
    name: "Complete",
    key: "complete",
    isRequired: false,
    icon: "check-circle",
  },
];

const DEFAULT_LOGO = require("../../../assets/images/zeptpay.png");

const MerchantOnboardingSheet: React.FC<ExtendedMerchantOnboardingProps> = ({
  merchantId,
  mode,
  isKycCompleted,
  isBankDetailsCompleted,
  kycStatus,
  status,
  initialStep = 1,
  initialData = {},
  onNext,
  onBack,
  onComplete,
  onSubmitToBackend,
  loading: externalLoading = false,
}) => {
  const zeptpay = useZeptPaySafe();
  const {
    loading: merchantLoading,
    error: merchantError,
    createMerchant,
    clearError,
  } = useMerchantOnboarding();

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidProvider, setIsValidProvider] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(
    new Animated.Value(initialStep / STEPS.length),
  ).current;

  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [merchantData, setMerchantData] = useState<Partial<Merchant>>({
    mode,
    kycStatus,
    isKycCompleted,
    isBankDetailsCompleted,
    status,
    ...initialData,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showError, setShowError] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [merchantResponse, setMerchantResponse] = useState<any>(null);

  const [stepCompletion, setStepCompletion] = useState<StepCompletion>(() => {
    const basicCompleted = !!(
      initialData.merchantName &&
      initialData.merchantName.trim() !== "" &&
      initialData.merchantEmail &&
      initialData.merchantEmail.trim() !== ""
    );

    return {
      basic: basicCompleted,
      kyc: isKycCompleted || false,
      bank: isBankDetailsCompleted || false,
      final: false,
    };
  });

  // Handle merchant errors
  useEffect(() => {
    if (merchantError) {
      Alert.alert("Error", merchantError.userMessage);
      clearError();
    }
  }, [merchantError]);

  useEffect(() => {
    const verifyProviderConfig = async () => {
      if (!zeptpay) {
        setVerificationError("ZeptPay provider not found");
        setIsValidProvider(false);
        setIsVerifying(false);
        return;
      }

      const { publicKey } = zeptpay;

      if (!publicKey) {
        setVerificationError("Public key is required");
        setIsValidProvider(false);
        setIsVerifying(false);
        return;
      }

      try {
        setIsVerifying(true);
        await verifyPublicKey(publicKey);
        setIsValidProvider(true);
        setVerificationError(null);
      } catch (err: any) {
        setVerificationError(err.message || "Invalid public key");
        setIsValidProvider(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyProviderConfig();
  }, [zeptpay]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const animateStepTransition = (direction: "next" | "back") => {
    if (isAnimating) return;
    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === "next" ? -50 : 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(direction === "next" ? 50 : -50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const handleNext = (stepData: Partial<Merchant>) => {
    const updatedData = { ...merchantData, ...stepData };
    setMerchantData(updatedData);

    if (currentStep === 1) {
      const basicCompleted = !!(
        updatedData.merchantName &&
        updatedData.merchantName.trim() !== "" &&
        updatedData.merchantEmail &&
        updatedData.merchantEmail.trim() !== ""
      );
      setStepCompletion((prev) => ({ ...prev, basic: basicCompleted }));
    } else if (currentStep === 2) {
      const kycCompleted =
        stepData.isKycCompleted === true || stepData.kycStatus === "verified";
      setStepCompletion((prev) => ({ ...prev, kyc: kycCompleted }));
    } else if (currentStep === 3) {
      const bankCompleted = stepData.isBankDetailsCompleted === true;
      setStepCompletion((prev) => ({ ...prev, bank: bankCompleted }));
    } else if (currentStep === 4) {
      setStepCompletion((prev) => ({ ...prev, final: true }));
    }

    onNext(stepData, currentStep);

    if (currentStep < STEPS.length) {
      animateStepTransition("next");
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 150);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      animateStepTransition("back");
      setTimeout(() => {
        setCurrentStep((prev) => {
          const newStep = prev - 1;
          onBack(newStep);
          return newStep;
        });
      }, 150);
    }
  };

  const validateStepData = useCallback((): boolean => {
    const requiredSteps = STEPS.filter(
      (step) => step.isRequired && step.id < 5,
    );
    const missingSteps = requiredSteps.filter(
      (step) => !stepCompletion[step.key as keyof StepCompletion],
    );

    if (missingSteps.length > 0) {
      if (missingSteps.some((s) => s.key === "basic")) {
        setErrors({ merchantName: "Please complete all required fields" });
        setShowError(true);
        return false;
      }

      if (missingSteps.some((s) => s.key === "kyc")) {
        Alert.alert("KYC Pending", "Please complete KYC verification first", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to KYC",
            onPress: () => {
              animateStepTransition("next");
              setCurrentStep(2);
            },
          },
        ]);
        return false;
      }

      if (missingSteps.some((s) => s.key === "bank")) {
        Alert.alert("Bank Details Pending", "Please add bank details first", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Bank Details",
            onPress: () => {
              animateStepTransition("next");
              setCurrentStep(3);
            },
          },
        ]);
        return false;
      }

      if (missingSteps.some((s) => s.key === "final")) {
        Alert.alert(
          "Review Pending",
          "Please review your information on the final step",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Go to Final Step",
              onPress: () => {
                animateStepTransition("next");
                setCurrentStep(4);
              },
            },
          ],
        );
        return false;
      }

      return false;
    }

    return true;
  }, [stepCompletion]);

  const handleFinalStepSuccess = async (response: any) => {
    setMerchantResponse(response);
    setStepCompletion((prev) => ({ ...prev, final: true }));

    setTimeout(() => {
      setCurrentStep(5);
    }, 500);
  };

  const handleFinalStepError = (error: any) => {
    Alert.alert("Error", error.userMessage || "Failed to create merchant");
  };

  const handleComplete = useCallback(() => {
    if (!validateStepData()) {
      return;
    }

    const completeMerchantData: Merchant = {
      merchantId:
        merchantData.merchantId ||
        merchantData._id ||
        merchantResponse?.merchant?.merchantId ||
        "",
      merchantName: merchantData.merchantName || "",
      merchantEmail: merchantData.merchantEmail || "",
      merchantPhone: merchantData.merchantPhone || "",
      merchantDID: merchantData.merchantDID || "",
      businessName: merchantData.businessName,
      businessType: merchantData.businessType || "individual",
      businessCategory: merchantData.businessCategory,
      country: merchantData.country || "India",
      nationality: merchantData.nationality || "Indian",
      dob: merchantData.dob,
      bankDetails: merchantData.bankDetails,
      kycDetails: merchantData.kycDetails,
      mode: mode || "test",
      kycStatus: stepCompletion.kyc ? "verified" : kycStatus || "pending",
      isKycCompleted: stepCompletion.kyc,
      isBankDetailsCompleted: stepCompletion.bank,
      status:
        status ||
        (mode === "live" && stepCompletion.kyc && stepCompletion.bank
          ? "active"
          : "pending"),
      createdAt:
        (merchantData as any).createdAt ||
        merchantResponse?.merchant?.createdAt ||
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onComplete(completeMerchantData);
  }, [
    merchantData,
    mode,
    status,
    kycStatus,
    stepCompletion,
    merchantResponse,
    onComplete,
    validateStepData,
  ]);

  const getStepTitle = () => {
    const step = STEPS.find((s) => s.id === currentStep);
    return step?.name || "";
  };

  const renderProviderVerification = () => {
    if (isVerifying) {
      return (
        <View style={styles.verificationContainer}>
          <LinearGradient
            colors={["#0066CC", "#0099FF"]}
            style={styles.verificationCircle}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.verificationText}>
            Verifying ZeptPay configuration...
          </Text>
        </View>
      );
    }

    if (!isValidProvider) {
      return (
        <View style={styles.verificationContainer}>
          <View
            style={[styles.verificationCircle, { backgroundColor: "#FF4444" }]}
          >
            <IconButton icon="alert" size={40} iconColor="#FFFFFF" />
          </View>
          <Text style={[styles.verificationText, { color: "#FF4444" }]}>
            Invalid ZeptPay Configuration
          </Text>
          <Text style={styles.errorMessage}>
            {verificationError || "Invalid public key"}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderStep = () => {
    const isLoading = externalLoading || merchantLoading || isSubmitting;

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={["#0066CC", "#0099FF"]}
            style={styles.loadingCircle}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.loadingText}>
            {isSubmitting
              ? "Creating your account..."
              : "Loading your information..."}
          </Text>
        </View>
      );
    }

    const stepContent = (() => {
      switch (currentStep) {
        case 1:
          return (
            <BasicDetailsForm
              initialData={merchantData}
              onNext={(data) => handleNext(data)}
              errors={errors}
              setErrors={setErrors}
            />
          );
        case 2:
          return (
            <KYCVerification
              initialData={merchantData}
              mode={mode}
              kycStatus={kycStatus}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          );
        case 3:
          return (
            <BankDetails
              initialData={merchantData}
              mode={mode}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          );
        case 4:
          return (
            <FinalStepScreen
              publicKey={zeptpay?.publicKey || ""}
              onSuccess={handleFinalStepSuccess}
              onError={handleFinalStepError}
              onSubmitToBackend={onSubmitToBackend}
              initialData={{
                merchantName: merchantData.merchantName,
                merchantEmail: merchantData.merchantEmail,
                merchantPhone: merchantData.merchantPhone,
                businessName: merchantData.businessName,
                businessType: merchantData.businessType,
                businessCategory: merchantData.businessCategory,
                country: merchantData.country,
                nationality: merchantData.nationality,
                mode: mode,
              }}
            />
          );
        case 5:
          return (
            <OnboardingCompleteScreen
              developerData={merchantResponse}
              autoFetch={false}
            />
          );
        default:
          return null;
      }
    })();

    return (
      <Animated.View
        style={[
          styles.stepContentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {stepContent}
      </Animated.View>
    );
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (isVerifying || !isValidProvider) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={styles.gradient}>
          {renderProviderVerification()}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <LinearGradient colors={["#F8F9FA", "#FFFFFF"]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Surface style={styles.headerSurface}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {currentStep > 1 && currentStep < 5 && (
                  <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                    disabled={isAnimating}
                  >
                    <IconButton
                      icon="arrow-left"
                      size={24}
                      iconColor="#0066CC"
                    />
                  </TouchableOpacity>
                )}
                <View>
                  <Text style={styles.headerTitle}>{getStepTitle()}</Text>
                  <Text style={styles.headerSubtitle}>
                    Step {currentStep} of {STEPS.length}
                  </Text>
                </View>
              </View>

              <View style={styles.logoContainer}>
                <Avatar.Image size={32} source={DEFAULT_LOGO} />
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth }]}
                />
              </View>
            </View>
          </Surface>

          <View style={styles.stepIndicatorContainer}>
            <StepIndicator
              currentStep={currentStep}
              steps={STEPS}
              mode={mode}
              isKycCompleted={stepCompletion.kyc}
              isBankDetailsCompleted={stepCompletion.bank}
            />
          </View>

          <Surface style={styles.contentSurface}>
            <View style={styles.content}>{renderStep()}</View>
          </Surface>

          <Snackbar
            visible={showError}
            onDismiss={() => setShowError(false)}
            duration={5000}
            action={{
              label: "DISMISS",
              onPress: () => setShowError(false),
              textColor: "#FFFFFF",
            }}
            style={styles.snackbar}
          >
            {/* ✅ FIXED: Use getObjectValues instead of Object.values */}
            {getObjectValues(errors)[0] || "An error occurred"}
          </Snackbar>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerSurface: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 8,
    backgroundColor: "#F0F7FF",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666666",
    marginTop: 2,
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0066CC",
    borderRadius: 2,
  },
  stepIndicatorContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  contentSurface: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
  stepContentWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  snackbar: {
    backgroundColor: "#FF4444",
    marginBottom: 16,
    borderRadius: 8,
  },
  verificationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  verificationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  verificationText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
});

export default MerchantOnboardingSheet;
