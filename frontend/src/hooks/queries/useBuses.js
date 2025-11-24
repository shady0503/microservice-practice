import { useQuery } from '@tanstack/react-query';
import { busService } from '@/services/api/bus.service';

export function useBusesByLine(lineRef) {
  return useQuery({
    queryKey: ['buses', 'line', lineRef],
    queryFn: () => busService.getBusesByLine(lineRef),
    enabled: !!lineRef,
    select: (data) => {
      // Filter only active buses
      return data.filter((bus) => bus.status === 'ACTIVE');
    },
  });
}

export function useBusById(busId) {
  return useQuery({
    queryKey: ['bus', busId],
    queryFn: () => busService.getBusById(busId),
    enabled: !!busId,
  });
}

export function useActiveBuses() {
  return useQuery({
    queryKey: ['buses', 'active'],
    queryFn: () => busService.getActiveBuses(),
  });
}
