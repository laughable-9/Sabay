import { calculateFare } from './pricing';
import type { GasPriceSubmission, Ride, RideRequest, User } from './types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

function avatarUri(name: string, bg: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=256`;
}

const NOW = Date.now();

export const MOCK_USERS: User[] = [
  {
    id: 'u_self',
    firstName: 'Kyle',
    rating: 5.0,
    verified: true,
    isDriver: true,
    completedRides: 0,
    profilePicUri: avatarUri('Kyle', '34773D'),
    joinedAt: NOW - 2 * MONTH,
    vehicle: {
      make: 'Toyota',
      model: 'Vios',
      year: 2019,
      color: 'White',
      plateNumber: 'ABC 1234',
      seatCount: 4,
      fuelType: 'unleaded',
      fuelEfficiency: 12,
    },
  },
  {
    id: 'u_maria',
    firstName: 'Maria',
    rating: 4.9,
    verified: true,
    isDriver: true,
    completedRides: 47,
    profilePicUri: avatarUri('Maria', 'D97706'),
    joinedAt: NOW - 14 * MONTH,
    vehicle: {
      make: 'Honda',
      model: 'City',
      year: 2020,
      color: 'Silver',
      plateNumber: 'XYZ 5678',
      seatCount: 4,
      fuelType: 'unleaded',
      fuelEfficiency: 13,
    },
  },
  {
    id: 'u_josh',
    firstName: 'Josh',
    rating: 4.8,
    verified: true,
    isDriver: true,
    completedRides: 22,
    profilePicUri: avatarUri('Josh', '2563EB'),
    joinedAt: NOW - 6 * MONTH,
    vehicle: {
      make: 'Mitsubishi',
      model: 'Mirage',
      year: 2021,
      color: 'Red',
      plateNumber: 'JKL 2468',
      seatCount: 4,
      fuelType: 'unleaded',
      fuelEfficiency: 14,
    },
  },
  {
    id: 'u_ana',
    firstName: 'Ana',
    rating: 5.0,
    verified: true,
    isDriver: true,
    completedRides: 63,
    profilePicUri: avatarUri('Ana', 'DB2777'),
    joinedAt: NOW - 18 * MONTH,
    vehicle: {
      make: 'Hyundai',
      model: 'Accent',
      year: 2018,
      color: 'Blue',
      plateNumber: 'QRS 1357',
      seatCount: 4,
      fuelType: 'diesel',
      fuelEfficiency: 16,
    },
  },
  {
    id: 'u_rico',
    firstName: 'Rico',
    rating: 4.7,
    verified: true,
    isDriver: false,
    completedRides: 15,
    profilePicUri: avatarUri('Rico', '7C3AED'),
    joinedAt: NOW - 4 * MONTH,
  },
  {
    id: 'u_bea',
    firstName: 'Bea',
    rating: 4.9,
    verified: true,
    isDriver: false,
    completedRides: 31,
    profilePicUri: avatarUri('Bea', '059669'),
    joinedAt: NOW - 10 * MONTH,
  },
];

const FUEL_PRICE_SEED = 100.5;

function mkRide(
  id: string,
  driver: User,
  from: string,
  to: string,
  distanceKm: number,
  durationMin: number,
  departureOffsetMs: number,
  totalSeats: number,
  notes?: string,
): Ride {
  if (!driver.vehicle) {
    throw new Error(`User ${driver.id} has no vehicle`);
  }
  const breakdown = calculateFare({
    distanceKm,
    fuelPricePerLiter: FUEL_PRICE_SEED,
    fuelEfficiency: driver.vehicle.fuelEfficiency,
    passengerCount: totalSeats,
  });
  const now = Date.now();
  return {
    id,
    driverId: driver.id,
    driverFirstName: driver.firstName,
    driverRating: driver.rating,
    driverVerified: driver.verified,
    driverProfilePicUri: driver.profilePicUri,
    driverCompletedRides: driver.completedRides,
    driverJoinedAt: driver.joinedAt,
    vehicle: {
      make: driver.vehicle.make,
      model: driver.vehicle.model,
      color: driver.vehicle.color,
      plateNumber: driver.vehicle.plateNumber,
    },
    from,
    to,
    distanceKm,
    durationMin,
    departureTime: now + departureOffsetMs,
    totalSeats,
    pricePerPerson: breakdown.farePerPerson,
    fuelEfficiency: driver.vehicle.fuelEfficiency,
    terrainMultiplier: 1.0,
    status: 'open',
    passengers: [],
    notes,
    createdAt: now - 30 * 60 * 1000,
  };
}

const maria = MOCK_USERS[1];
const josh = MOCK_USERS[2];
const ana = MOCK_USERS[3];

export const MOCK_RIDES: Ride[] = [
  mkRide('r1', maria, 'La Trinidad', 'UP Baguio', 8, 25, 45 * 60 * 1000, 3, 'Pag-uwi na, may space pa.'),
  mkRide('r2', josh, 'SLU Maryheights', 'SM Baguio', 6, 20, 1.5 * HOUR, 2),
  mkRide('r3', ana, 'Itogon', 'Baguio CBD', 14, 40, 2 * HOUR, 4, 'AC on, no smoking.'),
  mkRide('r4', maria, 'UP Baguio', 'Session Road', 3, 10, 3 * HOUR, 3),
  mkRide('r5', josh, 'Camp John Hay', 'SM Baguio', 5, 18, 4 * HOUR, 3),
  mkRide('r6', ana, 'Tuba', 'UP Baguio', 12, 35, 5 * HOUR, 4),
  mkRide('r7', maria, 'La Trinidad', 'Session Road', 9, 28, 6 * HOUR, 3),
  mkRide('r8', josh, 'SM Baguio', 'SLU Maryheights', 6, 22, 7 * HOUR, 2, 'Going home after class.'),
];

const rico = MOCK_USERS[4];
const bea = MOCK_USERS[5];

function mkRequest(
  id: string,
  rider: User,
  from: string,
  to: string,
  distanceKm: number,
  durationMin: number,
  departureOffsetMs: number,
  maxFare: number | undefined,
  notes?: string,
): RideRequest {
  const now = Date.now();
  return {
    id,
    riderId: rider.id,
    riderFirstName: rider.firstName,
    riderVerified: rider.verified,
    riderProfilePicUri: rider.profilePicUri,
    from,
    to,
    distanceKm,
    durationMin,
    desiredDepartureTime: now + departureOffsetMs,
    maxFare,
    notes,
    status: 'open',
    createdAt: now - 10 * 60 * 1000,
  };
}

export const MOCK_RIDE_REQUESTS: RideRequest[] = [
  mkRequest('req1', rico, 'Ambuklao', 'UP Baguio', 18, 50, 30 * 60 * 1000, 80, 'Morning class, please be on time.'),
  mkRequest('req2', bea, 'La Trinidad', 'SM Baguio', 9, 28, 2 * HOUR, 45),
  mkRequest('req3', rico, 'Session Road', 'Camp John Hay', 4, 14, 3 * HOUR, undefined, 'Flexible on timing.'),
  mkRequest('req4', bea, 'UP Baguio', 'La Trinidad', 8, 25, 5 * HOUR, 40, 'Anyone heading home after 5pm?'),
];

function mkSubmission(
  id: string,
  offsetFromNowMs: number,
  fuelType: 'unleaded' | 'diesel' | 'premium',
  price: number,
  submittedByUserId: string,
  station?: string,
): GasPriceSubmission {
  return {
    id,
    fuelType,
    pricePerLiter: price,
    stationName: station,
    submittedAt: Date.now() - offsetFromNowMs,
    submittedByUserId,
    isOutlier: false,
  };
}

// Seed values span the published DOE weekly ranges for the week of
// April 14-20, 2026 (source: fuelprice.ph):
//   Unleaded 91: ₱94.57 – ₱106.90/L (range across 13 brands)
//   Premium 95:  ₱94.07 – ₱107.40/L (range across 12 brands)
//   Diesel:      ₱128.01 – ₱132.20/L (range across 13 brands)
export const MOCK_GAS_PRICES: GasPriceSubmission[] = [
  mkSubmission('g1', 2 * HOUR, 'unleaded', 101.2, 'u_maria', 'Shell Session Road'),
  mkSubmission('g2', 5 * HOUR, 'unleaded', 106.4, 'u_josh', 'Petron Marcos Highway'),
  mkSubmission('g3', 10 * HOUR, 'unleaded', 97.8, 'u_ana', 'Phoenix Kennon Road'),
  mkSubmission('g4', 14 * HOUR, 'unleaded', 103.1, 'u_rico', 'Caltex Magsaysay'),
  mkSubmission('g5', 20 * HOUR, 'unleaded', 95.2, 'u_bea', 'Seaoil La Trinidad'),
  mkSubmission('g6', 1 * DAY, 'unleaded', 100.6, 'u_maria', 'Shell La Trinidad'),
  mkSubmission('g7', 1.5 * DAY, 'unleaded', 105.9, 'u_josh', 'Cleanfuel Loakan'),
  mkSubmission('g8', 2.5 * DAY, 'unleaded', 98.4, 'u_ana', 'Petron Marcos Highway'),

  mkSubmission('g9', 3 * HOUR, 'premium', 107.1, 'u_maria', 'Shell Session Road'),
  mkSubmission('g10', 8 * HOUR, 'premium', 103.9, 'u_bea', 'Caltex Magsaysay'),
  mkSubmission('g11', 16 * HOUR, 'premium', 95.3, 'u_josh', 'Phoenix Kennon Road'),
  mkSubmission('g12', 1.2 * DAY, 'premium', 105.6, 'u_ana', 'Shell La Trinidad'),
  mkSubmission('g13', 2 * DAY, 'premium', 99.8, 'u_rico', 'Petron Marcos Highway'),

  mkSubmission('g14', 4 * HOUR, 'diesel', 131.8, 'u_ana', 'Petron Marcos Highway'),
  mkSubmission('g15', 12 * HOUR, 'diesel', 128.4, 'u_maria', 'Phoenix Kennon Road'),
  mkSubmission('g16', 18 * HOUR, 'diesel', 130.9, 'u_josh', 'Caltex Magsaysay'),
  mkSubmission('g17', 1.5 * DAY, 'diesel', 129.2, 'u_rico', 'Shell Session Road'),
  mkSubmission('g18', 3 * DAY, 'diesel', 132.0, 'u_bea', 'Shell La Trinidad'),
];
