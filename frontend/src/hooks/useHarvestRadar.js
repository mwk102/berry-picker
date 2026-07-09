import { useQuery } from '@tanstack/react-query'
import { getDailyHarvest, getHarvestEvents, getHarvestRadar } from '../lib/api'

export function useHarvestRadar(params = {}) {
  return useQuery({
    queryKey: ['harvest-radar', params],
    queryFn: () => getHarvestRadar(params),
    keepPreviousData: true,
  })
}

export function useDailyHarvest() {
  return useQuery({
    queryKey: ['daily-harvest'],
    queryFn: getDailyHarvest,
  })
}

export function useHarvestEvents(params = {}) {
  return useQuery({
    queryKey: ['harvest-events', params],
    queryFn: () => getHarvestEvents(params),
    keepPreviousData: true,
  })
}
