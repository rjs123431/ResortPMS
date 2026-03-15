import React from 'react';

interface LogoSpinnerProps {
  sizeClassName?: string;
  logoSizeClassName?: string;
  spinnerClassName?: string;
  logoSrc?: string;
  logoAlt?: string;
  className?: string;
}

export const LogoSpinner: React.FC<LogoSpinnerProps> = ({
  sizeClassName = 'h-16 w-16',
  logoSizeClassName = 'h-12 w-12',
  spinnerClassName = 'border-b-2 border-blue-500',
  logoSrc = '/logo.png',
  logoAlt = 'Company logo',
  className = '',
}) => {
  return (
    <div className={`relative ${sizeClassName} ${className}`.trim()}>
      <div className={`animate-spin rounded-full ${sizeClassName} ${spinnerClassName}`} />
      <img src={logoSrc} alt={logoAlt} className={`absolute inset-0 m-auto object-contain ${logoSizeClassName}`} />
    </div>
  );
};
