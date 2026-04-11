# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🚀 Coming Soon
- Biometric authentication support
- Offline mode for merchant onboarding
- Analytics dashboard integration
- Push notifications for status updates

---

## [0.0.5] - 2026-03-03

### 📦 Current Release

#### ✨ New Features

##### 🔐 Provider & Context System
- **`ZeptPayProvider`** - React Context provider for SDK configuration
  - Initializes SDK with public key
  - Verifies public key automatically
  - Provides loading and error states
  - Logging control with `enableLogging` prop

```tsx
<ZeptPayProvider publicKey="your_public_key" enableLogging={true}>
  <MerchantOnboarding {...props} />
</ZeptPayProvider>
```

- **`useZeptPay` & `useZeptPaySafe`** - Hooks to access SDK context
  - `useZeptPay()` - Throws error if used outside provider
  - `useZeptPaySafe()` - Returns null if used outside provider

##### 📁 File Upload System (Modern Expo API)
- **`fileBrowser.ts`** - Complete file handling solution
  - Uses modern Expo FileSystem API (no deprecation warnings!)
  - Two conversion methods:
    - `convertFileToBase64()` - Uses new `File.base64()` method
    - `convertFileToBase64Fallback()` - Uses fetch + blob as fallback
  - MIME type validation for images and PDFs
  - Support for: JPEG, JPG, PNG, PDF

```tsx
// Modern approach - no warnings!
const base64 = await convertFileToBase64({ 
  uri: file.uri, 
  type: 'image/jpeg' 
});
```

##### 🎨 FileUploader Component
- **`FileUploader.tsx`** - Reusable file upload component
  - Camera and gallery options
  - Preview mode with image display
  - Upload progress indicator
  - Remove with confirmation
  - Test mode indicator
  - Accepts base64 strings directly

##### 📝 Form Components

###### BasicDetailsForm
- Business type selection (Individual/Company)
- Dynamic form fields based on business type
- Real-time validation
- Country dropdown with nationality sync
- Date picker for DOB
- Category chips for business category
- Smooth animations

###### KYCVerification
- PAN, Aadhaar, GST number validation
- Document upload for:
  - PAN Card
  - Aadhaar Card
  - Address Proof
  - Selfie
- Progress tracking (filled/total)
- Status badges (Verified/Pending/Rejected)
- Rejection message display
- Test mode auto-approval

###### BankDetails
- Account holder name validation
- Bank name with validation
- Account number with masking
- IFSC code validation with regex
- UPI ID (optional)
- Cancelled cheque upload
- Account preview with masking

##### 🚦 Onboarding Flow

###### MerchantOnboardingSheet
- Complete 5-step wizard:
  1. Basic Details
  2. KYC Verification
  3. Bank Details
  4. Final Review
  5. Complete
- Smooth step transitions
- Progress bar
- Step indicator
- Provider verification
- Error handling

###### FinalStepScreen
- Review all merchant data
- Two-step submission:
  1. Developer's backend API (optional)
  2. ZeptPay merchant creation
- Progress indicators for each step
- Token management
- Success response handling

###### OnboardingCompleteScreen
- Success celebration screen
- Profile image/avatar display
- Status cards (Account, KYC)
- Merchant information display
- Wallet details with copy functionality
- Fully customizable buttons
- Branding support

##### 🔧 Hooks System

###### useZeptPay
- `submitToBackend()` - Call developer's API
- `logout()` - Clear token and reset state
- `clearError()` - Reset error state
- Loading and error states
- Event emission

###### useMerchantOnboarding
- `createMerchant()` - Create merchant account
- `fetchStatus()` - Get merchant status
- `getToken()` - Retrieve stored token
- `reset()` - Clear all data
- Automatic data caching
- Event integration

##### 🔒 Token Management
- **`tokenService.ts`** - Secure token storage
  - `saveToken()` - Store token securely
  - `getToken()` - Retrieve token
  - `clearToken()` - Remove token
  - `hasToken()` - Check token existence
