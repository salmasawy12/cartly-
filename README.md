# Shared Grocery List

Real-time shared shopping lists (React Native/Expo + Spring Boot).

## Stack

- **Backend**: Spring Boot 4.1.1, Java 17, Maven, Postgres, Spring Security + JWT, WebSocket (STOMP)
- **Mobile**: Expo (React Native 0.86, TypeScript), React Navigation, `@stomp/stompjs` for real-time sync

Mobile is an Expo project (`expo prebuild` generates `ios/`) rather than a bare React Native CLI project — the bare CLI's native template hit unresolved React Native New Architecture bootstrap bugs on this machine's toolchain; Expo's native template doesn't.

## Running locally

### 1. Database

```
docker compose up -d
```

Starts Postgres on `localhost:5432` (db `grocerylist`, user/pass `grocerylist` / `DevPassword123` — dev only, see `backend/src/main/resources/application.properties`).

### 2. Backend

```
cd backend
./mvnw spring-boot:run
```

Runs on `http://localhost:8082`. Tables are created automatically (`spring.jpa.hibernate.ddl-auto=update`).

### 3. Mobile app

Uses Node 22.13+ (see `mobile/.nvmrc` — run `nvm use` in that folder).

```
cd mobile
npm install
```

**iOS Simulator** (native build, recommended — full app icon/splash, closest to production):

```
npx expo prebuild --platform ios   # only needed once, or after changing native config
npx expo run:ios
```

**Physical device** (no local native build needed):

```
npx expo start
```

Scan the QR code with Expo Go ([App Store](https://apps.apple.com/app/expo-go/id982107779) / [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)).

The app auto-detects the right backend host: Expo's dev-server connection info for a physical device/Expo Go, `localhost`/`10.0.2.2` fallback for simulators/emulators (see `mobile/src/api/config.ts`).

## What's built (MVP)

- Register / login (JWT), session persists across app restarts
- Create a list, view your lists
- Add items, check/uncheck items
- Real-time sync: item changes broadcast over WebSocket to every device viewing that list
- Share a list with another user by email
- Free/Pro paywall stub: free tier capped at 1 list and no sharing; a "Simulate Pro purchase" dev button unlocks both (no real payment processor wired up yet)

## Not built yet

- Real in-app purchases (App Store/Play Store billing) — currently a local dev-only toggle
- Multiple stores, price tracking, shopping history, recurring items, barcode scan, widgets, cloud backup beyond the DB itself
- App Store / Play Store listing assets (icon, splash, screenshots, privacy policy)
