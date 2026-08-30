import {
  UtensilsCrossed, Coffee, Wine, ShoppingBag, BedDouble,
  Palette, Trees, Waves, Target, MapPin,
  type LucideIcon,
} from 'lucide-react'
import type { PlaceCategory } from './types'

/** Line-icon set replacing the native category emoji, per the DA guidelines. */
export const CATEGORY_ICONS: Record<PlaceCategory, LucideIcon> = {
  restaurant: UtensilsCrossed,
  cafe:       Coffee,
  bar:        Wine,
  shop:       ShoppingBag,
  hotel:      BedDouble,
  museum:     Palette,
  park:       Trees,
  beach:      Waves,
  activity:   Target,
  other:      MapPin,
}
