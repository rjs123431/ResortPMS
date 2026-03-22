import { getAbpValidationMessageForMember } from '@utils/abpValidation';

type AbpFieldValidationMessageProps = {
  error: unknown;
  member: string;
  className?: string;
};

export const AbpFieldValidationMessage = ({
  error,
  member,
  className,
}: AbpFieldValidationMessageProps) => {
  const message = getAbpValidationMessageForMember(error, member);
  if (!message) {
    return null;
  }

  return (
    <p className={className ?? 'mt-1 text-xs text-rose-600'} role="alert" aria-live="polite">
      {message}
    </p>
  );
};
