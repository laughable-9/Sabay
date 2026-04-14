# Sabay

A peer-to-peer carpool platform for Baguio City and Benguet commuters. STS 1 Final Project, 2nd Semester AY 2025-2026 (Clarence Kyle L. Pagunsan).

**Read `PRD.md` for the full product spec.** This file is the engineering quick-reference.

---

## Project status

The repo is a fresh scaffold — only `PRD.md` and `README.md` exist. The Expo project has **not** been initialized yet. Session 1 (per PRD §11) starts with `npx create-expo-app`.

## Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo SDK 54 (TypeScript) |
| Routing | Expo Router (file-based) |
| UI | React Native Paper |
| State | React Context + `useReducer` |
| Persistence | `@react-native-async-storage/async-storage` |
| Maps | `react-native-maps` + Google Maps Directions API |
| Location | `expo-location` |
| Media | `expo-image-picker`, `expo-file-system` |
| Sharing | `expo-linking`, `expo-sharing` |
| Icons | `@expo/vector-icons` |
| Package manager | **npm** |
| Target platform | **iOS only** (Expo Go on iPhone). Android is not a concern for this project. |

## Common commands

```bash
npm install            # install deps
npx expo start         # start dev server; scan QR with Expo Go on iPhone
npx expo start --ios   # open in iOS simulator (if on macOS)
npx tsc --noEmit       # type-check without emitting
```

## Environment

Copy `.env.example` → `.env` (gitignored) and fill in:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

Expo exposes only `EXPO_PUBLIC_*` vars to the JS bundle at runtime. Read via `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (already wired through `constants/config.ts`).

The key is **not required for the demo** — route responses for 5-6 common Baguio routes are cached locally per PRD §2.1. Add the real key when integrating live Directions API calls.

## Architecture (target — see PRD §10 for full tree)

```
app/              # Expo Router screens
  (auth)/         # signup, verify-rider, verify-driver, verify-pending
  (rider)/        # home, ride-details, active-ride, ride-complete
  (driver)/       # home, create-ride, active-ride, ride-complete
  pricing.tsx, tracking.tsx, gas-prices.tsx, profile.tsx
components/       # MapView, RideCard, PriceBreakdown, VerifiedBadge, etc.
context/          # AuthContext, AppContext, RideContext
utils/            # pricing.ts, gasPrice.ts, mockData.ts, storage.ts
constants/        # theme.ts, config.ts
```

17 total screens across 4 groups (Auth/Verification, Rider, Driver, Shared). See PRD §4 for the full screen list and purpose of each.

## Core domain logic

**Pricing formula (PRD §5):**
```
BaseFuelCost = (distanceKm / fuelEfficiency) * fuelPricePerLiter * terrainMultiplier
FarePerPerson = (BaseFuelCost / passengerCount) + platformFee
```
Platform fee = max(PHP 10, 5% of fare). Terrain multiplier defaults to 1.0, bumps to 1.2 on steep routes.

**Crowdsourced gas pricing (PRD §6):** rolling **median** (not mean) of last 20 valid submissions in past 7 days; outliers beyond 2σ are flagged and excluded. Fallback to PHP 65/L if fewer than 5 submissions exist.

**Passenger tracking (PRD §7):** driver-confirmed check-ins only. No automatic GPS proximity detection — unreliable in Baguio terrain.

**Shareable tracking link (PRD §8):** token-based URL, browser-viewable (no app install), auto-expires when ride ends.

## Demo-mode assumptions

- **No backend.** Everything runs locally. AsyncStorage is the source of truth.
- **Verification is simulated** — real image pickers, but auto-approve after 2-3s delay (PRD §3.3.3).
- **Mock data on first launch:** 6 verified users, 8 rides, 18 gas price submissions (see `utils/mockData.ts`).
- **Driver pin on map is scripted** to move along a path during active ride.
- Production would add Node/Supabase backend, real KYC review, SMS OTP via Semaphore, etc.

## Data privacy (RA 10173) — non-negotiable

Per PRD §3.3, the verification flow must treat ID photos, licenses, selfies, and OR/CR as **ephemeral**: captured, used for verification, then deleted. In demo code this means storing them in AsyncStorage only while verification is "pending", then clearing the URIs once status flips to approved. Other users must never see raw phone numbers, emails, full names, unmasked plate numbers, or license numbers — only first name, masked plate (last 3 chars), verified badge, rating.

## Workflow rules

- **Never push to `main` or merge to `main` without explicit user consent.** Work lands on `dev`; user decides when to promote.
- Current working branch: `dev`.
- **No `Co-Authored-By` lines** in commit messages.
- Don't run destructive git ops (`reset --hard`, force push, branch delete) without asking first.

## Build plan reference

Two ~5-hour sessions (PRD §11):
- **Session 1:** project init, theme, auth/verification UI, mock data + context, rider home/search, ride details, driver create-ride.
- **Session 2:** active ride screens (rider + driver), gas price hub, pricing calculator, tracking link, ride complete, polish.

After Session 1 = minimum viable demo. After Session 2 = full Shark Tank pitch-ready build.
