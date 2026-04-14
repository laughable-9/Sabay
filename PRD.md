# [APP NAME] - Product Requirements Document v2

**A Carpool Platform for Baguio City Commuters**
React Native + Expo | iOS Demo Build
Author: Clarence Kyle L. Pagunsan
STS 1 Final Project | 2nd Semester AY 2025-2026

---

## 1. Product Overview

### 1.1 What Is This App

[APP NAME] is a mobile carpool platform built specifically for Baguio City and Benguet. It connects drivers heading along common routes with riders going the same way, splitting the cost of fuel fairly using a transparent, crowdsourced pricing model. Unlike ride-hailing apps like Grab, this is peer-to-peer carpooling where drivers are regular commuters (not for-hire), and costs are shared rather than charged as a commercial service.

### 1.2 The Problem

Baguio's road network was built for a much smaller population. Public transport (jeepneys, taxis) is limited and often overcrowded. The mountainous terrain makes congestion worse on key corridors. Students commuting to UP Baguio, SLU, and other schools, along with daily workers, face long waits and expensive taxi rides. There is no reliable, affordable, peer-to-peer ride-sharing solution currently serving this area.

### 1.3 Target Users

- **Primary:** UP Baguio students and faculty commuting from La Trinidad, Itogon, Tuba, and surrounding municipalities
- **Secondary:** Daily workers commuting within Baguio City and Benguet
- **Tertiary:** Intercity travelers (Baguio to Manila, Baguio to La Union, etc.)

### 1.4 What Makes This Different from SakayTayo

SakayTayo is an existing community-based carpooling app operating in Baguio & Benguet. It validates that demand for carpooling exists in this area. However, several gaps in its execution create an opportunity for a better solution:

| Aspect | SakayTayo | Our App |
|---|---|---|
| Ride Types | Carpool, Taxi Pool, Intercity, Hatid-Gulay, Requests (too many categories, confusing) | Carpool only (focused, one thing done well) |
| Pricing | Taxi Pool uses meter fare split; Carpool has no clear pricing model | Transparent algorithm with crowdsourced gas prices, fare shown before joining |
| Route Input | Text-based origin/destination (good approach) | Same text-based approach + Google Maps API for accurate distance/duration |
| Verification | Appears minimal (no visible ID/license requirement) | Full KYC: ID upload, selfie match, driver's license + OR/CR for drivers |
| Safety | No visible tracking or location sharing features | Shareable real-time tracking link, verified badges, ride history logs |
| Passenger Tracking | Manual seat count request, no real-time update | Driver-confirmed pickup with live count updating for all viewers |
| UI/UX | Functional but cluttered; too many tabs and categories; inconsistent styling; small text | Clean, focused, modern UI; clear user flows; large touch targets; consistent design system |
| Community | Free community service model, no business model | Platform fee (PHP 10 or 5%) enables sustainability while keeping fares low |
| Scope | Baguio & Benguet focus (good) | Same geographic focus, validates local demand exists |

The core insight: SakayTayo proved the market exists. Our app takes the same concept and adds the trust layer (verification), pricing transparency (crowdsourced + algorithmic), and safety features (tracking links) that are missing. The UI/UX overhaul alone would significantly improve adoption.

---

## 2. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React Native + Expo SDK 52 | JS/TS, runs on iOS natively via Expo Go, hot reload |
| Navigation | Expo Router (file-based) | File-based routing like Next.js, built into Expo |
| State | React Context + useReducer | Lightweight, no extra deps, enough for demo |
| Persistence | AsyncStorage | Key-value store, persists across app restarts |
| Maps | react-native-maps (Expo) | Native MapView, works in Expo Go on iOS |
| Distance Calc | Google Maps Directions API | Real distance/duration between two text locations |
| Location | expo-location | GPS for current position, tracking simulation |
| UI Components | React Native Paper or Tamagui | Pre-built Material components, speeds up dev |
| Icons | expo/vector-icons | Bundled with Expo, thousands of icons |
| Image Handling | expo-image-picker + expo-file-system | For capturing/uploading license photos during verification |
| Linking/Sharing | expo-linking + expo-sharing | Shareable tracking links, deep linking |

