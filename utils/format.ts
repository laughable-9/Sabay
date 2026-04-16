export function formatDepartureTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatMonthYear(ms: number): string {
  return new Date(ms).toLocaleDateString([], { month: 'short', year: 'numeric' });
}

export function maskPlate(plate: string): string {
  const tail = plate.replace(/\s+/g, '').slice(-3);
  return `*** ${tail}`;
}
