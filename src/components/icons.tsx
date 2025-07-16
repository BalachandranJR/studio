import type { LucideProps } from 'lucide-react';
import {
  BedDouble,
  Car,
  Landmark,
  Palette,
  Plane,
  Train,
  UtensilsCrossed,
  type ComponentType,
} from 'lucide-react';

export const iconMap: { [key: string]: ComponentType<LucideProps> } = {
  accommodation: BedDouble,
  car: Car,
  food: UtensilsCrossed,
  activity: Palette,
  attraction: Landmark,
  transport: Plane,
  flights: Plane,
  train: Train,
};

export function ItineraryIcon({ name, ...props }: { name: string } & LucideProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    // Return a default icon or null if no mapping is found
    return <Palette {...props} />;
  }

  return <IconComponent {...props} />;
}