- Uses AsyncStorage for persistence
- No auto-attachment (developer controlled)

##### 📦 Storage Service
- **`storage.ts`** - Generic storage wrapper
  - `set()` - Store any data
  - `get()` - Retrieve data
  - `remove()` - Delete data
  - `clear()` - Clear all
- Type-safe with generics

##### 🎯 Event System
- **`sdkEvents.ts`** - Event emitter
  - Events:
    - `onboarding:started`
    - `onboarding:submitting`
    - `onboarding:success`
    - `onboarding:error`
    - `token:missing`
    - `token:refreshed`
    - `token:cleared`
- Timestamp included in all events
- Dev logging support

##### 🛡️ Error Handling
- **`errorHandler.ts`** - Comprehensive error handling
  - Network errors
  - API errors (400, 401, 403, 409, 422, 500)
  - Validation errors
  - User-friendly messages
  - Error codes

##### 📋 Constants
- **`constants.ts`** - Centralized constants
  - API endpoints
  - Error messages
  - UI texts
  - Storage keys
  - Timeouts

##### 🪵 Logger
- **`logger.ts`** - Configurable logger
  - Info, warn, error, debug levels
  - Prefix support
  - Conditional logging (DEV only)
  - Runtime enable/disable

##### 🔐 Public Key Verification
- **`verifyPublicKey.ts`** - Hidden API
  - Fixed backend URL (not exposed)
  - Automatic verification on provider mount
  - Returns merchant data if valid

```tsx
// Developer never sees/changes this URL
const BACKEND_URL = 'http://172.20.10.12:7000';
```

##### 📁 Project Structure
```
@flixora/zeptpay-react-native/
├── api/
│   └── clients/
│       └── verifyPublicKey.ts      # Hidden API calls
├── browsers/
│   └── fileBrowser.ts               # File handling
├── components/
│   ├── common/
│   │   └── FileUploader.tsx         # Reusable uploader
│   └── steps/
│       ├── BasicDetailsForm.tsx     # Step 1
│       ├── KYCVerification.tsx       # Step 2
│       ├── BankDetails.tsx           # Step 3
│       └── onboarding/
│           ├── MerchantOnboarding.tsx # Main flow
│           ├── FinalStepScreen.tsx    # Step 4
│           └── OnboardingComplete.tsx # Step 5
├── contexts/
│   └── ZeptPayProvider.tsx          # React context
├── error/
│   └── errorHandler.ts               # Error handling
├── etc/
│   └── constants.ts                   # Constants
├── events/
│   └── sdkEvents.ts                   # Event system
├── hooks/
│   ├── useZeptPay.ts                   # Provider hook
│   └── useMerchantOnboarding.ts        # Merchant hook
├── types/
│   └── merchantTypes.ts                 # TypeScript types
└── utils/
    ├── log/
    │   └── logger.ts                    # Logger
    └── token/
        ├── tokenService.ts               # Token management
        └── storage.ts                    # Storage wrapper
```

---

## [0.0.4] - 2026-02-20

### ✨ Features Added
- **FileUploader Component** - Initial version
  - Basic image picker integration
  - Preview functionality
  - Remove option

### 🐛 Bug Fixes
- Fixed MIME type detection for uploaded files
- Improved error messages for invalid file types

---

## [0.0.3] - 2026-02-15

### ✨ Features Added
- **BasicDetailsForm** - First step implementation
  - Name, email, phone fields
  - Business type selector
  - Country dropdown

### 🐛 Bug Fixes
- Fixed form validation on blur
- Improved keyboard handling on iOS

---

## [0.0.2] - 2026-02-10

### ✨ Features Added
- **ZeptPayProvider** - Context setup
- **Token Service** - Secure storage implementation
- **Event System** - Basic event emitter

### 🐛 Bug Fixes
- Fixed provider initialization errors
- Improved TypeScript type exports

