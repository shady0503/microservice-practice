import { useQuery, useMutation } from '@tanstack/react-query';
import { routeService } from '@/services/api/route.service';

export function useSearchRoutes() {
  return useMutation({
    mutationFn: (searchParams) => routeService.searchRoutes(searchParams),
    onError: (error) => {
      console.error('Search routes error:', error);
    },
  });
}

export function useRouteById(routeId) {
  return useQuery({
    queryKey: ['route', routeId],
    queryFn: () => routeService.getRouteById(routeId),
    enabled: !!routeId,
  });
}
