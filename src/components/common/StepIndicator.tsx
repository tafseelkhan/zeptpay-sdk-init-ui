// components/common/StepIndicator.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import { StepConfig, Mode } from "../../types/merchantTypes";

interface StepIndicatorProps {
  currentStep: number;
  steps: StepConfig[];
  mode: Mode;
  isKycCompleted: boolean;
  isBankDetailsCompleted: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  steps,
  mode,
  isKycCompleted,
  isBankDetailsCompleted,
}) => {
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "upcoming";
  };

  const getStepIcon = (stepId: number, status: string) => {
    if (status === "completed") return "check";

    switch (stepId) {
      case 1:
        return "account";
      case 2:
        return "shield-account";
      case 3:
        return "bank";
      case 4:
        return "check-circle";
      default:
        return "circle";
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "current":
        return "#0066CC";
      default:
        return "#9CA3AF";
    }
  };

  const getStepLabel = (step: StepConfig) => {
    if (mode === "test" && step.id === 4) return null;
    return step.name;
  };

  return (
    <View style={styles.container}>
      {/* Main Steps Row - Compact */}
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const color = getStepColor(status);
          const icon = getStepIcon(step.id, status);
          const label = getStepLabel(step);

          // Don't show step 4 in test mode
          if (mode === "test" && step.id === 4) return null;

          // Don't show connector after last visible step
          const isLastVisible =
            mode === "test" ? step.id === 3 : index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <View style={styles.stepItem}>
                {/* Step Circle with Gradient or Color */}
                {status === "current" ? (
                  <LinearGradient
                    colors={["#0066CC", "#0099FF"]}
                    style={[styles.stepCircle, { shadowColor: color }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <IconButton
                      icon={icon}
                      size={14}
                      iconColor="#FFFFFF"
                      style={styles.iconButton}
                    />
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.stepCircle,
                      { backgroundColor: color },
                      status === "completed" && styles.stepCircleCompleted,
                    ]}
                  >
                    <IconButton
                      icon={icon}
                      size={14}
                      iconColor="#FFFFFF"
                      style={styles.iconButton}
                    />
                  </View>
                )}

                {/* Step Label - Compact */}
                {label && (
                  <Text
                    style={[
                      styles.stepLabel,
                      { color: status === "upcoming" ? "#9CA3AF" : color },
                    ]}
                  >
                    {label}
                  </Text>
                )}
              </View>

              {/* Connector - Only between visible steps */}
              {!isLastVisible && (
                <View
                  style={[
                    styles.stepConnector,
                    {
                      backgroundColor:
                        status === "completed" ? "#10B981" : "#E5E7EB",
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Status Row - Compact Badges */}
      <View style={styles.statusRow}>
        {/* Mode Badge */}
        <View
          style={[
            styles.modeBadge,
            mode === "live" ? styles.liveBadge : styles.testBadge,
          ]}
        >
          <IconButton
            icon={mode === "live" ? "cloud" : "flask"}
            size={12}
            iconColor={mode === "live" ? "#DC2626" : "#92400E"}
            style={styles.iconButtonSmall}
          />
          <Text
            style={[
              styles.modeText,
              mode === "live" ? styles.liveText : styles.testText,
            ]}
          >
            {mode === "live" ? "LIVE" : "TEST"}
          </Text>
        </View>

        {/* KYC Status Badge */}
        {isKycCompleted ? (
          <View style={[styles.statusBadge, styles.kycCompleted]}>
            <IconButton
              icon="check-circle"
              size={12}
              iconColor="#10B981"
              style={styles.iconButtonSmall}
            />
            <Text style={styles.kycText}>KYC Verified</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.kycPending]}>
            <IconButton
              icon="clock-outline"
              size={12}
              iconColor="#D97706"
              style={styles.iconButtonSmall}
            />
            <Text style={styles.kycPendingText}>KYC Pending</Text>
          </View>
        )}

        {/* Bank Status Badge */}
        {isBankDetailsCompleted ? (
          <View style={[styles.statusBadge, styles.bankCompleted]}>
            <IconButton
              icon="check-circle"
              size={12}
              iconColor="#10B981"
              style={styles.iconButtonSmall}
            />
            <Text style={styles.bankText}>Bank Added</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.bankPending]}>
            <IconButton
              icon="clock-outline"
              size={12}
              iconColor="#D97706"
              style={styles.iconButtonSmall}
            />
            <Text style={styles.bankPendingText}>Bank Pending</Text>
          </View>
        )}
      </View>

      {/* Test Mode Hint - Compact */}
      {mode === "test" && (
        <View style={styles.testHint}>
          <IconButton
            icon="information"
            size={12}
            iconColor="#92400E"
            style={styles.iconButtonSmall}
          />
          <Text style={styles.testHintText}>
            KYC auto-approved in test mode
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  stepCircleCompleted: {
    backgroundColor: "#10B981",
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: "500",
    textAlign: "center",
  },
  stepConnector: {
    height: 2,
    flex: 1,
    marginHorizontal: 2,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
  },
  liveBadge: {
    backgroundColor: "#FEE2E2",
  },
  testBadge: {
    backgroundColor: "#FEF3C7",
  },
  modeText: {
    fontSize: 9,
    fontWeight: "600",
    marginLeft: -2,
  },
  liveText: {
    color: "#DC2626",
  },
  testText: {
    color: "#92400E",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  kycCompleted: {
    backgroundColor: "#D1FAE5",
  },
  kycPending: {
    backgroundColor: "#FEF3C7",
  },
  bankCompleted: {
    backgroundColor: "#D1FAE5",
  },
  bankPending: {
    backgroundColor: "#FEF3C7",
  },
  kycText: {
    fontSize: 9,
    color: "#10B981",
    fontWeight: "500",
    marginLeft: -2,
  },
  kycPendingText: {
    fontSize: 9,
    color: "#D97706",
    fontWeight: "500",
    marginLeft: -2,
  },
  bankText: {
    fontSize: 9,
    color: "#10B981",
    fontWeight: "500",
    marginLeft: -2,
  },
  bankPendingText: {
    fontSize: 9,
    color: "#D97706",
    fontWeight: "500",
    marginLeft: -2,
  },
  testHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  testHintText: {
    fontSize: 8,
    color: "#92400E",
    marginLeft: -4,
  },
  iconButton: {
    margin: 0,
    padding: 0,
    width: 28,
    height: 28,
  },
  iconButtonSmall: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
});

export default StepIndicator;
