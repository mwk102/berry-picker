import { CropIcon, hasCropIcon } from './CropIcon'

export function BerryChip({ children, crop }) {
  const cropValue = crop || children
  const showIcon = hasCropIcon(cropValue)

  return (
    <span className={showIcon ? 'berry-chip has-icon' : 'berry-chip'}>
      {showIcon ? <CropIcon crop={cropValue} className="berry-chip-icon" /> : null}
      {children}
    </span>
  )
}
