import { reformulate, isAvailable } from '@/modules/AppleIntelligence';

export interface ReformulationResult {
  text: string;
  wasReformulated: boolean;
}

export async function reformulateText(rawText: string): Promise<ReformulationResult> {
  if (!isAvailable()) {
    return { text: rawText, wasReformulated: false };
  }
  try {
    const reformulated = await reformulate(rawText);
    if (!reformulated) {
      return { text: rawText, wasReformulated: false };
    }
    return { text: reformulated, wasReformulated: true };
  } catch {
    return { text: rawText, wasReformulated: false };
  }
}
