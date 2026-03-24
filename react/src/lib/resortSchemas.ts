import { z } from 'zod';

export const guestFormSchema = z.object({
  id: z.string(),
  guestCode: z.string().trim().min(1, 'Guest code is required'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  middleName: z.string(),
  email: z.string().trim().email('Invalid email').or(z.literal('')),
  phone: z.string(),
  nationality: z.string(),
  notes: z.string(),
  isActive: z.boolean(),
});

export type GuestFormValues = z.infer<typeof guestFormSchema>;

export const roomTypeFormSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Room type name is required'),
  description: z.string(),
  plainDescription: z.string(),
  bedTypeSummary: z.string().trim().min(1, 'Bed configuration is required'),
  featureTagsText: z.string().trim().min(1, 'At least one feature tag is required'),
  amenityItemsText: z.string().trim().min(1, 'At least one amenity is required'),
  maxAdults: z.number().int().min(1, 'Maximum adults must be at least 1'),
  maxChildren: z.number().int().min(0, 'Maximum children cannot be negative'),
  isActive: z.boolean(),
});

export type RoomTypeFormValues = z.infer<typeof roomTypeFormSchema>;
