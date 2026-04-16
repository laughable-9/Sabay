import { useApp } from '../../context/AppContext';
import { DriverHomeContent } from '../../components/DriverHomeContent';
import { RiderHomeContent } from '../../components/RiderHomeContent';

export default function TabsHome() {
  const { state } = useApp();
  return state.role === 'driver' ? <DriverHomeContent /> : <RiderHomeContent />;
}
