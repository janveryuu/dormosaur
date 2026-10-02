# Android release

Dormosaur's Android app opens **https://dormosaur.vercel.app/** in a Trusted Web Activity using Google's Android Browser Helper. It shares the browser's secure login, downloads, service worker, and web notification support. The server-side Next.js APIs remain on Vercel. This is an online app; it does not bundle the website or implement native exact-time alarms.

## Build

Requirements: Node.js 22 or newer, JDK 21, Android SDK platform 36, and Android build tools. Set `JAVA_HOME` and `ANDROID_HOME`, or put the SDK path in the ignored `android/local.properties` file.

```bash
npm ci
npm run android:build
```

The command builds and lints a signed, non-debuggable, optimized release and copies it to **dormosaur.apk** in the repository root. It also writes `dormosaur.apk.sha256` and the public certificate association at `public/.well-known/assetlinks.json`.

For the **first release only**, create a new signing identity:

```bash
npm run android:build -- --init-signing
```

Private signing files live in `.android-signing/`, which Git ignores. Back up that entire directory securely. Future updates must use the same key and a higher `versionCode` in `android/app/build.gradle`; replacing the key prevents installed copies from accepting updates. Keep the keystore and passwords out of GitHub, APK downloads, and public archives.

## Publish and install

1. Deploy the website with `public/.well-known/assetlinks.json`. The URL `https://dormosaur.vercel.app/.well-known/assetlinks.json` must return this JSON with HTTP 200, without login or redirects.
2. Confirm its SHA-256 certificate fingerprint matches the release APK. The build prints the public fingerprint.
3. Share `dormosaur.apk` and its SHA-256 checksum. On Android 7 or newer, allow installation from the app used to download the APK, then install it. Use an up-to-date TWA-capable browser such as Chrome.
4. Check launch, email and Google sign-in, timetable import/export, recipes, notification permission, and reopening after closing the app on a real device before community distribution.

If site verification has not completed, Android opens a Custom Tab with a toolbar. The app remains usable. Verification requires the **release certificate**, not the debug certificate. Google Play signing would require adding the Play app-signing fingerprint to the website's association too.

See Google's [Trusted Web Activity guide](https://developer.chrome.com/docs/android/trusted-web-activity/integration-guide).
