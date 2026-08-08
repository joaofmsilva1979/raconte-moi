import { NativeModules } from 'react-native';

const { AppleIntelligenceModule } = NativeModules;

export async function reformulate(rawText: string): Promise<string> {
  if (!AppleIntelligenceModule) {
    throw new Error('AppleIntelligenceModule not available on this device');
  }
  return AppleIntelligenceModule.reformulate(rawText);
}

export function isAvailable(): boolean {
  return !!NativeModules.AppleIntelligenceModule;
}