---

## [0.0.1] - 2026-02-01

### 🎉 Initial Release

#### ✨ Core Features
- Basic project structure
- TypeScript configuration
- Public key verification
- Expo integration

#### 📦 Dependencies
- React Native 0.72+
- Expo SDK 50+
- TypeScript 5.0+

---

## Version History

| Version | Date | Key Features |
|---------|------|--------------|
| 0.0.5 | 2026-03-03 | ✅ Complete onboarding flow, FileUploader, All form steps, Hooks, Error handling |
| 0.0.4 | 2026-02-20 | ✅ FileUploader component, MIME type fixes |
| 0.0.3 | 2026-02-15 | ✅ BasicDetailsForm, Validation improvements |
| 0.0.2 | 2026-02-10 | ✅ ZeptPayProvider, Token service, Events |
| 0.0.1 | 2026-02-01 | 🎉 Initial release |

---

## Breaking Changes

### v0.0.4 → v0.0.5
- **FileUploader API Changed**: Now emits base64 string directly
  ```tsx
  // Old (v0.0.4)
  onUpload={(file) => handleFile(file)}
  
  // New (v0.0.5)
  onUpload={(base64) => handleBase64(base64)}
  ```

### v0.0.3 → v0.0.4
- No breaking changes

### v0.0.2 → v0.0.3
- No breaking changes

### v0.0.1 → v0.0.2
- **Provider Required**: SDK must be wrapped in `ZeptPayProvider`
  ```tsx
  // Old (v0.0.1)
  <MerchantOnboarding {...props} />
  
  // New (v0.0.2)
  <ZeptPayProvider publicKey="key">
    <MerchantOnboarding {...props} />
  </ZeptPayProvider>
  ```

---

## Migration Guides

### Upgrading from 0.0.4 to 0.0.5

1. **Update FileUploader usage**:
   ```tsx
   // Before
   const handleUpload = (file) => {
     const base64 = await convertFile(file);
     setData(base64);
   };
   
   // After - FileUploader does conversion internally
   const handleUpload = (base64) => {
     setData(base64); // Already converted!
   };
   ```

2. **Wrap with Provider** (if not already):
   ```tsx
   <ZeptPayProvider publicKey="your_key">
     <MerchantOnboarding />
   </ZeptPayProvider>
   ```

3. **Update imports**:
   ```tsx
   // New modular imports
   import { useZeptPay } from '@flixora/zeptpay-react-native/hooks';
   import { tokenService } from '@flixora/zeptpay-react-native/utils';
   ```

---

## Upcoming Features

### Planned for v0.1.0
- 🚀 **Biometric authentication** - Fingerprint/Face ID support
- 📱 **Push notifications** - Real-time status updates
- 💳 **Payment processing** - Accept payments
- 📊 **Analytics dashboard** - Merchant analytics
- 🌐 **Offline mode** - Work without internet

### Planned for v0.2.0
- 🎨 **Theme customization** - Custom colors and branding
- 📦 **Bulk operations** - Multiple merchants at once
- 🔄 **Auto-retry** - Failed upload retry mechanism
- 📈 **Performance monitoring** - SDK performance metrics

---

## Support

### Need Help?
- 📧 Email: support@flixora.com
- 📚 Docs: [docs.flixora.com/react-native](https://docs.flixora.com/react-native)
- 🐛 Issues: [GitHub Issues](https://github.com/tafseelkhan/zeptpay-sdk-init-ui/issues)
- 💬 Discord: [Flixora Community](https://discord.gg/flixora)

### Report Issues
When reporting issues, please include:
- SDK version
- React Native version
- Expo version (if using Expo)
- Device/OS details
- Steps to reproduce
- Error logs (if any)

---

## Contributors

- Tafseel Khan - Lead Developer
- Flixora Team - SDK Development

---

**Made with ❤️ by Flixora Team**

---