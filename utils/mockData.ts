import { calculateFare } from './pricing';
import type { GasPriceSubmission, Passenger, Ride, RideRequest, User } from './types';

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
    phone: '0975 099 6672',
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
    phone: '0917 555 1423',
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
    phone: '0906 221 8840',
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
    phone: '0923 884 6621',
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
    phone: '0945 117 5522',
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
    phone: '0917 330 2284',
    rating: 4.9,
    verified: true,
    isDriver: false,
    completedRides: 31,
    profilePicUri: avatarUri('Bea', '059669'),
    joinedAt: NOW - 10 * MONTH,
  },
  {
    id: 'u_dex',
    firstName: 'Dex',
    phone: '0912 443 7756',
    rating: 4.6,
    verified: true,
    isDriver: true,
    completedRides: 34,
    profilePicUri: avatarUri('Dex', '0E7490'),
    joinedAt: NOW - 8 * MONTH,
    vehicle: {
      make: 'Suzuki',
      model: 'Ertiga',
      year: 2022,
      color: 'Gray',
      plateNumber: 'MNO 3690',
      seatCount: 5,
      fuelType: 'unleaded',
      fuelEfficiency: 15,
    },
  },
  {
    id: 'u_cess',
    firstName: 'Cess',
    phone: '0918 224 1199',
    rating: 4.9,
    verified: true,
    isDriver: true,
    completedRides: 51,
    profilePicUri: avatarUri('Cess', 'C026D3'),
    joinedAt: NOW - 12 * MONTH,
    vehicle: {
      make: 'Toyota',
      model: 'Wigo',
      year: 2023,
      color: 'Orange',
      plateNumber: 'TUV 8024',
      seatCount: 4,
      fuelType: 'unleaded',
      fuelEfficiency: 18,
    },
  },
  {
    id: 'u_jm',
    firstName: 'JM',
    phone: '0935 778 3301',
    rating: 4.5,
    verified: true,
    isDriver: false,
    completedRides: 8,
    profilePicUri: avatarUri('JM', '1D4ED8'),
    joinedAt: NOW - 3 * MONTH,
  },
  {
    id: 'u_tin',
    firstName: 'Tin',
    phone: '0927 661 4420',
    rating: 4.8,
    verified: true,
    isDriver: false,
    completedRides: 19,
    profilePicUri: avatarUri('Tin', 'E11D48'),
    joinedAt: NOW - 7 * MONTH,
  },
];

const FUEL_PRICE_SEED = 100.5;

function mkPassenger(user: User, minutesAgo: number): Passenger {
  return {
    id: `p_mock_${user.id}`,
    userId: user.id,
    firstName: user.firstName,
    verified: user.verified,
    status: 'waiting',
    joinedAt: Date.now() - minutesAgo * 60 * 1000,
    profilePicUri: user.profilePicUri,
  };
}

function mkRide(
  id: string,
  driver: User,
  from: string,
  to: string,
  distanceKm: number,
  durationMin: number,
  departureOffsetMs: number,
  totalSeats: number,
  opts?: { notes?: string; passengers?: Passenger[] },
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
    driverPhone: driver.phone,
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
    driverStatus: 'preparing',
    passengers: opts?.passengers ?? [],
    messages: [],
    notes: opts?.notes,
    createdAt: now - 30 * 60 * 1000,
  };
}

const maria = MOCK_USERS[1];
const josh = MOCK_USERS[2];
const ana = MOCK_USERS[3];
const rico = MOCK_USERS[4];
const bea = MOCK_USERS[5];
const dex = MOCK_USERS[6];
const cess = MOCK_USERS[7];
const jm = MOCK_USERS[8];
const tin = MOCK_USERS[9];

const MIN = 60 * 1000;

export const MOCK_RIDES: Ride[] = [
  // ── Leaving soon (within 30 min) — these show as car icons on idle map ──
  mkRide('r1', maria, 'La Trinidad', 'UP Baguio', 8, 25, 15 * MIN, 3, {
    notes: 'Pag-uwi na, may space pa.',
    passengers: [mkPassenger(bea, 12)],
  }),
  mkRide('r2', dex, 'Trancoville', 'SM Baguio', 3, 10, 10 * MIN, 4, {
    passengers: [mkPassenger(jm, 8)],
  }),
  mkRide('r3', cess, 'Session Road', 'La Trinidad', 9, 28, 20 * MIN, 3, {
    notes: 'Uwian na, tara!',
    passengers: [mkPassenger(tin, 5)],
  }),
  mkRide('r4', ana, 'UP Baguio', 'Session Road', 3, 10, 25 * MIN, 3),

  // ── Leaving within the hour ──
  mkRide('r5', josh, 'SLU Maryheights', 'Camp John Hay', 6, 20, 45 * MIN, 2, {
    notes: 'Quick trip to CJH.',
  }),
  mkRide('r6', dex, 'Pinsao Proper', 'Baguio CBD', 5, 15, 50 * MIN, 5, {
    passengers: [mkPassenger(bea, 20), mkPassenger(tin, 15)],
  }),
  mkRide('r7', maria, 'Camp John Hay', 'SM Baguio', 5, 18, 55 * MIN, 3),

  // ── Later rides ──
  mkRide('r8', ana, 'Itogon', 'Baguio CBD', 14, 40, 2 * HOUR, 4, {
    notes: 'AC on, no smoking.',
    passengers: [mkPassenger(jm, 30)],
  }),
  mkRide('r9', cess, 'Tuba', 'UP Baguio', 12, 35, 2.5 * HOUR, 4),
  mkRide('r10', josh, 'La Trinidad', 'Session Road', 9, 28, 3 * HOUR, 3, {
    passengers: [mkPassenger(tin, 45)],
  }),
  mkRide('r11', dex, 'SM Baguio', 'SLU Maryheights', 6, 22, 4 * HOUR, 5, {
    notes: 'Going home after class.',
  }),
  mkRide('r12', maria, 'Baguio CBD', 'La Trinidad', 9, 28, 5 * HOUR, 3),
];

function mkRequest(
  id: string,
  rider: User,
  from: string,
  to: string,
  distanceKm: number,
  durationMin: number,
  departureOffsetMs: number,
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
    notes,
    status: 'open',
    createdAt: now - 10 * 60 * 1000,
  };
}

export const MOCK_RIDE_REQUESTS: RideRequest[] = [
  mkRequest('req1', rico, 'Ambuklao', 'UP Baguio', 18, 50, 30 * 60 * 1000, 'Morning class, please be on time.'),
  mkRequest('req2', bea, 'La Trinidad', 'SM Baguio', 9, 28, 2 * HOUR),
  mkRequest('req3', rico, 'Session Road', 'Camp John Hay', 4, 14, 3 * HOUR, 'Flexible on timing.'),
  mkRequest('req4', bea, 'UP Baguio', 'La Trinidad', 8, 25, 5 * HOUR, 'Anyone heading home after 5pm?'),
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
