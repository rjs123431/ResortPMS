type ChannelIconOption = {
  id: string;
  label: string;
  src: string;
};

export const CHANNEL_ICON_OPTIONS: ChannelIconOption[] = [
  { id: 'compass', label: 'Compass', src: '/assets/channel-icons/compass.svg' },
  { id: 'globe', label: 'Globe', src: '/assets/channel-icons/globe.svg' },
  { id: 'phone', label: 'Phone', src: '/assets/channel-icons/phone.svg' },
  { id: 'facebook', label: 'Facebook', src: '/assets/channel-icons/facebook.svg' },
  { id: 'email', label: 'Email', src: '/assets/channel-icons/email.svg' },
  { id: 'instagram', label: 'Instagram', src: '/assets/channel-icons/instagram.svg' },
  { id: 'agoda', label: 'Agoda.com', src: '/assets/channel-icons/agoda.svg' },
  { id: 'booking', label: 'Booking.com', src: '/assets/channel-icons/booking.svg' },
  { id: 'desk', label: 'Front Desk', src: '/assets/channel-icons/front-desk.svg' },
  { id: 'briefcase', label: 'Corporate', src: '/assets/channel-icons/briefcase.svg' },
  { id: 'ticket', label: 'Promo', src: '/assets/channel-icons/ticket.svg' },
];

export const DEFAULT_CHANNEL_ICON = CHANNEL_ICON_OPTIONS[0].src;

export const isKnownChannelIcon = (value?: string) =>
  typeof value === 'string' && CHANNEL_ICON_OPTIONS.some((option) => option.src === value);

type ChannelAvatarProps = {
  icon?: string;
  name?: string;
  className?: string;
};

export const ChannelAvatar = ({ icon, name, className = 'h-5 w-5' }: ChannelAvatarProps) => {
  const resolvedIcon = isKnownChannelIcon(icon) ? icon : DEFAULT_CHANNEL_ICON;
  const alt = name ? `${name} icon` : 'Channel icon';

  return (
    <img
      src={resolvedIcon}
      alt={alt}
      className={`${className} rounded object-cover ring-1 ring-black/5 dark:ring-white/10`}
      loading="lazy"
    />
  );
};

export type { ChannelIconOption };