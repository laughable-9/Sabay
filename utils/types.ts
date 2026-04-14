export type Role = 'rider' | 'driver';

export type FuelType = 'unleaded' | 'diesel' | 'premium';

export type User = {
  id: string;
  firstName: string;
  rating: number;
  verified: boolean;
  isDriver: boolean;
  completedRides: number;
  vehicle?: Vehicle;
};

export type Vehicle = {
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  seatCount: number;
  fuelType: FuelType;
  fuelEfficiency: number;
};

export type PassengerStatus = 'waiting' | 'picked_up' | 'dropped_off';

export type Passenger = {
  id: string;
  userId: string;
  firstName: string;
  verified: boolean;
  status: PassengerStatus;
  joinedAt: number;
};

export type RideStatus = 'open' | 'active' | 'completed' | 'cancelled';

export type Ride = {
  id: string;
  driverId: string;
  driverFirstName: string;
  driverRating: number;
  driverVerified: boolean;
  vehicle: Pick<Vehicle, 'make' | 'model' | 'color' | 'plateNumber'>;
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  departureTime: number;
  totalSeats: number;
  pricePerPerson: number;
  fuelEfficiency: number;
  terrainMultiplier: number;
  status: RideStatus;
  passengers: Passenger[];
  notes?: string;
  createdAt: number;
};

export type GasPriceSubmission = {
  id: string;
  fuelType: FuelType;
  pricePerLiter: number;
  stationName?: string;
  submittedAt: number;
  submittedByUserId: string;
  isOutlier: boolean;
};