### 2.1 Route Handling: Text-Based + Google Maps API

Users type their origin and destination as free text (e.g., "La Trinidad" to "UP Baguio"). The app sends these to the Google Maps Directions API to get:

- Actual driving distance in km (used in the pricing formula)
- Estimated duration in minutes
- Route polyline coordinates (for drawing the route on the map)

This is better than predefined routes because it handles any origin/destination pair without maintaining a route database. It also matches how SakayTayo works (text-based), which validates the UX pattern, but adds the distance accuracy that SakayTayo lacks.

For the demo, cache 5-6 common Baguio route responses locally so the app works without internet during the pitch. The Google Maps free tier (200 USD/month credit) is more than enough for demo and early MVP traffic.

### 2.2 Why No Backend (For Demo)

Everything runs locally on the device with mock data and AsyncStorage. No server costs, no API latency, no internet dependency during the pitch. In production, you would add a backend (Node.js + PostgreSQL or Supabase) for multi-user sync, real verification review, and persistent gas price data.

---

## 3. Signup and Verification System

This is one of the key differentiators from SakayTayo and a direct response to the prof's Feedback #1 (privacy and safety). Every user on the platform is a verified, real person. Drivers undergo additional checks to ensure they are legally allowed to drive and their vehicle is registered.

### 3.1 Verification Requirements

| Requirement | Rider | Driver |
|---|---|---|
| Full Name | Required | Required |
| Phone Number (OTP verified) | Required | Required |
| Email Address | Required (UP email gets verified badge) | Required |
| Valid ID Photo | 1 government or school ID | 1 government ID (not school ID) |
| Selfie (face match) | Required | Required |
| Driver's License Photo | N/A | Required (front + back) |
| Vehicle Info | N/A | Make, model, year, color, plate number, seat count |
| OR/CR (vehicle registration) | N/A | Required (photo upload) |
| Terms & Data Privacy Consent | Required | Required |

### 3.2 Verification Flow

#### 3.2.1 Rider Verification (Screens 2-3)

1. User fills out basic info: name, phone number, email, password
2. Phone number verified via OTP (SMS sent through Semaphore API)
3. User uploads a photo of a valid ID (school ID or government ID). Can use camera or pick from gallery.
4. User takes a selfie. In production, this would be compared against the ID photo using a face-matching service. For the demo, it's a UI step that auto-approves.
5. User agrees to Terms of Service and Data Privacy Policy (explicit consent checkbox, required)
6. Status moves to "Pending Review". In the demo, auto-approves after a 2-second simulated delay.
7. Once approved, user gets a green "Verified" badge on their profile visible to ride matches.

#### 3.2.2 Driver Verification (Screen 4)

Drivers complete everything riders do, plus:

1. Upload front and back of driver's license. App extracts the visible license number but only stores a masked version (e.g., N04-12-XXXXX) after verification.
2. Enter vehicle information: make, model, year, color, plate number, total passenger seats, fuel type, estimated fuel efficiency (km/L).
3. Upload photo of OR/CR (Official Receipt / Certificate of Registration) to verify vehicle ownership.
4. In production, a human reviewer checks that the license photo is legible, matches the selfie, and the OR/CR matches the vehicle info. For the demo, auto-approve after 3 seconds.
5. Once approved, driver profile shows both a "Verified" badge and a "Licensed Driver" badge.

### 3.3 Data Privacy Compliance (RA 10173)

| Data Collected | Purpose | How It's Protected |
|---|---|---|
| Full Name | Display to matched riders/drivers | Visible only to matched ride participants, not public |
| Phone Number | OTP verification, emergency contact | Never displayed to other users, hashed in storage |
| ID Photo | Identity verification only | Reviewed then deleted after verification (not stored permanently) |
| Driver's License | Legal compliance, driver identity | Encrypted at rest, reviewed then deleted after approval |
| Selfie | Face match against ID | Auto-deleted after verification comparison |
| Vehicle Info (plate, model) | Ride identification, regulatory | Plate shown to matched riders only during active rides |
| OR/CR | Vehicle ownership verification | Reviewed then deleted after approval |
| Location (during ride) | Real-time tracking, ETA | Only shared during active ride, purged after ride ends |
| Gas Price Submissions | Crowdsourced pricing | Anonymized, only aggregated values shown publicly |

