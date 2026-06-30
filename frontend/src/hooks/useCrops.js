import { useQuery } from '@tanstack/react-query'
import { getCrops } from '../lib/api'

export function useCrops() {
  return useQuery({
    queryKey: ['crops'],
    queryFn: getCrops,
  })
}
