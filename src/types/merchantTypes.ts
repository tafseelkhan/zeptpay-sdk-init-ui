export type BusinessType = "individual" | "company";
export type Mode = "test" | "live";
export type MerchantStatus = "active" | "suspended" | "blocked" | "pending";
export type KycStatus = "not_submitted" | "pending" | "verified" | "rejected";

export interface KYCDetails {
  panNumber?: string;
  aadhaarNumber?: string;
  gstNumber?: string;
  registeredBusinessName?: string;
  panCardUrl?: string;
  aadhaarUrl?: string;
  addressProofUrl?: string;
  selfieUrl?: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  cancelledChequeUrl?: string;
}

export interface Merchant {
  _id?: string;
  merchantId: string;
  status: MerchantStatus;
  kycStatus: KycStatus;
  isKycCompleted: boolean;
  isBankDetailsCompleted: boolean;
  mode: Mode;
  merchantDID?: string;
  walletId?: string;
  merchantName: string;
  merchantEmail: string;
  merchantPhone?: string;
  businessName?: string;
  businessType?: BusinessType;
  businessCategory?: string;
  country?: string;
  nationality?: string;
  dob?: string;
  kycDetails?: KYCDetails;
  bankDetails?: BankDetails;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMerchantPayload {
  merchantName: string;
  merchantEmail: string;
  merchantPhone?: string;
  businessName?: string;
  businessType?: BusinessType;
  businessCategory?: string;
  country?: string;
  dob?: string;
  nationality?: string;
  mode?: Mode;
  metadata?: Record<string, unknown>;
}

export interface MerchantCreateResponse {
  success: boolean;
  token: string;
  merchant: Merchant;
}

export interface MerchantOnboardingProps {
  merchantId?: string;
  mode: Mode;
  initialStep?: number;
  isKycCompleted: boolean;
  isBankDetailsCompleted: boolean;
  kycStatus: KycStatus;
  status: MerchantStatus;
  initialData?: Partial<Merchant>;
  onNext: (stepData: Partial<Merchant>, step: number) => void;
  onBack: (currentStep: number) => void;
  onComplete: (merchantData: Merchant) => void;
  onSubmitToBackend?: (data: any) => Promise<any>;
  loading?: boolean;
}

export interface StepConfig {
  id: number;
  name: string;
  key: "basic" | "kyc" | "bank" | "complete" | "final";
  isRequired: boolean;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface StepCompletion {
  basic: boolean;
  kyc: boolean;
  bank: boolean;
  final: boolean;
}

export interface ZeptPayConfig {
  publicKey: string;
}

export interface MerchantStatusResponse {
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  status: 'active' | 'suspended' | 'blocked' | 'pending';
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  kycCompleted: boolean;
  bankDetailsCompleted: boolean;
  mode: 'test' | 'live';
  createdAt: string;
  updatedAt: string;
}