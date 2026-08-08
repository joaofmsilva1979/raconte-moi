#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppleIntelligenceModule, NSObject)

RCT_EXTERN_METHOD(
  reformulate:(NSString *)rawText
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

@end
