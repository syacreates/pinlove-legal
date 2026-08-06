import UIKit
import UniformTypeIdentifiers

/// Reçoit un lien partagé depuis TikTok ou Instagram et rouvre PinLove
/// sur l'écran d'import avec ce lien pré-rempli, via pinlove://import?url=...
class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        handleSharedItem()
    }

    private func handleSharedItem() {
        guard
            let item = extensionContext?.inputItems.first as? NSExtensionItem,
            let attachments = item.attachments
        else {
            close()
            return
        }

        let urlType = UTType.url.identifier
        let textType = UTType.plainText.identifier

        if let provider = attachments.first(where: { $0.hasItemConformingToTypeIdentifier(urlType) }) {
            provider.loadItem(forTypeIdentifier: urlType, options: nil) { [weak self] item, _ in
                let sharedURL = (item as? URL)?.absoluteString
                self?.openHostApp(with: sharedURL)
            }
        } else if let provider = attachments.first(where: { $0.hasItemConformingToTypeIdentifier(textType) }) {
            provider.loadItem(forTypeIdentifier: textType, options: nil) { [weak self] item, _ in
                self?.openHostApp(with: item as? String)
            }
        } else {
            close()
        }
    }

    private func openHostApp(with sharedText: String?) {
        guard
            let sharedText,
            let encoded = sharedText.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
            let deepLink = URL(string: "pinlove://import?url=\(encoded)")
        else {
            close()
            return
        }

        DispatchQueue.main.async { [weak self] in
            _ = self?.openURLViaResponderChain(deepLink)
            self?.close()
        }
    }

    /// Les extensions n'ont pas accès à UIApplication.shared — on remonte
    /// la responder chain jusqu'à UIApplication pour ouvrir l'app hôte.
    @discardableResult
    private func openURLViaResponderChain(_ url: URL) -> Bool {
        var responder: UIResponder? = self
        let selector = sel_registerName("openURL:")
        while let current = responder {
            if current.responds(to: selector), let application = current as? UIApplication {
                return application.perform(selector, with: url) != nil
            }
            responder = current.next
        }
        return false
    }

    private func close() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
