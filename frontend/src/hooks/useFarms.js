import { useQuery } from '@tanstack/react-query'
import { getFarm, getFarms } from '../lib/api'

export function useFarms(params = {}) {
  return useQuery({
    queryKey: ['farms', params],
    queryFn: () => getFarms(params),
    keepPreviousData: true,
  })
}

export function useFarm(slug) {
  return useQuery({
    queryKey: ['farm', slug],
    queryFn: () => getFarm(slug),
    enabled: Boolean(slug),
  })
}
