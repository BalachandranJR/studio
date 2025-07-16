import type { LucideProps } from 'lucide-react';
import {
  BedDouble,
  Car,
  Landmark,
  Palette,
  Plane,
  Sparkles,
  Train,
  UtensilsCrossed,
  ShoppingBasket,
  type ComponentType,
} from 'lucide-react';

export const iconMap: { [key: string]: ComponentType<LucideProps> } = {
  accommodation: BedDouble,
  car: Car,
  food: UtensilsCrossed,
  activity: Palette,
  attraction: Landmark,
  landmark: Landmark,
  transport: Plane,
  flights: Plane,
  train: Train,
  wellness: Sparkles,
  spa: Sparkles,
  shopping: ShoppingBasket,
  default: Palette,
};

interface ItineraryIconProps extends LucideProps {
    type: string;
    icon: string;
}

export function ItineraryIcon({ type, icon, ...props }: ItineraryIconProps) {
  let IconComponent = iconMap[icon];
  
  if (!IconComponent) {
    IconComponent = iconMap[type];
  }
  
  if (!IconComponent) {
    IconComponent = iconMap.default;
  }
  
  return <IconComponent {...props} />;
}
