import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Berry Picker` : 'Berry Picker'
  }, [title])
}
