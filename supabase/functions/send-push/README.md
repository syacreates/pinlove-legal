# send-push — push natif du mode Rencontres

Sans cette configuration, tout fonctionne en **notifications in-app** (cloche
de l'onglet Rencontres). Le push natif ajoute les alertes app fermée : « Toujours
partant·e ? » la veille à 18 h, rappel H-2, confirmations, annulations.

Tout est gratuit (Firebase Cloud Messaging, Edge Functions, pg_net), sauf le
compte Apple Developer déjà nécessaire pour publier l'app iOS.

## 1. Firebase

1. Crée un projet sur https://console.firebase.google.com.
2. **Android** : ajoute une app Android `com.syacreates.pinlove`, télécharge
   `google-services.json` et place-le dans `android/app/` (le plugin Gradle
   s'active tout seul quand le fichier est présent).
3. **iOS** : ajoute une app iOS `com.syacreates.pinlove`, télécharge
   `GoogleService-Info.plist` et ajoute-le à la cible `App` dans Xcode.
   - Dans Xcode : *File → Add Package Dependencies…* →
     `https://github.com/firebase/firebase-ios-sdk`, produit **FirebaseMessaging**
     pour la cible `App` (`AppDelegate.swift` l'utilise automatiquement dès qu'il est présent).
   - Cible `App` → *Signing & Capabilities* : ajoute **Push Notifications** et
     **Background Modes → Remote notifications**.
   - Dans Firebase → *Paramètres du projet → Cloud Messaging* : importe ta clé
     APNs (.p8, créée sur developer.apple.com → Keys).
4. *Paramètres du projet → Comptes de service → Générer une nouvelle clé
   privée* : garde le fichier JSON pour l'étape 2.

Puis `npx cap sync` et recompile l'app (Android Studio / Xcode).

## 2. Supabase

```bash
supabase functions deploy send-push --no-verify-jwt
supabase secrets set PUSH_WEBHOOK_SECRET="<une longue chaîne aléatoire>"
supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat compte-de-service.json | tr -d '\n')"
```

Dans le SQL Editor (même secret qu'au-dessus) :

```sql
select vault.create_secret('https://<ref-projet>.supabase.co/functions/v1/send-push', 'push_function_url');
select vault.create_secret('<la même longue chaîne aléatoire>', 'push_webhook_secret');
```

Chaque ligne insérée dans `notifications` déclenche alors l'Edge Function
(trigger `notifications_push`), qui envoie le push à tous les appareils du
destinataire et renseigne `pushed_at`. Un jeton expiré est supprimé.
