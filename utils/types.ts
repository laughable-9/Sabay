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
  profilePicUri?: string;
  joinedAt?: number;
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
  profilePicUri?: string;
};

export type RideStatus = 'open' | 'active' | 'completed' | 'cancelled';

export type DriverStatus = 'preparing' | 'enroute' | 'arrived';

export type ChatMessage = {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderProfilePicUri?: string;
  text: string;
  sentAt: number;
};

export type Ride = {
  id: string;
  driverId: string;
  driverFirstName: string;
  driverRating: number;
  driverVerified: boolean;
  driverProfilePicUri?: string;
  driverCompletedRides?: number;
  driverJoinedAt?: number;
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
  driverStatus: DriverStatus;
  passengers: Passenger[];
  messages: ChatMessage[];
  notes?: string;
  createdAt: number;
};

export type RideRequestStatus = 'open' | 'matched' | 'cancelled';

export type RideRequest = {
  id: string;
  riderId: string;
  riderFirstName: string;
  riderVerified: boolean;
  riderProfilePicUri?: string;
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  desiredDepartureTime: number;
  notes?: string;
  status: RideRequestStatus;
  matchedRideId?: string;
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
