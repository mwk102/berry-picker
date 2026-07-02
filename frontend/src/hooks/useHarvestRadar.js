import { useQuery } from '@tanstack/react-query'
import { getHarvestRadar } from '../lib/api'

export function useHarvestRadar(params = {}) {
  return useQuery({
    queryKey: ['harvest-radar', params],
    queryFn: () => getHarvestRadar(params),
    keepPreviousData: true,
  })
}
