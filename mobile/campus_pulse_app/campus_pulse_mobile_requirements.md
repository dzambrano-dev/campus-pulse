# Campus Pulse Flutter Mobile App — Setup Requirements

## Project Goal

Migrate the Campus Pulse web app into a Flutter mobile app for Android and iOS.

Current mobile prototype includes:

- Login placeholder / Dev Login
- Bottom navigation
- Events feed screen
- Event cards
- Event detail screen
- Map screen with event pins
- User location support
- Light/dark map tiles
- Profile screen
- Interests picker
- Event creation form
- Image picker
- Date/time picker
- Map pin picker

Cloudflare backend authentication and Microsoft/Azure login are handled separately.

---

## Required Software

### 1. Flutter SDK

Install Flutter stable.

Verify:

```powershell
flutter --version
flutter doctor
```

Expected:

```text
[√] Flutter
[√] Android toolchain
[√] Connected device
```

Visual Studio for Windows desktop is optional and not required for Android/iOS mobile development.

---

### 2. VS Code

Required extensions:

- Flutter
- Dart

Recommended extensions:

- GitLens
- Error Lens

---

### 3. Android Studio

Used for:

- Android SDK
- Android emulator
- Android platform tools
- Android command-line tools

Required Android Studio SDK components:

- Android SDK Platform
- Android SDK Platform-Tools
- Android SDK Build-Tools
- Android Emulator
- Android SDK Command-line Tools latest

Verify emulator:

```powershell
flutter emulators
flutter devices
```

Launch emulator:

```powershell
flutter emulators --launch Pixel_8
```

Run app:

```powershell
flutter run
```

---

## Project Folder

Recommended project folder:

```text
campus_pulse_app
```

Avoid hyphens in the Flutter package name.

Correct:

```text
campus_pulse_app
```

Avoid:

```text
campus-pulse-app
```

---

## Flutter Dependencies

These should be in `pubspec.yaml` under `dependencies:`.

```yaml
dependencies:
  flutter:
    sdk: flutter

  http: ^1.2.2
  flutter_map: ^8.2.2
  latlong2: ^0.9.1
  geolocator: ^14.0.2
  image_picker: ^1.2.1
  path_provider: ^2.1.5
```

Version numbers may change slightly depending on install time.

Install/update dependencies:

```powershell
flutter pub get
```

Add missing dependencies:

```powershell
flutter pub add http
flutter pub add flutter_map latlong2 geolocator
flutter pub add image_picker
flutter pub add path_provider
```

---

## Android Permissions

File:

```text
android/app/src/main/AndroidManifest.xml
```

Add above `<application>`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Used for map/user location.

---

## Current Flutter Structure

Expected structure:

```text
lib/
  main.dart

  models/
    app_user.dart
    event.dart

  screens/
    login_screen.dart
    events_screen.dart
    event_detail_screen.dart
    map_screen.dart
    create_event_screen.dart
    profile_screen.dart
    interests_screen.dart

  services/
    auth_service.dart
    api_service.dart
    event_service.dart
    event_creation_service.dart
    interests_service.dart
    user_service.dart

  utils/
    constants.dart

  widgets/
    app_shell.dart
    event_card.dart
```

---

## Backend API Base URL

Located in:

```text
lib/utils/constants.dart
```

Expected:

```dart
class AppConstants {
  static const String apiBaseUrl =
      'https://campus-pulse-worker.vindictivity.workers.dev/api';

  static const String assetsBaseUrl =
      'https://campus-pulse-worker.vindictivity.workers.dev/assets/';
}
```

---

## API Endpoints Used by Mobile App

### Auth / Session

```text
GET  /api/user
POST /api/login
POST /api/logout
POST /api/signup
```

### Events

```text
GET    /api/get-events
GET    /api/get-event?id=<eventId>
POST   /api/create-event
DELETE /api/delete-event?id=<eventId>
```

### Users / Profile

```text
GET  /api/get-user?id=<userId>
GET  /api/get-user-id?username=<username>
POST /api/update-username
POST /api/update-avatar
POST /api/toggle-organizer
```

### Interests

```text
GET  /api/get-interests
POST /api/update-interests
```

---

## Backend/Auth Questions for Cloudflare Owner

The mobile app needs answers to these before real API calls can work:

1. Does `/api/login` return a token, a cookie, or both?
2. Does `/api/user` require a cookie or Authorization header?
3. Can mobile clients use the same session system as the browser?
4. Should Flutter store a JWT/token locally?
5. Should Flutter manually store and send a `Cookie` header?
6. What does `/api/login` expect from Flutter after Microsoft login?
7. Does the backend verify the Microsoft token, or does it trust email/name?
8. What fields are required for `/api/create-event`?
9. Does `/api/create-event` require image as base64 WebP?
10. What is the exact response format for successful login/signup/create-event?

Recommended mobile-friendly auth:

```text
Flutter Microsoft login
→ send Microsoft token/user info to Cloudflare
→ Cloudflare verifies login
→ Cloudflare returns app JWT/session token
→ Flutter stores token
→ Flutter sends Authorization: Bearer <token>
```

---

## Microsoft/Azure Info Needed

Required from whoever configured Microsoft/Azure:

```text
Azure Client ID
Tenant ID
Android package name
Android redirect URI
iOS bundle ID
iOS redirect URI
Required scopes
Backend login payload format
```

Current web app uses:

```text
Scope: User.Read
```

---

## Known Current Limitations

The mobile app currently has prototype behavior in some areas:

- Dev Login is temporary.
- API requests may fall back to demo data because mobile auth is not wired.
- Event creation form works, but real create may fail until auth/image upload are finished.
- Image picker works, but image conversion to backend-required base64/WebP still needs final implementation.
- Map pin opens event detail for local/demo data, but real events depend on authenticated API.
- Profile/interests saves may fail until mobile session/token handling is complete.

---

## What Still Needs Implementation

### High Priority

- Real Microsoft login in Flutter
- Mobile auth/session storage
- Authenticated API request helper
- Remove demo fallbacks after backend auth works
- Create event with real image payload
- Real logout

### Medium Priority

- Open external action links:
  - Discord
  - Instagram
  - Contact email
  - Custom website
- Delete event for owner/admin
- Admin promote/demote organizer
- Profile avatar upload
- Event card “Show on Map” should center map on selected event
- Role-based Create tab visibility

### Polish

- Better loading states
- Better empty/error states
- Better styling to match web app
- App icon/splash screen
- Production tile provider decision for maps
- iOS testing on macOS/Xcode

---

## Common Commands

Run app:

```powershell
flutter run
```

Hot reload while app is running:

```text
r
```

Hot restart while app is running:

```text
R
```

Quit running app:

```text
q
```

Clean rebuild:

```powershell
flutter clean
flutter pub get
flutter run
```

Check devices:

```powershell
flutter devices
```

Check emulators:

```powershell
flutter emulators
```

Launch emulator:

```powershell
flutter emulators --launch Pixel_8
```

Check Flutter setup:

```powershell
flutter doctor
```

Accept Android licenses:

```powershell
flutter doctor --android-licenses
```

---

## Recommended Next Steps

1. Cloudflare owner confirms mobile auth/session strategy.
2. Add real Microsoft login to Flutter.
3. Create centralized authenticated API client.
4. Wire all services to the authenticated API client.
5. Add image base64/WebP conversion for event creation.
6. Test real event feed, profile, interests, and create event.
7. Polish UI and role restrictions.
