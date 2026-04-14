import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  MOCK_GAS_PRICES,
  MOCK_RIDES,
  MOCK_RIDE_REQUESTS,
  MOCK_USERS,
} from '../utils/mockData';
import { markOutliers } from '../utils/gasPrice';
import { getJSON, setJSON } from '../utils/storage';
import type {
  GasPriceSubmission,
  Passenger,
  Ride,
  RideRequest,
  Role,
  User,
} from '../utils/types';

const STORAGE_KEY = 'sabay.appState.v4';

export type AppState = {
  users: User[];
  rides: Ride[];
  rideRequests: RideRequest[];
  gasPrices: GasPriceSubmission[];
  currentUserId: string;
  role: Role;
  activeRideId: string | null;
  hydrated: boolean;
};

const INITIAL_STATE: AppState = {
  users: MOCK_USERS,
  rides: MOCK_RIDES,
  rideRequests: MOCK_RIDE_REQUESTS,
  gasPrices: markOutliers(MOCK_GAS_PRICES),
  currentUserId: 'u_self',
  role: 'driver',
  activeRideId: null,
  hydrated: false,
};

type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'SET_PROFILE_PIC'; uri: string }
  | { type: 'ADD_RIDE'; ride: Ride }
  | { type: 'JOIN_RIDE'; rideId: string; passenger: Passenger }
  | { type: 'PICKUP_PASSENGER'; rideId: string; passengerId: string }
  | { type: 'END_RIDE'; rideId: string }
  | { type: 'SUBMIT_GAS_PRICE'; submission: GasPriceSubmission }
  | { type: 'POST_REQUEST'; request: RideRequest }
  | { type: 'CANCEL_REQUEST'; requestId: string }
  | { type: 'FULFILL_REQUEST'; requestId: string; rideId: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };

    case 'SET_ROLE':
      return { ...state, role: action.role };

    case 'SET_PROFILE_PIC': {
      const users = state.users.map((u) =>
        u.id === state.currentUserId ? { ...u, profilePicUri: action.uri } : u,
      );
      return { ...state, users };
    }

    case 'ADD_RIDE':
      return { ...state, rides: [action.ride, ...state.rides] };

    case 'JOIN_RIDE': {
      const rides = state.rides.map((r) =>
        r.id === action.rideId
          ? { ...r, passengers: [...r.passengers, action.passenger], status: 'active' as const }
          : r,
      );
      return { ...state, rides, activeRideId: action.rideId };
    }

    case 'PICKUP_PASSENGER': {
      const rides = state.rides.map((r) =>
        r.id === action.rideId
          ? {
              ...r,
              passengers: r.passengers.map((p) =>
                p.id === action.passengerId ? { ...p, status: 'picked_up' as const } : p,
              ),
            }
          : r,
      );
      return { ...state, rides };
    }

    case 'END_RIDE': {
      const rides = state.rides.map((r) =>
        r.id === action.rideId ? { ...r, status: 'completed' as const } : r,
      );
      const activeRideId = state.activeRideId === action.rideId ? null : state.activeRideId;
      return { ...state, rides, activeRideId };
    }

    case 'SUBMIT_GAS_PRICE': {
      const gasPrices = markOutliers([action.submission, ...state.gasPrices]);
      return { ...state, gasPrices };
    }

    case 'POST_REQUEST':
      return { ...state, rideRequests: [action.request, ...state.rideRequests] };

    case 'CANCEL_REQUEST': {
      const rideRequests = state.rideRequests.map((r) =>
        r.id === action.requestId ? { ...r, status: 'cancelled' as const } : r,
      );
      return { ...state, rideRequests };
    }

    case 'FULFILL_REQUEST': {
      const rideRequests = state.rideRequests.map((r) =>
        r.id === action.requestId
          ? { ...r, status: 'matched' as const, matchedRideId: action.rideId }
          : r,
      );
      return { ...state, rideRequests };
    }

    default:
      return state;
  }
}

type AppContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentUser: User;
  activeRide: Ride | null;
};

const AppContext = createContext<AppContextValue | null>(null);

type PersistedState = Pick<
  AppState,
  'users' | 'rides' | 'rideRequests' | 'gasPrices' | 'role' | 'activeRideId'
>;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getJSON<PersistedState>(STORAGE_KEY);
      if (cancelled) return;
      dispatch({ type: 'HYDRATE', payload: saved ?? {} });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const toPersist: PersistedState = {
      users: state.users,
      rides: state.rides,
      rideRequests: state.rideRequests,
      gasPrices: state.gasPrices,
      role: state.role,
      activeRideId: state.activeRideId,
    };
    setJSON(STORAGE_KEY, toPersist);
  }, [
    state.hydrated,
    state.users,
    state.rides,
    state.rideRequests,
    state.gasPrices,
    state.role,
    state.activeRideId,
  ]);

  const value = useMemo<AppContextValue>(() => {
    const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];
    const activeRide =
      state.activeRideId ? state.rides.find((r) => r.id === state.activeRideId) ?? null : null;
    return { state, dispatch, currentUser, activeRide };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