#### 3.3.1 Key Privacy Principles Applied

- **Proportionality:** Only collect what is necessary. We do not need the user's full address, birthday, or other demographic info.
- **Transparency:** Users are told exactly what data is collected and why before they submit it. The consent checkbox is explicit and unbundled.
- **Purpose Limitation:** ID photos are used solely for verification, then deleted. Never shared with other users, used for marketing, or sold.
- **Storage Limitation:** Verification photos are deleted after review. Only the verification status (approved/rejected) and masked identifiers are retained.
- **Data Subject Rights:** Users can request deletion of their account and all associated data at any time through the app settings.

#### 3.3.2 What Other Users See

When a rider views a driver's profile (or vice versa), they see: first name only (not full name), verified badge, driver badge (if applicable), vehicle info (make, model, color, but plate number is masked showing only the last 3 characters), overall rating, and number of completed rides. They never see: phone number, email, ID photos, license number, OR/CR, or selfie.

#### 3.3.3 Demo Implementation

For the prototype, verification is simulated. The upload UI is real (expo-image-picker opens the camera/gallery), but instead of sending photos to a server for review, the app stores them locally and auto-approves after a short delay. This demonstrates the complete UX flow during the pitch while keeping the demo self-contained.

---

## 4. Screen List (17 Screens)

The app has four screen groups: Auth/Verification (4 screens), Rider flow (4 screens), Driver flow (4 screens), and Shared/Utility (5 screens).

