import React from "react";
import {
  View,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ScrollView,
  Image,
  DimensionValue,
} from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  IconButton,
  Avatar,
} from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import { UI_TEXTS } from "../../etc/constants";

// ==================== TYPE DEFINITIONS ====================

interface MerchantData {
  status: string;
  kycStatus: string;
  dob: string;
  merchantDID: string;
  walletId: string;
  merchantName: string;
  merchantEmail: string;
  merchantPhone: string;
  image?: string; // New profile image field (optional)
}

interface CustomButton {
  label: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: TextStyle["fontWeight"];
  icon?: string;
  iconPosition?: "left" | "right";
  iconSize?: number;
  iconStyle?: any;
  justifyContent?: string;
  alignItems?: string;
  gap?: number; // Gap between icon and text
  contentPaddingHorizontal?: number;
  contentPaddingVertical?: number;

  // Border properties
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dotted" | "dashed";

  // Margin & Padding
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;

  // Positioning
  position?: "absolute" | "relative";
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  zIndex?: number;

  // Effects
  overflow?: "visible" | "hidden" | "scroll";
  opacity?: number;
  elevation?: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;

  // Text styling
  textAlign?: "auto" | "left" | "right" | "center" | "justify";
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  letterSpacing?: number;
  lineHeight?: number;
  textDecorationLine?:
    | "none"
    | "underline"
    | "line-through"
    | "underline line-through";
  textDecorationColor?: string;
  textDecorationStyle?: "solid" | "double" | "dotted" | "dashed";
  fontStyle?: "normal" | "italic";
  fontFamily?: string;

  // Touchable properties
  activeOpacity?: number;
  disabled?: boolean;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  delayPressIn?: number;
  delayPressOut?: number;
  delayLongPress?: number;

  // Gradient properties
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  gradientStyle?: any;

  // Custom styles
  style?: any;
  textStyle?: any;

  // Navigation
  navigateTo?: string;
}

interface OnboardingCompleteScreenProps {
  developerData?: MerchantData;
  loading?: boolean;
  autoFetch?: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    cardColor?: string;
    textColor?: string;
    accentColor?: string;
    tickColor?: string;
  };
  buttons?: CustomButton[];
}

interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  accentColor: string;
  tickColor: string;
}

// ==================== TYPE GUARDS ====================

const isString = (value: any): value is string => {
  return typeof value === "string" && value !== null && value !== undefined;
};

const safeToUpperCase = (value: any): string => {
  if (!isString(value)) return "N/A";
  return value.toUpperCase();
};

const safeToLowerCase = (value: any): string => {
  if (!isString(value)) return "";
  return value.toLowerCase();
};

// ==================== FORMATTING HELPERS ====================

const getStatusColor = (status: any): string => {
  const statusStr = safeToLowerCase(status);

  switch (statusStr) {
    case "active":
      return "#10B981";
    case "pending":
      return "#F59E0B";
    case "inactive":
      return "#EF4444";
    case "approved":
      return "#10B981";
    case "rejected":
      return "#EF4444";
    default:
      return "#6B7280";
  }
};

const formatDate = (dateString: any): string => {
  if (!dateString || !isString(dateString)) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return String(dateString) || "N/A";
  }
};

const formatWalletId = (id: any): string => {
  if (!id || !isString(id)) return "N/A";
  if (id.length > 20) {
    return `${id.substring(0, 8)}...${id.substring(id.length - 8)}`;
  }
  return id;
};

const getInitials = (name: any): string => {
  if (!name || !isString(name)) return "M";
  return name.charAt(0).toUpperCase();
};

// ==================== BRANDING CONSTANTS ====================

const ZeptPay_BRANDING = {
  logo: require("../../assets/images/zeptpay.png"),
  name: "ZeptPay",
  tagline: "Secure Digital Wallet",
  copyright: "© 2024 ZeptPay. All rights reserved.",
} as const;

// ==================== MAIN COMPONENT ====================

export const OnboardingCompleteScreen: React.FC<
  OnboardingCompleteScreenProps
