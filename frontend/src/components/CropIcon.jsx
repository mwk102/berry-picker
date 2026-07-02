import {
  GiAppleCore,
  GiBerriesBowl,
  GiCherry,
  GiCorn,
  GiFlowers,
  GiMaze,
  GiPineTree,
  GiPumpkin,
  GiRaspberry,
  GiStrawberry,
  GiSunflower,
} from 'react-icons/gi'

function normalizeCropKey(crop) {
  const value = typeof crop === 'string' ? crop : crop?.slug || crop?.name || crop?.icon || ''
  return value.toLowerCase().replace(/\s+/g, '-')
}

const berryIconByCrop = {
  strawberry: GiStrawberry,
  raspberry: GiRaspberry,
  blueberry: GiBerriesBowl,
  blackberry: GiBerriesBowl,
}

const iconByCrop = {
  ...berryIconByCrop,
  apple: GiAppleCore,
  cherry: GiCherry,
  pumpkin: GiPumpkin,
  sunflower: GiSunflower,
  lavender: GiFlowers,
  'corn-maze': GiMaze,
  corn: GiCorn,
  'christmas-tree': GiPineTree,
}

export function isBerryCrop(crop) {
  return Boolean(berryIconByCrop[normalizeCropKey(crop)])
}

export function hasCropIcon(crop) {
  return Boolean(iconByCrop[normalizeCropKey(crop)])
}

export function CropIcon({ crop, className = '', fallbackLabel }) {
  const cropKey = normalizeCropKey(crop)
  const Icon = iconByCrop[cropKey]
  const label = fallbackLabel || (typeof crop === 'string' ? crop : crop?.name) || 'Crop'

  if (Icon) {
    return <Icon aria-hidden="true" className={className || undefined} focusable="false" />
  }

  return (
    <span aria-hidden="true" className={className || undefined}>
      {label.slice(0, 1)}
    </span>
  )
}