| # | Screen | What It Shows | Purpose |
|---|---|---|---|
| 1 | Splash / Onboarding | App logo, tagline, Get Started button | First impression for pitch |
| 2 | Sign Up | Name, phone/email, UP email optional, password, role selection (rider/driver/both) | Account creation |
| 3 | Rider Verification | Upload valid ID (school ID, gov ID), selfie for face match, agree to terms | Trust and safety |
| 4 | Driver Verification | Everything from rider + upload driver's license photo, vehicle info (make, model, plate, color, seat count), OR/CR upload | Regulatory compliance |
| 5 | Verification Pending | Status screen showing verification progress, what's approved vs pending | Transparency |
| 6 | Rider: Home / Search | Search bar (text input for destination), filter tabs (Carpool, Taxi Pool, Requests), list of available rides | Core rider experience |
| 7 | Rider: Ride Details | Driver info (name, rating, verified badge), route summary, price breakdown, seats left, Join Ride button | Shows pricing in action |
| 8 | Rider: Active Ride | Live map with driver pin, passenger count badge, ETA, Share Location button, Cancel button | Real-time tracking + shareable link (Feedback #1, #5) |
| 9 | Rider: Ride Complete | Fare summary, rate driver, trip stats (distance, CO2 saved) | Environmental impact for STS |
| 10 | Driver: Home | Toggle online/offline, create new ride button, active rides list | Driver dashboard |
| 11 | Driver: Create Ride | From/To text inputs, departure time (Now/Scheduled), available seats, auto-calculated price preview, notes field, Post Ride button | Ride creation |
| 12 | Driver: Active Ride | Passenger list with confirm pickup buttons, live passenger count (e.g. 2/4), navigation view, End Ride button | Passenger tracking demo (Feedback #5) |
| 13 | Driver: Ride Complete | Earnings summary, fare breakdown per passenger, rate riders | Revenue model |
| 14 | Pricing Calculator | Interactive: sliders for distance/passengers/fuel price, live fare computation, visual breakdown | Standalone demo screen (Feedback #4) |
| 15 | Tracking Link View | Simulated shared view: map with moving pin, ride info, no app install needed | Safety feature demo (Feedback #1) |
| 16 | Gas Price Hub | Current crowdsourced gas price (avg, min, max), submit new price button, recent submissions list with timestamps | Crowdsourced fuel pricing |
| 17 | Profile / Settings | User info, ride history, verification status, gas price contributions, safety settings | Account management |

### 4.1 Rider Flow

Rider opens app, searches for destination via text input, browses matching rides, views price breakdown and driver info (with verified badge), joins a ride. During the ride, they see the driver's live location on a map, can share a tracking link via Messenger/SMS, and watch the passenger count update as the driver picks up others. After the ride, they see fare paid, distance traveled, and estimated CO2 saved.

### 4.2 Driver Flow

Driver opens app, taps Create Ride, types origin and destination (free text), selects departure time (Now or Scheduled), sets available seats, and optionally adds notes (e.g., "Going home after class, pag-uwi na!"). The app auto-calculates the suggested price per person using the pricing formula with the current crowdsourced gas price. Driver posts the ride and it appears in riders' search results. During the ride, the driver sees a passenger list and taps Confirm Pickup for each rider who gets in the car. After completing the ride, they see their total earnings.

### 4.3 Demo Script for Shark Tank Pitch

1. Show splash screen with app branding on your iPhone
2. Walk through the signup and driver verification flow (show the ID upload, license upload, vehicle info entry)
3. As a driver, create a ride: "UP Baguio" to "SM Baguio", 3 seats, show the auto-calculated price
4. Switch to rider view, search for "SM Baguio", show the ride appearing with the verified driver badge
5. Join the ride, show the live tracking screen with driver pin moving on the map
6. Tap Share Location, show the shareable tracking link
7. Switch back to driver, tap Confirm Pickup, show passenger count updating (1/3 then 2/3)
8. Open the Pricing Calculator, adjust sliders to show fare changes with distance and passengers
9. Show the Gas Price Hub with crowdsourced prices and submit a new price
10. End the ride, show the summary with earnings and CO2 saved

---

## 5. Pricing Model

Addresses Prof's Feedback #4 (pricing calculations). The model is transparent, formula-driven, and uses real community data for fuel prices.

### 5.1 Variables

| Variable | Description |
|---|---|
| D (km) | Trip distance from Google Maps Directions API (based on text input origin/destination) |
| F (PHP/L) | Crowdsourced fuel price: rolling median of last 20 submissions from users in the area |
| E (km/L) | Vehicle fuel efficiency (driver sets this in vehicle profile, default ~10 km/L for city) |
| N | Number of passengers (1 to max seats as set by driver) |
| M (PHP) | Platform margin: flat PHP 10 or 5% of fare, whichever is higher |
| T | Terrain/traffic multiplier: 1.0 normal, 1.2 for steep routes (auto-detected if elevation gain > threshold, or manually toggled) |

### 5.2 Formula

**Base Fuel Cost = (D / E) x F x T**

**Fare Per Person = (Base Fuel Cost / N) + M**

In plain terms: calculate how many liters the trip burns (distance / efficiency), multiply by the crowdsourced fuel price and terrain factor, split evenly among passengers, then add the platform fee.

### 5.3 Worked Example

A driver goes from La Trinidad to UP Baguio. Distance from Google Maps API: 8 km. Crowdsourced gas price (median of 20 submissions): PHP 65.50/L. Car efficiency: 10 km/L. 3 passengers. Normal terrain (1.0x). Platform fee: PHP 10.

- Step 1: Fuel cost = (8 / 10) x 65.50 x 1.0 = PHP 52.40
- Step 2: Per person = 52.40 / 3 = PHP 17.47
- **Step 3: With platform fee = 17.47 + 10 = PHP 27.47 per rider**

Comparison: A taxi for this route costs ~PHP 150-200. A jeepney is ~PHP 13 but takes 30-45 min with no guaranteed seat. The carpool price of ~PHP 27 is positioned between the two, offering taxi-level convenience at near-jeepney pricing.

### 5.4 Why the Platform Fee

The PHP 10 (or 5%, whichever is higher) platform fee is what makes the app sustainable. SakayTayo operates as a free community service with no revenue model, which limits its ability to invest in features, support, and growth. The platform fee is small enough to keep fares competitive but creates a revenue stream for server costs, development, and eventual expansion.

---

## 6. Crowdsourced Gas Pricing

There is no public API for real-time fuel prices in the Philippines. DOE publishes weekly price ranges but these are national averages, not local. The solution: let users report prices they see at gas stations, and aggregate them.

| Mechanism | How It Works |
|---|---|
| Submission | Any user (rider or driver) can tap "Update Gas Price" and enter the price they saw at a station. They select fuel type (Unleaded, Diesel, Premium) and optionally the station name. |
| Validation | Submissions outside 2 standard deviations from the rolling median are flagged as outliers and excluded. Prevents trolling or typos (e.g., someone entering PHP 6.50 instead of PHP 65.00). |
| Aggregation | The app uses the rolling median (not mean) of the last 20 valid submissions within the past 7 days. Median is more resistant to outliers than average. |
| Display | Gas Price Hub screen shows: current median price, price range (min/max), number of reports this week, trend arrow (up/down vs last week), last updated timestamp. |
| Incentive | Users who submit gas prices get a small badge on their profile ("Community Contributor"). Gamification encourages participation without needing monetary incentives. |
| Fallback | If fewer than 5 submissions exist in the last 7 days, the app uses a hardcoded default (PHP 65/L for unleaded) and shows a banner asking users to submit prices. |
| Demo Note | For the prototype, seed 15-20 mock gas price submissions so the Gas Price Hub looks populated. The aggregation logic runs locally. |

### 6.1 Why Median Instead of Mean

Example with 5 submissions: PHP 64, 65, 65, 66, 120 (the 120 is a troll or typo).

- Mean = PHP 76.00 (pulled up by the outlier, inaccurate)
- **Median = PHP 65.00 (ignores the extreme value, accurate)**

The outlier detection (beyond 2 standard deviations) catches most bad data, and the median handles whatever slips through.

---

## 7. Real-Time Passenger Tracking

Addresses Feedback #5. Uses a driver-confirmed check-in model.

### 7.1 Flow

1. Rider joins a ride in the app. Status = "waiting". Count stays the same.
2. Driver arrives at pickup. Rider gets in the car physically.
3. Driver taps "Confirm Pickup" next to the rider's name on the Active Ride screen.
4. Passenger count increments: 0/3 becomes 1/3. Available seats update from 3 to 2.
5. Other riders browsing now see "2 seats left" instead of 3.
6. When seats reach 0, ride is removed from search results (full).

### 7.2 Why Not Automatic GPS Detection

- GPS proximity detection is unreliable in Baguio's mountainous terrain and dense areas
- A rider near the car might not actually be in it (across the street, inside a building)
- Manual confirmation creates accountability: the driver verifies who is in their vehicle
- Same model used by BlaBlaCar and Waze Carpool (proven at scale)

---

## 8. Safety: Shareable Tracking Link

Addresses Feedback #1. When a rider joins a ride, they get a "Share My Ride" button.

### 8.1 How It Works

1. Rider taps "Share My Ride" on the Active Ride screen
2. App generates a unique token-based link (e.g., appname.ph/track/abc123)
3. Rider sends the link via Messenger, SMS, or any app using the native share sheet
4. Recipient opens the link in any browser and sees a map with the car's live position, route, and ETA
5. No app installation required for the recipient
6. Link expires automatically when the ride ends

### 8.2 Privacy Safeguards

- Link expires when ride ends; cannot be reused or bookmarked for future tracking
- Only the car's location is shown, not the rider's personal info
- Rider controls who receives the link (not public, not discoverable)
- No location history stored after ride completion
- Share token is cryptographically random, not guessable

---

## 9. Data Model

All entities stored locally via AsyncStorage as JSON for the demo. In production, these become database tables.

| Entity | Fields |
|---|---|
| User | id, name, email, phone, role (rider\|driver\|both), rating, profilePic, verificationStatus (pending\|verified\|rejected), verifiedAt, isCommunityContributor |
| RiderVerification | userId, idType (school\|government), idPhotoUri, selfieUri, status (pending\|approved\|rejected), reviewedAt, rejectionReason? |
| DriverVerification | userId, licensePhotoFrontUri, licensePhotoBackUri, licenseNumber (masked), licenseExpiry, orCrPhotoUri, status, reviewedAt, rejectionReason? |
| Vehicle | id, driverId, make, model, year, color, plateNumber (masked in display), seatCount, fuelType (unleaded\|diesel\|premium), fuelEfficiency (km/L) |
| Ride | id, driverId, driverName, driverRating, driverVerified, from (text), to (text), distanceKm (from Google Maps API), durationMin, departureTime, departureType (now\|scheduled), totalSeats, availableSeats, pricePerPerson, status (open\|active\|completed\|cancelled), passengers[], notes, createdAt |
| Passenger | id, name, verified, pickupPoint, status (waiting\|picked_up\|dropped_off), joinedAt |
| PriceCalc | distance, fuelPrice (crowdsourced), fuelEfficiency, passengerCount, terrainMultiplier, platformFee, farePerPerson |
| GasPriceSubmission | id, visibleId, userId (anonymized), fuelType, pricePerLiter, stationName?, submittedAt, isOutlier (boolean) |
| GasPriceAggregate | fuelType, medianPrice, minPrice, maxPrice, reportCount, lastUpdated, trend (up\|down\|stable) |
| TrackingSession | rideId, shareToken, sharedWith?, currentLocation, lastUpdated, isActive, expiresAt |

---

## 10. Project File Structure

Expo Router uses file-based routing. The folder structure maps directly to the navigation hierarchy.

```
app/                          # Expo Router screens (file-based routing)
  _layout.tsx                 # Root layout with tab navigation
  index.tsx                   # Splash / onboarding screen
  (auth)/                     # Authentication flow screens
    signup.tsx                # Account creation form
    verify-rider.tsx          # Rider ID + selfie upload
    verify-driver.tsx         # Driver license + vehicle info + OR/CR upload
    verify-pending.tsx        # Verification status screen
  (rider)/                    # Rider flow screens
    home.tsx                  # Search + ride listings
    ride-details.tsx          # View ride info + join
    active-ride.tsx           # Live ride tracking
    ride-complete.tsx         # Trip summary + rating
  (driver)/                   # Driver flow screens
    home.tsx                  # Driver dashboard, go online
    create-ride.tsx           # Text-based route + pricing + post
    active-ride.tsx           # Manage passengers + navigate
    ride-complete.tsx         # Earnings summary
  pricing.tsx                 # Standalone pricing calculator
  tracking.tsx                # Shareable tracking link view
  gas-prices.tsx              # Gas Price Hub (crowdsourced)
  profile.tsx                 # User profile + settings + ride history
components/                   # Reusable UI components
  MapView.tsx                 # Configured map with Baguio center
  RideCard.tsx                # Ride listing card
  PriceBreakdown.tsx          # Fare calculation display
  PassengerBadge.tsx          # Live passenger count indicator
  VerifiedBadge.tsx           # Checkmark badge for verified users
  GasPriceCard.tsx            # Current gas price display widget
  IDUploader.tsx              # Camera/gallery picker for ID photos
context/                      # React Context providers
  AuthContext.tsx             # User auth, verification state
  AppContext.tsx              # Global state: rides, gas prices
  RideContext.tsx             # Active ride state management
utils/                        # Helper functions
  pricing.ts                  # Fare calculation algorithm
  gasPrice.ts                 # Aggregation logic (median, outlier detection)
  mockData.ts                 # Seed data: users, rides, gas submissions
  storage.ts                  # AsyncStorage wrapper functions
  verification.ts             # Verification status helpers
constants/                    # App-wide constants
  theme.ts                    # Colors, typography, spacing tokens
  config.ts                   # API keys, defaults (fallback gas price, etc.)
```

---

## 11. Build Plan: Two Sessions

Two focused 5-hour sessions with Claude Code. Each block produces a demoable checkpoint.

### Session 1: Setup + Core Flows (~5 hours)

| Time | Task | Details |
|---|---|---|
| 0:00-0:30 | Project Init | npx create-expo-app, install deps (react-native-maps, expo-location, expo-image-picker, async-storage, react-native-paper), configure Expo Router, test on iPhone via Expo Go |
| 0:30-1:00 | Theme + Layout | Set up theme constants, root layout with tab navigation (Home, Search, +Create, Gas Prices, Profile), role selection logic |
| 1:00-1:45 | Auth + Verification UI | Sign up screen, rider verification screen (ID photo + selfie upload via expo-image-picker), driver verification screen (license + vehicle info + OR/CR), pending status screen. For the demo: auto-approve after 2 seconds to simulate review. |
| 1:45-2:30 | Mock Data + Context | Seed data: 6 fake verified users, 8 sample rides with text-based routes, 18 gas price submissions. Set up AuthContext + AppContext with useReducer + AsyncStorage persistence. |
| 2:30-3:30 | Rider Home + Search | Text search input for destination, filter results by matching destination text, ride cards showing driver name, verified badge, route, price, seats. Tap card opens Ride Details. |
| 3:30-4:15 | Ride Details + Join | Route summary (From/To text, distance from mock, duration), driver info card with verified badge and rating, price breakdown component showing the formula, Join Ride button |
| 4:15-5:00 | Driver: Create Ride | From/To text inputs, departure type toggle (Now/Scheduled), seats selector, notes field, auto-price preview using pricing formula with crowdsourced gas price, Post Ride button |

### Session 2: Live Features + Polish (~5 hours)

| Time | Task | Details |
|---|---|---|
| 0:00-1:00 | Active Ride (Rider) | Map view with simulated driver pin moving along a path, passenger count badge updating, ETA countdown, Share Location button (opens share sheet with tracking link) |
| 1:00-2:00 | Active Ride (Driver) | Passenger list with names + verified badges, Confirm Pickup button per passenger (tap = status changes to picked_up, count increments), End Ride button |
| 2:00-2:45 | Gas Price Hub | Current price display (median, range, trend arrow), Submit Price form (fuel type dropdown, price input, optional station name), recent submissions list, outlier detection running on submit |
| 2:45-3:30 | Pricing Calculator | Standalone screen with sliders: distance (1-30 km), passengers (1-6), fuel price (auto-filled from crowdsourced but adjustable). Live fare computation updating as sliders move. Show formula breakdown below. |
| 3:30-4:15 | Tracking Link + Complete | Tracking link screen (map with pin + ride info, simulating what a non-app-user would see), ride complete screens for rider (fare, CO2 saved, rate driver) and driver (earnings, rate riders) |
| 4:15-5:00 | Polish + Demo Prep | Splash screen with logo, consistent styling pass, profile screen with verification status + ride history + gas contributions badge, test full demo flow on iPhone, take screenshots, fix bugs |

### 11.1 After Session 1 (Minimum Viable Demo)

Working app on iPhone via Expo Go. Signup + verification flow (simulated). Rider can browse and join rides. Driver can create rides with auto-pricing. Mock data makes the app feel populated. This alone is a presentable prototype.

### 11.2 After Session 2 (Full Demo)

Live tracking simulation with driver pin moving on map. Driver confirms pickups with live count updating. Gas Price Hub with crowdsourced data. Interactive pricing calculator. Tracking link screen. Ride completion with stats. Polished UI. Full demo-ready for Shark Tank.

---

## 12. Deployment Cost Estimate

| Item | Provider | Cost/Month | Annual |
|---|---|---|---|
| Google Maps API (Directions + Geocoding) | Google Cloud | ~PHP 0 (free tier) | PHP 0 |
| Backend Hosting (production) | Railway / Render | PHP 0 (free tier) | PHP 0 |
| Push Notifications | Expo Push (free) | PHP 0 | PHP 0 |
| Apple Developer Account | Apple | PHP 5,600/yr | PHP 5,600 |
| Domain (tracking links) | Namecheap | ~PHP 50/mo | PHP 600 |
| SMS OTP Verification | Semaphore | ~PHP 0.35/SMS | ~PHP 2,100 (6K SMS) |
| Cloud Storage (temp ID photos) | Cloudflare R2 (free tier) | PHP 0 | PHP 0 |
| **TOTAL (MVP)** | | | **~PHP 8,300/year** |

For the demo: PHP 0. Expo Go is free, all tools are free, no server needed. The table above represents real launch costs for an MVP.
