// components/steps/BasicDetailsForm.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import {
  TextInput as PaperTextInput,
  Button,
  HelperText,
  Title,
  Surface,
  Chip,
  IconButton,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import CountryDropdown from "../common/CountryDropdown";
import { Merchant, FormErrors, BusinessType } from "../../types/merchantTypes";
import LinearGradient from "react-native-linear-gradient";

interface BasicDetailsFormProps {
  initialData: Partial<Merchant>;
  onNext: (data: Partial<Merchant>) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
}

const BasicDetailsForm: React.FC<BasicDetailsFormProps> = ({
  initialData,
  onNext,
  errors,
  setErrors,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const [formData, setFormData] = useState<Partial<Merchant>>({
    merchantName: "",
    merchantEmail: "",
    merchantPhone: "",
    businessName: "",
    businessType: "individual" as BusinessType,
    businessCategory: "",
    country: "India",
    nationality: "Indian",
    dob: "",
    ...initialData,
  });

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<FormErrors>({});

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateField = (
    field: keyof Merchant,
    value: any,
  ): string | undefined => {
    switch (field) {
      case "merchantName":
        if (!value?.trim()) return "Merchant name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 50) return "Name must be less than 50 characters";
        if (!/^[a-zA-Z\s'-]+$/.test(value))
          return "Name contains invalid characters";
        return undefined;

      case "merchantEmail":
        if (!value?.trim()) return "Email is required";
        const emailRegex =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!emailRegex.test(value)) return "Invalid email format";
        return undefined;

      case "merchantPhone":
        if (value && !/^\d{10}$/.test(value.replace(/\D/g, ""))) {
          return "Phone must be 10 digits";
        }
        return undefined;

      case "businessName":
        if (formData.businessType === "company" && !value?.trim()) {
          return "Business name is required for companies";
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (field: keyof Merchant, value: any) => {
    // Format phone number
    if (field === "merchantPhone") {
      value = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate on change
    const error = validateField(field, value);
    const newErrors = { ...localErrors };
    if (error) {
      newErrors[field] = error;
    } else {
      delete newErrors[field];
    }
    setLocalErrors(newErrors);
    setErrors(newErrors);
  };

  const handleBlur = (field: keyof Merchant) => {
    setFocusedField(null);
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    const newErrors = { ...localErrors };
    if (error) {
      newErrors[field] = error;
    } else {
      delete newErrors[field];
    }
    setLocalErrors(newErrors);
    setErrors(newErrors);
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      handleChange("dob", formattedDate);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const requiredFields: (keyof Merchant)[] = [
      "merchantName",
      "merchantEmail",
    ];

    if (formData.businessType === "company") {
      requiredFields.push("businessName");
    }

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setLocalErrors(newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (validateForm()) {
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onNext(formData);
      });
    }
  };

  const isFormValid = () => {
    const requiredFields = ["merchantName", "merchantEmail"];
    if (formData.businessType === "company") {
      requiredFields.push("businessName");
    }

    // Check if all required fields have values
    const allRequiredFilled = requiredFields.every((field) => {
      const value = formData[field as keyof Merchant];
      return typeof value === "string" && value.trim().length > 0;
    });

    // Check if there are any errors
    const hasNoErrors = Object.keys(localErrors).length === 0;

    return allRequiredFilled && hasNoErrors;
  };

  const businessCategories = [
    "Electronics",
    "Fashion",
    "Home & Living",
    "Books",
    "Sports",
    "Toys",
    "Automotive",
    "Health",
    "Food",
    "Other",
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.gradient}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Header Card */}
            <Surface style={styles.headerCard}>
              <View style={styles.headerIcon}>
                <IconButton
                  icon="account-details"
                  size={28}
                  iconColor="#0066CC"
                />
              </View>
              <View style={styles.headerText}>
                <Title style={styles.title}>Basic Information</Title>
                <Text style={styles.subtitle}>Tell us about yourself</Text>
              </View>
            </Surface>

            {/* Form Card */}
            <Surface style={styles.formCard}>
              {/* Compact Progress Steps */}
              <View style={styles.progressContainer}>
                <View style={styles.progressStep}>
                  <LinearGradient
                    colors={["#0066CC", "#0099FF"]}
                    style={styles.progressDot}
                  />
                  <Text style={styles.progressTextActive}>Basic</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                  <View
                    style={[styles.progressDot, styles.progressDotInactive]}
                  />
                  <Text style={styles.progressText}>KYC</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                  <View
                    style={[styles.progressDot, styles.progressDotInactive]}
                  />
                  <Text style={styles.progressText}>Bank</Text>
                </View>
              </View>

              {/* Merchant Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <PaperTextInput
                  mode="outlined"
                  value={formData.merchantName}
                  onChangeText={(text) => handleChange("merchantName", text)}
                  onBlur={() => handleBlur("merchantName")}
                  onFocus={() => handleFocus("merchantName")}
                  error={!!localErrors.merchantName || !!errors.merchantName}
                  style={styles.input}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#0066CC"
                  left={<PaperTextInput.Icon icon="account" color="#6B7280" />}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                />
                {(localErrors.merchantName || errors.merchantName) && (
                  <HelperText type="error" style={styles.errorText}>
                    {localErrors.merchantName || errors.merchantName}
                  </HelperText>
                )}
              </View>

              {/* Email */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Email <Text style={styles.requiredStar}>*</Text>
                </Text>
                <PaperTextInput
                  mode="outlined"
                  value={formData.merchantEmail}
                  onChangeText={(text) => handleChange("merchantEmail", text)}
                  onBlur={() => handleBlur("merchantEmail")}
                  onFocus={() => handleFocus("merchantEmail")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!localErrors.merchantEmail || !!errors.merchantEmail}
                  style={styles.input}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#0066CC"
                  left={<PaperTextInput.Icon icon="email" color="#6B7280" />}
                  placeholder="john@example.com"
                  placeholderTextColor="#9CA3AF"
                />
                {(localErrors.merchantEmail || errors.merchantEmail) && (
                  <HelperText type="error" style={styles.errorText}>
                    {localErrors.merchantEmail || errors.merchantEmail}
                  </HelperText>
                )}
              </View>

              {/* Phone */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <PaperTextInput
                  mode="outlined"
                  value={formData.merchantPhone}
                  onChangeText={(text) => handleChange("merchantPhone", text)}
                  onBlur={() => handleBlur("merchantPhone")}
                  onFocus={() => handleFocus("merchantPhone")}
                  keyboardType="phone-pad"
                  error={!!localErrors.merchantPhone}
                  style={styles.input}
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#0066CC"
                  left={<PaperTextInput.Icon icon="phone" color="#6B7280" />}
                  placeholder="9876543210"
                  placeholderTextColor="#9CA3AF"
                  maxLength={10}
                />
                {localErrors.merchantPhone && (
                  <HelperText type="error" style={styles.errorText}>
                    {localErrors.merchantPhone}
                  </HelperText>
                )}
              </View>

              {/* Business Type */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Business Type <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.businessTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.businessTypeButton,
                      formData.businessType === "individual" &&
                        styles.businessTypeButtonActive,
                    ]}
                    onPress={() => handleChange("businessType", "individual")}
                  >
                    <IconButton
                      icon="account"
                      size={20}
                      iconColor={
                        formData.businessType === "individual"
                          ? "#0066CC"
                          : "#6B7280"
                      }
                    />
                    <Text
                      style={[
                        styles.businessTypeText,
                        formData.businessType === "individual" &&
                          styles.businessTypeTextActive,
                      ]}
                    >
                      Individual
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.businessTypeButton,
                      formData.businessType === "company" &&
                        styles.businessTypeButtonActive,
                    ]}
                    onPress={() => handleChange("businessType", "company")}
                  >
                    <IconButton
                      icon="office-building"
                      size={20}
                      iconColor={
                        formData.businessType === "company"
                          ? "#0066CC"
                          : "#6B7280"
                      }
                    />
                    <Text
                      style={[
                        styles.businessTypeText,
                        formData.businessType === "company" &&
                          styles.businessTypeTextActive,
                      ]}
                    >
                      Company
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Business Name - Show only for company */}
              {formData.businessType === "company" && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>
                    Business Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <PaperTextInput
                    mode="outlined"
                    value={formData.businessName}
                    onChangeText={(text) => handleChange("businessName", text)}
                    onBlur={() => handleBlur("businessName")}
                    onFocus={() => handleFocus("businessName")}
                    error={!!localErrors.businessName}
                    style={styles.input}
                    outlineColor="#E5E7EB"
                    activeOutlineColor="#0066CC"
                    left={<PaperTextInput.Icon icon="store" color="#6B7280" />}
                    placeholder="Your Company Name"
                    placeholderTextColor="#9CA3AF"
                  />
                  {localErrors.businessName && (
                    <HelperText type="error" style={styles.errorText}>
                      {localErrors.businessName}
                    </HelperText>
                  )}
                </View>
              )}

              {/* Business Category */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  <View style={styles.categoryContainer}>
                    {businessCategories.map((category) => (
                      <Chip
                        key={category}
                        selected={formData.businessCategory === category}
                        onPress={() =>
                          handleChange("businessCategory", category)
                        }
                        style={[
                          styles.categoryChip,
                          formData.businessCategory === category &&
                            styles.categoryChipSelected,
                        ]}
                        textStyle={
                          formData.businessCategory === category &&
                          styles.categoryChipTextSelected
                        }
                        mode="outlined"
                        compact
                      >
                        {category}
                      </Chip>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Country */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Country</Text>
                <CountryDropdown
                  value={formData.country || "India"}
                  onChange={(country) => {
                    handleChange("country", country);
                    handleChange("nationality", country);
                  }}
                  label=""
                />
              </View>

              {/* Date of Birth */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <View pointerEvents="none">
                    <PaperTextInput
                      mode="outlined"
                      value={formData.dob}
                      style={styles.input}
                      outlineColor="#E5E7EB"
                      activeOutlineColor="#0066CC"
                      left={<PaperTextInput.Icon icon="cake" color="#6B7280" />}
                      right={
                        <PaperTextInput.Icon icon="calendar" color="#6B7280" />
                      }
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={!isFormValid()}
                  style={[
                    styles.button,
                    !isFormValid() && styles.buttonDisabled,
                  ]}
                  labelStyle={styles.buttonLabel}
                  contentStyle={styles.buttonContent}
                >
                  Continue
                </Button>
              </Animated.View>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.dob ? new Date(formData.dob) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </Surface>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
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
    padding: 16,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    fontSize: 13,
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
    backgroundColor: "#0066CC",
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
  businessTypeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  businessTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  businessTypeButtonActive: {
    borderColor: "#0066CC",
    backgroundColor: "#F0F7FF",
  },
  businessTypeText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: -4,
  },
  businessTypeTextActive: {
    color: "#0066CC",
    fontWeight: "500",
  },
  categoryScroll: {
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  categoryChip: {
    marginRight: 6,
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    height: 32,
  },
  categoryChipSelected: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "#0066CC",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonContent: {
    paddingVertical: 6,
  },
});

export default BasicDetailsForm;
