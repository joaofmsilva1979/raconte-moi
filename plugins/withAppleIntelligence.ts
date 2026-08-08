import { ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import * as path from 'path';
import * as fs from 'fs';

const withAppleIntelligence: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const iosDir = config.modRequest.platformProjectRoot;
      const appName = config.modRequest.projectName!;
      const targetDir = path.join(iosDir, appName);
      const nativeDir = path.join(__dirname, '..', 'native', 'AppleIntelligence');

      for (const file of ['AppleIntelligenceModule.swift', 'AppleIntelligenceModule.m']) {
        const src = path.join(nativeDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(targetDir, file));
        }
      }
      return config;
    },
  ]);
};

export default withAppleIntelligence;
