import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@contexts/AuthContext';

const TOUR_STORAGE_PREFIX = 'pms_first_login_tour_completed';
export const FIRST_LOGIN_TOUR_RERUN_EVENT = 'pms:first-login-tour-rerun';

interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour-id="nav-frontdesk-dashboard"]',
    title: 'Dashboard',
    description: 'Start here for your daily operational overview and quick access to key actions.',
  },
  {
    targetSelector: '[data-tour-id="nav-frontdesk-room-rack"]',
    title: 'Room Rack',
    description: 'Use Room Rack to monitor room status and availability in one place.',
  },
  {
    targetSelector: '[data-tour-id="nav-frontdesk-reservations"]',
    title: 'Reservations',
    description: 'Create and manage bookings, then proceed to check-in and in-house workflows.',
  },
  {
    targetSelector: '[data-tour-id="nav-frontdesk-check-in"]',
    title: 'Arrivals / Check-In',
    description: 'Handle arriving guests quickly from this check-in entry point.',
  },
  {
    targetSelector: '[data-tour-id="nav-frontdesk-guests"]',
    title: 'Guests',
    description: 'Review guest profiles and details anytime from the Guests page.',
  },
];

const BUBBLE_WIDTH = 320;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const FirstLoginTour: React.FC = () => {
  const { user, tenant, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const storageKey = useMemo(() => {
    if (!user) {
      return null;
    }

    const tenantId = tenant?.id ?? 'host';
    return `${TOUR_STORAGE_PREFIX}_${tenantId}_${user.id}`;
  }, [tenant?.id, user]);

  useEffect(() => {
    if (!isAuthenticated || !storageKey) {
      setIsOpen(false);
      setStepIndex(0);
      setTargetRect(null);
      return;
    }

    const hasCompletedTour = localStorage.getItem(storageKey) === '1';
    setIsOpen(!hasCompletedTour);
    setStepIndex(0);
  }, [isAuthenticated, storageKey]);

  useEffect(() => {
    if (!isAuthenticated || !storageKey) {
      return;
    }

    const handleRerunTour = () => {
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener(FIRST_LOGIN_TOUR_RERUN_EVENT, handleRerunTour);
    return () => {
      window.removeEventListener(FIRST_LOGIN_TOUR_RERUN_EVENT, handleRerunTour);
    };
  }, [isAuthenticated, storageKey]);

  const findNextVisibleStep = (startIndex: number): number => {
    for (let index = startIndex; index < TOUR_STEPS.length; index += 1) {
      const element = document.querySelector(TOUR_STEPS[index].targetSelector);
      if (element) {
        return index;
      }
    }
    return -1;
  };

  const findPrevVisibleStep = (startIndex: number): number => {
    for (let index = startIndex; index >= 0; index -= 1) {
      const element = document.querySelector(TOUR_STEPS[index].targetSelector);
      if (element) {
        return index;
      }
    }
    return -1;
  };

  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const syncPosition = () => {
      const step = TOUR_STEPS[stepIndex];
      const target = document.querySelector(step.targetSelector) as HTMLElement | null;

      if (!target) {
        const nextIndex = findNextVisibleStep(stepIndex + 1);
        if (nextIndex >= 0) {
          setStepIndex(nextIndex);
          return;
        }

        if (stepIndex > 0) {
          completeTour();
          return;
        }
      }

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    const timerId = window.setTimeout(syncPosition, 80);
    window.addEventListener('resize', syncPosition);
    window.addEventListener('scroll', syncPosition, true);

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('scroll', syncPosition, true);
    };
  }, [isOpen, stepIndex]);

  const completeTour = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, '1');
    }
    setIsOpen(false);
    setStepIndex(0);
  };

  const currentStep = TOUR_STEPS[stepIndex];
  const isLastStep = findNextVisibleStep(stepIndex + 1) < 0;

  if (!isOpen || !currentStep || !targetRect) {
    return null;
  }

  const bubbleLeft = (() => {
    const preferred = targetRect.right + 14;
    const fallback = targetRect.left - BUBBLE_WIDTH - 14;
    const leftCandidate = preferred + BUBBLE_WIDTH + 16 <= window.innerWidth ? preferred : fallback;
    return clamp(leftCandidate, 8, Math.max(8, window.innerWidth - BUBBLE_WIDTH - 8));
  })();

  const bubbleTop = clamp(
    targetRect.top + targetRect.height / 2 - 96,
    8,
    Math.max(8, window.innerHeight - 210),
  );

  const indicatorLeft = clamp(targetRect.left - 4, 0, Math.max(0, window.innerWidth - targetRect.width - 8));
  const indicatorTop = clamp(targetRect.top - 4, 0, Math.max(0, window.innerHeight - targetRect.height - 8));

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-50 bg-black/25" aria-hidden />

      <div
        className="pointer-events-none fixed z-[60] rounded-md border-2 border-primary-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.06)]"
        style={{
          top: indicatorTop,
          left: indicatorLeft,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      <div
        className="fixed z-[70] w-80 rounded-xl border border-primary-200 bg-white p-4 shadow-2xl dark:border-primary-800 dark:bg-gray-800"
        style={{ top: bubbleTop, left: bubbleLeft }}
      >
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
          Tour step {stepIndex + 1}
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{currentStep.title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{currentStep.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={completeTour}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const prevIndex = findPrevVisibleStep(stepIndex - 1);
                if (prevIndex >= 0) {
                  setStepIndex(prevIndex);
                }
              }}
              disabled={findPrevVisibleStep(stepIndex - 1) < 0}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  completeTour();
                  return;
                }

                const nextIndex = findNextVisibleStep(stepIndex + 1);
                if (nextIndex >= 0) {
                  setStepIndex(nextIndex);
                  return;
                }

                completeTour();
              }}
              className="rounded bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};