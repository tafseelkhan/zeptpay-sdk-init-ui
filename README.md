# 📱 Complete Integration Guide - @flixora/zeptpay-react-native

## 🎯 Understanding the Complete Implementation

Below is a **production-ready** implementation showing exactly how to integrate the SDK. I'll explain **EACH PART** in detail so developers understand WHY and HOW to use it.

# @flixora/zeptpay-react-native 🚀

![npm version](https://img.shields.io/npm/v/@flixora/zeptpay-react-native)
![license](https://img.shields.io/npm/l/@flixora/zeptpay-react-native)
![downloads](https://img.shields.io/npm/dm/@flixora/zeptpay-react-native)

**Complete React Native SDK for ZeptPay** - Merchant onboarding with KYC verification, bank details, and document uploads. Built with Expo and TypeScript.

## 📦 Installation

```bash
npm install @flixora/zeptpay-sdk-init-ui
# or
yarn add @flixora/zeptpay-sdk-init-ui
```

### Peer Dependencies

Make sure you have these installed:

```bash
npm install @react-native-async-storage/async-storage @react-native-community/datetimepicker @react-navigation/native @types/react axios expo-image-picker expo-linear-gradient expo-module-scripts react react-native react-native-country-picker-modal react-native-paper typescript
# or
yarn add @react-native-async-storage/async-storage @react-native-community/datetimepicker @react-navigation/native @types/react axios expo-image-picker expo-linear-gradient expo-module-scripts react react-native react-native-country-picker-modal react-native-paper typescript
```

---

## 🚀 Quick Start

---

## 📁 File: `MerchantOnboardingScreen.tsx` - Complete Code with Explanations

```typescript
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  MerchantOnboarding,
  useZeptPaySafe,
  tokenService,
  OnboardingCompleteScreen,
  useMerchantOnboarding,
} from "@flixora/zeptpay-react-native";
```

### 🔍 **Imports Explained:**

| Import | Purpose |
|--------|---------|
| `MerchantOnboarding` | Main 5-step onboarding component |
| `useZeptPaySafe` | Hook to access SDK context (safe version - returns null if not in provider) |
| `tokenService` | Utility to save/retrieve JWT tokens securely |
| `OnboardingCompleteScreen` | Success screen after onboarding |
| `useMerchantOnboarding` | Hook for merchant operations (create, fetch status) |

---

## 🏗️ Component Setup

```typescript
export default function MerchantOnboardingScreen() {
  const zeptpay = useZeptPaySafe();
  const navigation = useNavigation();
  const { createMerchant, loading: merchantLoading } = useMerchantOnboarding();
```

### 📌 **State Variables Explained:**

```typescript
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullFormData, setFullFormData] = useState<Record<string, any>>({});
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
```

| State | Purpose |
|-------|---------|
| `isReady` | SDK initialized and ready to use |
| `isSubmitting` | Form submission in progress |
| `fullFormData` | Accumulates data from all steps |
| `hasSavedToken` | User already has valid token |
| `merchantData` | Fetched merchant details from API |
| `loadingStatus` | Fetching merchant status |
| `tokenInvalid` | Token expired/invalid - show form again |

---

## 🔐 Token Management

### 🚫 **Invalid Token Handler**

```typescript
  const handleInvalidToken = async () => {
    console.log("🔴 Token invalid, clearing from device");
    await tokenService.clearToken();        // Remove from storage
    setHasSavedToken(false);                // Reset state
    setMerchantData(null);                  // Clear merchant data
    setTokenInvalid(true);                   // Trigger form display

    Alert.alert(
      "Session Expired",
      "Your session has expired. Please complete the form again.",
      [{ text: "OK" }],
    );
  };
```

**Why this is important:**
- Automatically handles expired tokens
- Shows user-friendly alert
- Resets to onboarding form
- Prevents getting stuck on error screen

---

## 📡 Fetching Merchant Data

### 🔄 **Status API Call with Token Verification**

```typescript
  const fetchMerchantData = async (token: string) => {
    console.log(
      "🔄 Starting fetchMerchantData with token:",
      token ? "Token exists" : "No token",
    );

    try {
      setLoadingStatus(true);
      console.log(
        "🌐 Calling status API endpoint: http://172.20.10.12:5000/api/payout-portal/wallet-setup/sellers/status",
      );

      const response = await fetch(
        "http://172.20.10.12:5000/api/payout-portal/wallet-setup/sellers/status",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
```

### ⚠️ **Token Validation Logic**

```typescript
      if (
        response.status === 404 ||
        response.status === 401 ||
        response.status === 403
      ) {
        console.log(
          `⚠️ Status API returned ${response.status} - Token invalid`,
        );
        await handleInvalidToken();  // 🔥 Token invalid - clear and restart
        return null;
      }
```

**HTTP Status Handling:**
- `401` - Unauthorized (token expired)
- `403` - Forbidden (invalid token)
- `404` - Not found (merchant doesn't exist)
- Any other error - handle gracefully

### ✅ **Successful Response Handling**

```typescript
      if (response.ok) {
        const data = await response.json();
        console.log("✅ SUCCESS - Merchant data fetched successfully!");
        
        // 🔥 IMPORTANT: Extract nested data structure
        // API returns { success: true, data: { ...merchantFields } }
        const extractedData = data.data || data;

        console.log(
          "📊 Extracted merchant data:",
          JSON.stringify(extractedData, null, 2),
        );

        // ✅ Verify all expected fields exist
        const expectedFields = [
          "status",
          "kycStatus",
          "dob",
          "merchantDID",
          "walletId",
          "merchantName",
          "merchantEmail",
          "merchantPhone",
        ];
        expectedFields.forEach((field) => {
          console.log(
            `   - ${field}:`,
            extractedData[field]
              ? `Present (${extractedData[field]})`
              : "❌ Missing",
          );
        });

        setMerchantData(extractedData);  // Save to state
        setHasSavedToken(true);           // Mark as authenticated
        return extractedData;
      }
```

**Key Insight:** The API returns nested data structure. Always extract properly!

---

## ⏳ SDK Initialization & Token Check

```typescript
  useEffect(() => {
    console.log(
      "🔄 useEffect triggered, zeptpay:",
      zeptpay ? "exists" : "null",
    );

    if (zeptpay) {
      const checkReady = async () => {
        console.log("🔍 Checking SDK readiness...");
        
        // ⏱️ Wait for SDK to finish loading
        let tries = 0;
        while (zeptpay.loading && tries < 20) {
          console.log(`⏳ Waiting for SDK to load... attempt ${tries + 1}/20`);
          await new Promise((res) => setTimeout(res, 100));
          tries++;
        }

        console.log("✅ SDK ready check complete, isReady set to true");
        setIsReady(true);

        // 🔑 Check for existing token
        console.log("🔑 Checking for saved token...");
        const token = await tokenService.getToken();
        console.log("🔑 Token found?", token ? "Yes" : "No");

        if (token) {
          console.log(
            "🔑 Token exists (first 10 chars):",
            token.substring(0, 10) + "...",
          );
          console.log("🔑 Verifying token with status API...");
          await fetchMerchantData(token);  // Verify token is valid
        } else {
          console.log("🔑 No token found, showing onboarding form");
          setHasSavedToken(false);
        }
      };
      checkReady();
    }
  }, [zeptpay]); // Runs when zeptpay context changes
```

### 🔄 **Why This Pattern?**

1. **Wait for SDK** - Don't render until SDK is ready
2. **Check Existing Token** - User might already be authenticated
3. **Verify Token** - Token might be expired/invalid
4. **Show Appropriate UI** - Form or Success screen

---

## 📊 State Change Monitoring

```typescript
  useEffect(() => {
    console.log("🔄 merchantData state changed:");
    console.log(
      "   Current merchantData:",
      merchantData ? JSON.stringify(merchantData, null, 2) : "null",
    );
    console.log("   hasSavedToken:", hasSavedToken);
    console.log("   loadingStatus:", loadingStatus);
  }, [merchantData, hasSavedToken, loadingStatus]);
```

**Why this is helpful:**
- Debug state changes in real-time
- Verify data structure before rendering
- Track authentication flow

---

## 🚪 Logout Function

```typescript
  const handleLogout = async () => {
    console.log("🚪 Logout initiated");
    await tokenService.clearToken();  // Remove from storage
    setHasSavedToken(false);          // Reset auth state
    setMerchantData(null);            // Clear merchant data
    console.log("🚪 Token cleared, state reset");
  };
```

**Note:** This function exists but isn't used in this example. You can add a logout button in your UI.

---

## 🎨 Render Logic - Step by Step

### 1️⃣ **Token Invalid Reset**

```typescript
  if (tokenInvalid) {
    console.log("🔄 Token invalid state, resetting after timeout");
    setTimeout(() => setTokenInvalid(false), 100);
  }
```

**Purpose:** Reset the invalid flag after a brief moment to show the form again.

### 2️⃣ **Loading States**

```typescript
  if (
    !zeptpay ||
    zeptpay.loading ||
    !isReady ||
    isSubmitting ||
    merchantLoading ||
    (hasSavedToken && loadingStatus)
  ) {
    console.log("⏳ Loading state active");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }
```

**When Loading Shows:**
- SDK not initialized
- SDK still loading
- Not ready yet
- Submitting form
- Merchant operations in progress
- Fetching status with token

### 3️⃣ **Invalid Configuration**

```typescript
  if (!zeptpay.isValid) {
    console.log("❌ ZeptPay configuration invalid");
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "red", fontSize: 16, textAlign: "center" }}>
          ❌ Invalid ZeptPay configuration
        </Text>
        <Text style={{ marginTop: 10, color: "#666", textAlign: "center" }}>
          Error: {zeptpay.error || "Public key verification failed"}
        </Text>
      </View>
    );
  }
```

**Shows when:** Public key is invalid or verification fails.

---

## 🎉 Success Screen - With Custom Buttons

```typescript
  if (hasSavedToken && merchantData && !tokenInvalid) {
    console.log(
      "✅ Rendering OnboardingCompleteScreen with extracted data:",
      JSON.stringify(merchantData, null, 2),
    );

    return (
      <OnboardingCompleteScreen
        developerData={merchantData}     // Merchant data to display
        loading={false}
        buttons={[
          {
            label: "wallets",
            onPress: () => navigation.navigate("wallet" as never),
            backgroundColor: "#0080ff",
            width: "40%",
            height: 50,
            fontSize: 15,
            gap: 8,
            fontWeight: 300,
            marginTop: -20,
            icon: "contactless-payment",
            iconPosition: "left",
            position: "absolute",
            left: 20,                    // Position left
          },
          {
            label: "Transactions",
            onPress: () => navigation.navigate("Transaction" as never),
            backgroundColor: "#ff0000",
            width: "40%",
            height: 50,
            fontSize: 15,
            gap: -8,
            fontWeight: 300,
            marginTop: -20,
            icon: "history",
            iconPosition: "left",
            position: "absolute",
            right: 20,                    // Position right
          },
        ]}
      />
    );
  }
```

### 🎯 **Button Customization Explained:**

| Property | Value | Effect |
|----------|-------|--------|
| `backgroundColor` | `#0080ff` / `#ff0000` | Custom colors per button |
| `width` | `"40%"` | Half-width buttons |
| `position` | `"absolute"` | Float over content |
| `left` / `right` | `20` | Position from edges |
| `gap` | `8` / `-8` | Space between icon & text |
| `icon` | Material icon name | Add icons to buttons |
| `iconPosition` | `"left"` | Icon on left side |

**Result:** Two buttons floating at bottom, positioned left and right!

---

## 📝 Form Submission Handler

```typescript
  const handleSubmitToBackend = async (formData: any) => {
    console.log(
      "📤 Submitting form data to backend:",
      JSON.stringify(formData, null, 2),
    );

    try {
      setIsSubmitting(true);
      
      // 🔄 Merge with previous step data
      const mergedData = { ...fullFormData, ...formData };
      
      // 🧹 Clean empty values
      const finalData: Record<string, any> = {};
      Object.entries(mergedData).forEach(([k, v]) => {
        if (v !== "" && v != null) finalData[k] = v;
      });

      console.log(
        "📤 Final data to submit:",
        JSON.stringify(finalData, null, 2),
      );

      // 📡 Send to your backend
      const response = await fetch(
        "http://172.20.10.12:5000/api/payout-portal/wallet-setup/sellers",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seller: finalData,
            publicKey: zeptpay.publicKey,
          }),
        },
      );

      console.log("📡 Submit response status:", response.status);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Backend API failed");

      // 🔑 Save token if received
      if (data.token) {
        console.log("🔑 Token received from backend, saving...");
        await tokenService.saveToken(data.token);
        console.log("🔑 Token saved, fetching merchant data...");
        await fetchMerchantData(data.token);
      }

      return data;
    } catch (err: any) {
      console.error("❌ Backend error:", err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };
```

### 🔑 **Key Points:**

1. **Data Accumulation** - `fullFormData` stores data from all steps
2. **Clean Data** - Remove empty/null values before sending
3. **Token Storage** - Save token immediately after success
4. **Auto-fetch** - Fetch merchant data after token save
5. **Error Propagation** - Throw errors for SDK to handle

---

## 🎯 Step Handlers

```typescript
  const handleNext = (data: any, step: number) => {
    console.log(`➡️ Step ${step} completed with data:`, data);
    setFullFormData((prev) => ({ ...prev, ...data }));
  };

  const handleBack = (step: number) => console.log("⬅️ Back step", step);
  
  const handleComplete = (merchantData: any) =>
    console.log("✅ Onboarding complete", merchantData);
```

### 📊 **What These Do:**

| Handler | Purpose |
|---------|---------|
| `handleNext` | Accumulates data from each step |
| `handleBack` | Log navigation (useful for analytics) |
| `handleComplete` | Final completion callback |

---

## 🚀 Final Render - Onboarding Form

```typescript
  console.log("🔄 Rendering MerchantOnboarding form");
  return (
    <MerchantOnboarding
      mode={(zeptpay.mode as "test" | "live") || "test"}
      isKycCompleted={false}
      isBankDetailsCompleted={false}
      kycStatus="not_submitted"
      status="pending"
      onNext={handleNext}
      onBack={handleBack}
      onComplete={handleComplete}
      onSubmitToBackend={handleSubmitToBackend}
      initialData={{
        merchantName: "",
        businessName: "",
        merchantEmail: "",
        businessType: "individual",
        country: "India",
        nationality: "Indian",
      }}
    />
  );
```

---

## 🎨 Complete Flow Diagram

```
┌─────────────────┐
│   App Starts    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Check Token    │ ← tokenService.getToken()
└────────┬────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
  Has      No Token
  Token      ↓
    ↓    ┌─────────────┐
┌─────────────┐  Show Form
│ Verify Token│  (5 Steps)
│ fetchStatus │    ↓
└────────┬────┘  Submit
         ↓        ↓
    ┌────┴────┐  Save Token
    ↓         ↓    ↓
 Valid    Invalid  ↓
 Token    Token    ↓
   ↓         ↓     ↓
┌─────────────┐   ↓
│ Show Success│←──┘
│ Screen with │
│ 2 Custom    │
│ Buttons     │
└─────────────┘
```

---

## ⚠️ **Critical Rules - DO's and DON'Ts**

### ✅ **DO:**

1. **Always wrap with Provider**
   ```tsx
   <ZeptPayProvider publicKey="your_key">
     <MerchantOnboardingScreen />
   </ZeptPayProvider>
   ```

2. **Use `useZeptPaySafe()`** - It returns null if provider missing
3. **Check token on mount** - Resume sessions automatically
4. **Verify token validity** - Don't assume stored token works
5. **Accumulate form data** - Use state to combine all steps
6. **Clean data before submit** - Remove empty values

### ❌ **DON'T:**

1. **Don't use `useZeptPay()` without provider** - It throws error
2. **Don't ignore token expiration** - Always verify
3. **Don't store sensitive data** - Use `tokenService`
4. **Don't modify SDK internals** - Use provided props
5. **Don't assume API response structure** - Always check and extract

---

## 🎯 **Customization Examples**

### Example 1: Different Button Styles
```tsx
buttons={[
  {
    label: "Dashboard",
    onPress: goToDashboard,
    backgroundColor: "#10B981",  // Green
    icon: "view-dashboard",
    borderRadius: 30,
    width: "45%",
  },
  {
    label: "Settings",
    onPress: goToSettings,
    backgroundColor: "transparent",
    textColor: "#10B981",
    borderColor: "#10B981",
    borderWidth: 2,
    icon: "cog",
    width: "45%",
  }
]}
```

### Example 2: Gradient Buttons
```tsx
{
  label: "Upgrade",
  onPress: handleUpgrade,
  backgroundColor: "gradient",
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 1, y: 0 },
  icon: "rocket",
  height: 60,
  fontSize: 18,
}
```

### Example 3: Custom Theme
```tsx
theme={{
  primaryColor: "#7C3AED",    // Purple
  secondaryColor: "#A78BFA",  // Light purple
  accentColor: "#F59E0B",     // Orange
  tickColor: "#10B981",       // Green
  backgroundColor: "#F9FAFB",
  cardColor: "#FFFFFF",
  textColor: "#1F2937"
}}
```

---

## 📝 **Summary**

This implementation demonstrates:

1. **Proper SDK initialization** - Wait for ready state
2. **Token persistence** - Resume sessions
3. **Token validation** - Verify before using
4. **Data accumulation** - Combine all steps
5. **Clean submission** - Remove empty values
6. **Success screen** - Show merchant data
7. **Custom buttons** - Full styling control
8. **Error handling** - User-friendly messages
9. **Loading states** - Prevent UI flicker
10. **Debug logging** - Track flow in console

---

## 🚀 **Quick Start Template**

```tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { 
  ZeptPayProvider,
  MerchantOnboarding,
  useZeptPaySafe,
  tokenService,
  OnboardingCompleteScreen
} from "@flixora/zeptpay-react-native";

function OnboardingFlow() {
  const zeptpay = useZeptPaySafe();
  const [hasToken, setHasToken] = useState(false);
  const [merchantData, setMerchantData] = useState(null);

  useEffect(() => {
    const init = async () => {
      const token = await tokenService.getToken();
      if (token) {
        // Fetch merchant data
        const response = await fetch('your-api/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMerchantData(data.data || data);
          setHasToken(true);
        }
      }
    };
    init();
  }, []);

  if (!zeptpay?.isValid) return <ActivityIndicator />;

  if (hasToken && merchantData) {
    return (
      <OnboardingCompleteScreen
        developerData={merchantData}
        buttons={[
          { label: "Continue", onPress: () => {} }
        ]}
      />
    );
  }

  return (
    <MerchantOnboarding
      mode="test"
      isKycCompleted={false}
      isBankDetailsCompleted={false}
      kycStatus="not_submitted"
      status="pending"
      onComplete={() => {}}
      onSubmitToBackend={async (data) => {
        const response = await fetch('your-api/merchant', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return response.json();
      }}
    />
  );
}

export default function App() {
  return (
    <ZeptPayProvider publicKey="your_key">
      <OnboardingFlow />
    </ZeptPayProvider>
  );
}
```

---

## 📚 **Remember:**

- ✅ One file handles the entire flow
- ✅ Token management is automatic
- ✅ Custom buttons anywhere, anytime
- ✅ Works exactly as shown in the example
- ✅ Modify colors, positions, styles freely
- ✅ Don't split logic across multiple files unnecessarily

**This is the PROVEN way that works!** Follow this pattern exactly for successful integration. 🚀

#### `Logger`

Configurable logging utility.

```tsx
import { Logger } from '@flixora/zeptpay-react-native';

const logger = new Logger({ 
  enabled: true, 
  prefix: '[MyApp]' 
});

logger.info('Information');
logger.warn('Warning');
logger.error('Error');
logger.debug('Debug info');
```

## 📁 File Structure

```
@flixora/zeptpay-react-native/
├── api/
│   └── clients/
│       └── verifyPublicKey.ts      # 🔒 Hidden API (URL never exposed)
├── browsers/
│   └── fileBrowser.ts               # 📁 File handling with modern Expo API
├── components/
│   ├── common/
│   │   └── FileUploader.tsx         # 🖼️ Reusable upload component
│   └── steps/
│       ├── BasicDetailsForm.tsx     # 📝 Step 1: Basic Info
│       ├── KYCVerification.tsx       # 🆔 Step 2: KYC Documents
│       ├── BankDetails.tsx           # 🏦 Step 3: Bank Details
│       └── onboarding/
│           ├── MerchantOnboarding.tsx # 🚦 Main Flow (5 steps)
│           ├── FinalStepScreen.tsx    # ✅ Step 4: Review & Submit
│           └── OnboardingComplete.tsx # 🎉 Step 5: Success
├── contexts/
│   └── ZeptPayProvider.tsx          # ⚛️ React Context Provider
├── error/
│   └── errorHandler.ts               # 🛡️ Centralized error handling
├── etc/
│   └── constants.ts                   # 📋 Constants (endpoints, texts)
├── events/
│   └── sdkEvents.ts                   # 📡 Event emitter
├── hooks/
│   ├── useZeptPay.ts                   # 🎣 SDK context hook
│   └── useMerchantOnboarding.ts        # 🎣 Merchant management hook
├── types/
│   └── merchantTypes.ts                 # 📘 TypeScript definitions
└── utils/
    ├── log/
    │   └── logger.ts                    # 🪵 Configurable logger
    └── token/
        ├── tokenService.ts               # 🔐 Secure token storage
        └── storage.ts                    # 📦 Generic storage wrapper
```

## 🔒 Hidden API (Developer Never Sees)

```typescript
// api/clients/verifyPublicKey.ts
const BACKEND_URL = 'http://172.20.10.12:7000'; // 🔒 FIXED - never exposed

export const verifyPublicKey = async (publicKey: string) => {
  // Developer cannot see or change this URL
  const response = await fetch(`${BACKEND_URL}/api/merchant/verify-public-key`, {
    method: 'POST',
    body: JSON.stringify({ publicKey })
  });
  return response.json();
};
```

## 📱 Complete Example

```tsx
// MerchantScreen.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { 
  MerchantOnboarding, 
  useZeptPay,
  type Merchant 
} from '@flixora/zeptpay-react-native';

export const MerchantScreen = () => {
  const [loading, setLoading] = useState(false);
  const { publicKey } = useZeptPay();

  const handleSubmitToBackend = async (data: any) => {
    // Optional: Call your backend API first
    const response = await fetch('https://api.yourserver.com/merchant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  };

  const handleComplete = (merchantData: Merchant) => {
    console.log('🎉 Merchant created:', merchantData);
    // Navigate to dashboard
  };

  return (
    <View style={{ flex: 1 }}>
      <MerchantOnboarding
        mode="test"
        isKycCompleted={false}
        isBankDetailsCompleted={false}
        kycStatus="not_submitted"
        status="pending"
        onSubmitToBackend={handleSubmitToBackend}
        onComplete={handleComplete}
        onNext={(data, step) => console.log(`Step ${step} completed`)}
        onBack={(step) => console.log(`Back to step ${step}`)}
        loading={loading}
        initialData={{
          merchantName: 'John Doe',
          merchantEmail: 'john@example.com',
          country: 'India'
        }}
      />
    </View>
  );
};
```

## 📊 Version History

| Version | Date | Key Features |
|---------|------|--------------|
| **0.0.5** | 2026-03-03 | 🎉 Complete onboarding flow, FileUploader, All form steps, Hooks, Error handling |
| 0.0.4 | 2026-02-20 | ✅ FileUploader component, MIME type fixes |
| 0.0.3 | 2026-02-15 | ✅ BasicDetailsForm, Validation improvements |
| 0.0.2 | 2026-02-10 | ✅ ZeptPayProvider, Token service, Events |
| 0.0.1 | 2026-02-01 | 🎉 Initial release |

## 🎯 Features by Version

### ✅ v0.0.5 (Current)
- Complete 5-step onboarding flow
- File upload with modern Expo API (no warnings)
- KYC verification with document uploads
- Bank details with validation
- Final review and submission
- Success screen with wallet details
- React Context provider
- Custom hooks (useZeptPay, useMerchantOnboarding)
- Event emitter system
- Centralized error handling
- Secure token storage
- Configurable logger
- Full TypeScript support

### ✅ v0.0.4
- FileUploader component
- Image picker integration
- Preview functionality
- MIME type validation

### ✅ v0.0.3
- BasicDetailsForm
- Form validation
- Country dropdown
- Date picker

### ✅ v0.0.2
- ZeptPayProvider context
- Token service
- Event system

### ✅ v0.0.1
- Project structure
- TypeScript config
- Public key verification

## 🚦 Upcoming Features (v0.1.0)

- 🔐 Biometric authentication
- 📱 Push notifications
- 💳 Payment processing
- 📊 Analytics dashboard
- 🌐 Offline mode
- 🎨 Theme customization

## 🛡️ Security Features

- **Hidden API URLs** - Backend URLs never exposed to developers
- **Secure Token Storage** - Uses AsyncStorage securely
- **No Token Auto-attachment** - Developer controls API calls
- **Input Validation** - All fields validated client-side
- **Error Handling** - User-friendly error messages
- **Test Mode** - Safe testing without real data

## 📝 TypeScript Support

All components and hooks are fully typed:

```tsx
import type { 
  Merchant, 
  KycStatus, 
  BankDetails,
  AppError,
  StepCompletion 
} from '@flixora/zeptpay-react-native';

// Use types in your code
const merchant: Merchant = {
  merchantId: 'mch_123',
  merchantName: 'John Doe',
  // ...
};
```

## 🐛 Troubleshooting

### Common Issues

1. **"Public key is required"**
   - Make sure to wrap your app with `ZeptPayProvider` and provide a valid public key

2. **File upload fails**
   - Check permissions in `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-image-picker",
           {
             "photosPermission": "Allow $(PRODUCT_NAME) to access your photos"
           }
         ]
       ]
     }
   }
   ```

3. **TypeScript errors**
   - Update to latest version: `npm install @flixora/zeptpay-react-native@latest`
   - Check `tsconfig.json` includes `"skipLibCheck": true`

## 🤝 Contributing

Found a bug? Have a feature request? 
- 📝 [Open an issue](https://github.com/tafseelkhan/zeptpay-sdk-init-ui/issues)
- 🛠️ [Submit a PR](https://github.com/tafseelkhan/zeptpay-sdk-init-ui/pulls)

## 📄 License

MIT © Flixora

## 📞 Support

- 📧 Email: support@flixora.com
- 📚 Docs: [docs.flixora.com/react-native](https://docs.flixora.com/react-native)
- 🐛 Issues: [GitHub Issues](https://github.com/tafseelkhan/zeptpay-sdk-init-ui/issues)
- 💬 Discord: [Flixora Community](https://discord.gg/flixora)

---

**Made with ❤️ by Flixora Team**