> = ({
  developerData,
  loading = false,
  autoFetch = false,
  theme = {},
  buttons = [],
}) => {
  const customTheme: ThemeColors = {
    primaryColor: theme.primaryColor || "#0066CC",
    secondaryColor: theme.secondaryColor || "#0099FF",
    backgroundColor: theme.backgroundColor || "#FFFFFF",
    cardColor: theme.cardColor || "#F8F9FA",
    textColor: theme.textColor || "#111827",
    accentColor: theme.accentColor || "#10B981",
    tickColor: theme.tickColor || "#00ffaa",
  };

  const ZeptPayBranding = () => (
    <View style={styles.brandingContainer}>
      <Image
        source={ZeptPay_BRANDING.logo}
        style={styles.brandingLogo}
        resizeMode="contain"
      />
      <Text style={styles.brandingName}>{ZeptPay_BRANDING.name}</Text>
      <Text style={styles.brandingTagline}>{ZeptPay_BRANDING.tagline}</Text>
    </View>
  );

  // Render profile image or avatar
  const renderProfileImage = () => {
    if (developerData?.image && isString(developerData.image)) {
      return (
        <Image
          source={{ uri: developerData.image }}
          style={styles.profileImage}
          resizeMode="cover"
        />
      );
    }
    return (
      <Avatar.Text
        size={80}
        label={getInitials(developerData?.merchantName)}
        style={[styles.avatar, { backgroundColor: customTheme.primaryColor }]}
        labelStyle={styles.avatarLabel}
      />
    );
  };

  // ✅ Render custom button with all styles
  const renderCustomButton = (button: CustomButton, index: number) => {
    const {
      label,
      onPress,
      backgroundColor = customTheme.primaryColor,
      textColor = "#FFFFFF",
      width = "100%",
      height = 56,
      borderRadius = 16,
      fontSize = 16,
      fontWeight = "600",
      icon,
      iconPosition = "left",
      right,
      left,
      borderColor,
      borderWidth,
      borderStyle,
      paddingHorizontal,
      paddingVertical,
      marginRight,
      marginTop,
      marginLeft,
      marginBottom,
      overflow = "hidden",
      justifyContent = "center",
      alignItems = "center",
      elevation,
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      opacity,
      position,
      top,
      bottom,
      zIndex,
      navigateTo,
    } = button;

    // ✅ Button styles with all possible properties
    const buttonStyles = {
      // Dimensions
      width,
      height,

      // Border
      borderRadius,
      borderColor,
      borderWidth,
      borderStyle: borderStyle as "solid" | "dotted" | "dashed" | undefined,

      // Background
      backgroundColor,

      // Flexbox
      justifyContent: justifyContent as
        | "center"
        | "flex-start"
        | "flex-end"
        | "space-between"
        | "space-around"
        | "space-evenly"
        | undefined,
      alignItems: alignItems as
        | "center"
        | "flex-start"
        | "flex-end"
        | "stretch"
        | "baseline"
        | undefined,

      // Margins
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,

      // Paddings
      paddingHorizontal,
      paddingVertical,

      // Positioning
      position: position as "absolute" | "relative" | undefined,
      top,
      bottom,
      left,
      right,
      zIndex,

      // Effects
      overflow: overflow as "visible" | "hidden" | "scroll" | undefined,
      opacity,
      elevation,
      shadowColor,
      shadowOffset: shadowOffset as
        | { width: number; height: number }
        | undefined,
      shadowOpacity,
      shadowRadius,
    };

    // ✅ Text styles with all properties
    const textStyles: TextStyle = {
      color: textColor,
      fontSize,
      fontWeight: fontWeight as any,
      textAlign: "center",
      includeFontPadding: false,
      textTransform: button.textTransform as any,
      letterSpacing: button.letterSpacing,
      lineHeight: button.lineHeight,
      textDecorationLine: button.textDecorationLine as any,
      textDecorationColor: button.textDecorationColor,
      textDecorationStyle: button.textDecorationStyle as any,
      fontStyle: button.fontStyle as any,
      fontFamily: button.fontFamily,
    };

    // ✅ Icon styles
    const iconStyles = {
      margin: 0,
      marginRight: iconPosition === "left" ? 0 : 4,
      marginLeft: iconPosition === "right" ? 0 : 4,
    };

    // ✅ Container styles for icon and text - WITH PROPER TYPING
    const contentContainerStyles = {
      flexDirection:
        iconPosition === "left" ? ("row" as const) : ("row-reverse" as const),
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: button.gap || 8,
      paddingHorizontal: button.contentPaddingHorizontal,
      paddingVertical: button.contentPaddingVertical,
    };

    // ✅ Check if background contains gradient
    const isGradient = backgroundColor?.includes("gradient") || false;

    // ✅ Button content with icon handling
    const renderContent = () => {
      if (icon) {
        return (
          <View style={contentContainerStyles}>
            <IconButton
              icon={icon}
              size={button.iconSize || fontSize + 4}
              iconColor={textColor}
              style={[iconStyles, button.iconStyle]}
              disabled={button.disabled}
            />
            <Text style={[textStyles, button.textStyle]}>{label}</Text>
          </View>
        );
      }
      return <Text style={[textStyles, button.textStyle]}>{label}</Text>;
    };

    if (isGradient) {
      return (
        <TouchableOpacity
          key={index}
          style={[buttonStyles, button.style]}
          onPress={onPress}
          activeOpacity={button.activeOpacity || 0.8}
          disabled={button.disabled}
          hitSlop={button.hitSlop}
          delayPressIn={button.delayPressIn}
          delayPressOut={button.delayPressOut}
          delayLongPress={button.delayLongPress}
        >
          <LinearGradient
            colors={[backgroundColor, customTheme.secondaryColor]}
            start={button.gradientStart || { x: 0, y: 0 }}
            end={button.gradientEnd || { x: 1, y: 1 }}
            style={{
              borderRadius,
              height: "100%",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              ...button.gradientStyle,
            }}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={[buttonStyles, button.style]}
        onPress={onPress}
        activeOpacity={button.activeOpacity || 0.8}
        disabled={button.disabled}
        hitSlop={button.hitSlop}
        delayPressIn={button.delayPressIn}
        delayPressOut={button.delayPressOut}
        delayLongPress={button.delayLongPress}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: customTheme.backgroundColor },
        ]}
      >
        <LinearGradient
          colors={[customTheme.backgroundColor, customTheme.cardColor]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ZeptPayBranding />

            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[customTheme.primaryColor, customTheme.secondaryColor]}
                style={styles.loadingIcon}
              >
                <ActivityIndicator size="large" color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text
              style={[styles.loadingTitle, { color: customTheme.textColor }]}
            >
              Setting up your account...
            </Text>
            <Text
              style={[
                styles.loadingSubtitle,
                { color: customTheme.textColor + "80" },
              ]}
            >
              Please wait while we complete your registration
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // No data state
  if (!developerData) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: customTheme.backgroundColor },
        ]}
      >
        <LinearGradient
          colors={[customTheme.backgroundColor, customTheme.cardColor]}
          style={styles.gradient}
        >
          <View style={styles.emptyContainer}>
            <ZeptPayBranding />

            <View
              style={[
                styles.iconContainer,
                styles.emptyIconContainer,
                { backgroundColor: customTheme.cardColor },
              ]}
            >
              <IconButton
                icon="clock-outline"
                size={48}
                iconColor={customTheme.textColor + "80"}
                style={styles.emptyIcon}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: customTheme.textColor }]}>
              Processing
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: customTheme.textColor + "80" },
              ]}
            >
              Waiting for merchant data...
            </Text>
            <ActivityIndicator
              size="small"
              color={customTheme.primaryColor}
              style={styles.refreshLoader}
            />
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Success state with specific fields
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: customTheme.backgroundColor },
      ]}
    >
      <LinearGradient
        colors={[customTheme.backgroundColor, customTheme.cardColor]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ZeptPayBranding />

          {/* Success Header with Profile Image/Avatar */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={[customTheme.tickColor, customTheme.tickColor]}
              style={styles.successIcon}
            >
              <IconButton icon="check" size={40} iconColor="#FFFFFF" />
            </LinearGradient>

            {renderProfileImage()}
          </View>

          {/* Fixed Welcome Message - Using merchantName instead of generic "Merchant" */}
          <Text style={[styles.title, { color: customTheme.textColor }]}>
            Welcome, {developerData.merchantName || "Merchant"}!
          </Text>
          <Text
            style={[styles.subtitle, { color: customTheme.textColor + "80" }]}
          >
            Your account has been successfully created
          </Text>

          {/* Status Cards Row */}
          <View style={styles.statusRow}>
            <Surface
              style={[
                styles.statusCard,
                { backgroundColor: customTheme.backgroundColor },
              ]}
            >
              <Text
                style={[
                  styles.statusCardLabel,
                  { color: customTheme.textColor + "80" },
                ]}
              >
                Account
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      getStatusColor(developerData.status) + "20",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(developerData.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: getStatusColor(developerData.status) },
                  ]}
                >
                  {safeToUpperCase(developerData.status)}
                </Text>
              </View>
            </Surface>

            <Surface
              style={[
                styles.statusCard,
                { backgroundColor: customTheme.backgroundColor },
              ]}
            >
              <Text
                style={[
                  styles.statusCardLabel,
                  { color: customTheme.textColor + "80" },
                ]}
              >
                KYC
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      getStatusColor(developerData.kycStatus) + "20",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: getStatusColor(developerData.kycStatus),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: getStatusColor(developerData.kycStatus) },
                  ]}
                >
                  {safeToUpperCase(developerData.kycStatus)}
                </Text>
              </View>
            </Surface>
          </View>

          {/* Main Info Card */}
          <Surface
            style={[
              styles.infoCard,
              { backgroundColor: customTheme.backgroundColor },
            ]}
          >
            <View
              style={[
                styles.cardHeader,
                { borderBottomColor: customTheme.cardColor },
              ]}
            >
              <IconButton
                icon="account-details"
                size={24}
                iconColor={customTheme.primaryColor}
              />
              <Text
                style={[
                  styles.cardHeaderText,
                  { color: customTheme.textColor },
                ]}
              >
                Merchant Information
              </Text>
            </View>

            <View style={styles.cardContent}>
              {/* Merchant Name */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: customTheme.primaryColor + "20" },
                  ]}
                >
                  <IconButton
                    icon="account"
                    size={20}
                    iconColor={customTheme.primaryColor}
                    style={styles.detailIcon}
                  />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: customTheme.textColor + "80" },
                    ]}
                  >
                    Merchant Name
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: customTheme.textColor },
                    ]}
                  >
                    {developerData.merchantName || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Email */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: customTheme.primaryColor + "20" },
                  ]}
                >
                  <IconButton
                    icon="email"
                    size={20}
                    iconColor={customTheme.primaryColor}
                    style={styles.detailIcon}
                  />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: customTheme.textColor + "80" },
                    ]}
                  >
                    Email Address
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: customTheme.textColor },
                    ]}
                  >
                    {developerData.merchantEmail || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Phone */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: customTheme.primaryColor + "20" },
                  ]}
                >
                  <IconButton
                    icon="phone"
                    size={20}
                    iconColor={customTheme.primaryColor}
                    style={styles.detailIcon}
                  />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: customTheme.textColor + "80" },
                    ]}
                  >
                    Phone Number
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: customTheme.textColor },
                    ]}
                  >
                    {developerData.merchantPhone || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Date of Birth */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: customTheme.primaryColor + "20" },
                  ]}
                >
                  <IconButton
                    icon="cake"
                    size={20}
                    iconColor={customTheme.primaryColor}
                    style={styles.detailIcon}
                  />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: customTheme.textColor + "80" },
                    ]}
                  >
                    Date of Birth
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: customTheme.textColor },
                    ]}
                  >
                    {formatDate(developerData.dob)}
                  </Text>
                </View>
              </View>

              {/* Profile Image (if available) */}
              {developerData.image && (
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: customTheme.primaryColor + "20" },
                    ]}
                  >
                    <IconButton
                      icon="image"
                      size={20}
                      iconColor={customTheme.primaryColor}
                      style={styles.detailIcon}
                    />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: customTheme.textColor + "80" },
                      ]}
                    >
                      Profile Image
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: customTheme.textColor },
                      ]}
                    >
                      Available
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Surface>

          {/* Wallet Information Card */}
          <Surface
            style={[
              styles.walletCard,
              { backgroundColor: customTheme.backgroundColor },
            ]}
          >
            <View
              style={[
                styles.cardHeader,
                { borderBottomColor: customTheme.cardColor },
              ]}
            >
              <IconButton
                icon="wallet"
                size={24}
                iconColor={customTheme.accentColor}
              />
              <Text
                style={[
                  styles.cardHeaderText,
                  { color: customTheme.textColor },
                ]}
              >
                Wallet Details
              </Text>
            </View>

            <View style={styles.cardContent}>
              {/* Wallet ID */}
              <View style={styles.walletRow}>
                <Text
                  style={[
                    styles.walletLabel,
                    { color: customTheme.textColor + "80" },
                  ]}
                >
                  Wallet ID
                </Text>
                <View
                  style={[
                    styles.walletValueContainer,
                    { backgroundColor: customTheme.cardColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.walletValue,
                      { color: customTheme.textColor },
                    ]}
                  >
                    {formatWalletId(developerData.walletId)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      /* Copy to clipboard */
                    }}
                  >
                    <IconButton
                      icon="content-copy"
                      size={16}
                      iconColor={customTheme.primaryColor}
                      style={styles.copyIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Merchant DID */}
              <View style={styles.walletRow}>
                <Text
                  style={[
                    styles.walletLabel,
                    { color: customTheme.textColor + "80" },
                  ]}
                >
                  Merchant DID
                </Text>
                <View
                  style={[
                    styles.walletValueContainer,
                    { backgroundColor: customTheme.cardColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.walletValue,
                      { color: customTheme.textColor },
                    ]}
                  >
                    {formatWalletId(developerData.merchantDID)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      /* Copy to clipboard */
                    }}
                  >
                    <IconButton
                      icon="content-copy"
                      size={16}
                      iconColor={customTheme.primaryColor}
                      style={styles.copyIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Surface>

          {/* Custom Buttons - Developer can add multiple buttons */}
          {buttons.length > 0 && (
            <View style={styles.buttonsContainer}>
              {buttons.map((button, index) =>
                renderCustomButton(button, index),
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text
              style={[
                styles.footerText,
                { color: customTheme.textColor + "60" },
              ]}
            >
              {UI_TEXTS.ONBOARDING_COMPLETE.FOOTER}
            </Text>
            <Text
              style={[
                styles.footerText,
                { color: customTheme.textColor + "40", marginTop: 4 },
              ]}
            >
              {ZeptPay_BRANDING.copyright}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  brandingContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingVertical: 15,
  },
  brandingLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  brandingName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0066CC",
    marginBottom: 4,
  },
  brandingTagline: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    marginLeft: 10,
  },
  avatarLabel: {
    fontSize: 32,
    fontWeight: "600",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginLeft: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusCardLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    width: "100%",
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walletCard: {
    width: "100%",
    borderRadius: 20,
    marginBottom: 24,
    elevation: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  cardContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailIcon: {
    margin: 0,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  walletRow: {
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  walletValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  walletValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  copyIcon: {
    margin: 0,
  },
  buttonsContainer: {
    width: "100%",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  customButton: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    overflow: "hidden",
  },
  customButtonGradient: {
    justifyContent: "center",
    alignItems: "center",
  },
  customButtonText: {
    textAlign: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonIcon: {
    margin: 0,
  },
  footerContainer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    width: "100%",
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIconContainer: {
    borderRadius: 60,
    padding: 10,
  },
  emptyIcon: {
    margin: 0,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  refreshLoader: {
    marginTop: 16,
  },
});

export default OnboardingCompleteScreen;
