import {
  DayUseGuestCategory,
  DayUseGuestContext,
  DayUseOfferType,
  DayUseStatus,
  type DayUseOfferDto,
  type DayUseOfferListDto,
} from '@/types/day-use.types';

export const createEmptyDayUseOfferForm = (): DayUseOfferDto => ({
  id: '',
  code: '',
  name: '',
  variantName: '',
  description: '',
  offerType: DayUseOfferType.EntranceFee,
  guestContext: DayUseGuestContext.WalkIn,
  guestCategory: DayUseGuestCategory.Adult,
  durationMinutes: undefined,
  chargeTypeId: '',
  chargeTypeName: '',
  amount: 0,
  sortOrder: 0,
  isActive: true,
});

export const dayUseOfferTypeLabel = (value: DayUseOfferType) => (value === DayUseOfferType.EntranceFee ? 'Entrance Fee' : 'Activity');

export const dayUseContextLabel = (value: DayUseGuestContext) => (value === DayUseGuestContext.WalkIn ? 'Walk-In' : 'In-House');

export const dayUseGuestCategoryLabel = (value?: DayUseGuestCategory) => {
  switch (value) {
    case DayUseGuestCategory.Adult:
      return 'Adult';
    case DayUseGuestCategory.Kid:
      return 'Kid';
    case DayUseGuestCategory.SeniorPwd:
      return 'Senior / PWD';
    case DayUseGuestCategory.ChildBelowFour:
      return '4 and below';
    default:
      return 'General';
  }
};

export const dayUseDurationLabel = (minutes?: number) => {
  if (!minutes) return '';
  if (minutes === 30) return 'Half hour';
  if (minutes === 60) return '1 hour';
  return `${minutes} minutes`;
};

export const dayUseOfferLabel = (offer: DayUseOfferListDto) => {
  if (offer.offerType === DayUseOfferType.EntranceFee) {
    return dayUseGuestCategoryLabel(offer.guestCategory);
  }

  const parts = [offer.name];
  if (offer.variantName) parts.push(offer.variantName);
  if (offer.durationMinutes) parts.push(dayUseDurationLabel(offer.durationMinutes));
  return parts.join(' - ');
};

export const dayUseStatusLabel = (status: DayUseStatus) => {
  switch (status) {
    case DayUseStatus.Completed:
      return 'Completed';
    case DayUseStatus.Cancelled:
      return 'Cancelled';
    default:
      return 'Open';
  }
};

export const dayUseStatusBadgeClass = (status: DayUseStatus) => {
  switch (status) {
    case DayUseStatus.Completed:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case DayUseStatus.Cancelled:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  }
};

export const dayUseFormatTimeValue = (value: string) => (value ? value.slice(0, 5) : '');