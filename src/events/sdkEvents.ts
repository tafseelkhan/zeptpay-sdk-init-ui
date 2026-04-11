// src/events/sdkEvents.ts

import { NativeEventEmitter } from "react-native";

export type SDKEventType =
  | "onboarding:started"
  | "onboarding:submitting"
  | "onboarding:success"
  | "onboarding:error"
  | "token:missing"
  | "token:refreshed"
  | "token:cleared";

export interface SDKEventData {
  type: SDKEventType;
  timestamp: number;
  data?: any;
}

class SDKEvents {
  private static instance: SDKEvents;
  private emitter: NativeEventEmitter;

  private constructor() {
    this.emitter = new NativeEventEmitter();
  }

  static getInstance(): SDKEvents {
    if (!SDKEvents.instance) {
      SDKEvents.instance = new SDKEvents();
    }
    return SDKEvents.instance;
  }

  emitEvent(type: SDKEventType, data?: any) {
    const eventData: SDKEventData = {
      type,
      timestamp: Date.now(),
      data,
    };

    this.emitter.emit(type, eventData);

    if (__DEV__) {
      console.log(`[ZeptPay Event] ${type}`, data ? "(with data)" : "");
    }
  }

  addListener(type: SDKEventType, callback: (data: SDKEventData) => void) {
    return this.emitter.addListener(type, callback);
  }

  removeAllListeners(type: SDKEventType) {
    this.emitter.removeAllListeners(type);
  }
}

export const sdkEvents = SDKEvents.getInstance();
