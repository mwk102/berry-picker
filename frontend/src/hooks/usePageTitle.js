import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Northwest U-Pick` : 'Northwest U-Pick'
  }, [title])
}
