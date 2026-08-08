import Foundation

// Pour activer Foundation Models dans le build EAS (iOS 18.1+), décommenter :
// import FoundationModels

@objc(AppleIntelligenceModule)
class AppleIntelligenceModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func reformulate(
    _ rawText: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 18.1, *) {
      Task {
        // Décommenter pour le build EAS avec FoundationModels :
        // do {
        //   let session = LanguageModelSession()
        //   let prompt = "Reformule ce que j'ai mangé en une seule phrase claire et naturelle en français. Ne rajoute rien, ne retire rien. Texte : \(rawText)"
        //   let response = try await session.respond(to: prompt)
        //   resolve(response.content)
        // } catch {
        //   reject("REFORMULATION_ERROR", error.localizedDescription, error)
        // }

        // Placeholder — retourne le texte brut jusqu'à l'activation de FoundationModels :
        resolve(rawText)
      }
    } else {
      reject("NOT_AVAILABLE", "Apple Intelligence requires iOS 18.1+", nil)
    }
  }
}
