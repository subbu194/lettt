import { useEffect, useMemo, useState } from 'react';

function getIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

function getPrefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getIsLowEndDevice() {
  // Heuristic: lower core counts often correlate with lower-end devices.
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  return typeof cores === 'number' ? cores <= 4 : false;
}

function getIsTouchDevice() {
  if (typeof navigator === 'undefined' && typeof window === 'undefined') return false;
  try {
    // Prefer feature detection via maxTouchPoints when available
    // Fall back to ontouchstart for older browsers
    const hasMax = typeof navigator !== 'undefined' && typeof (navigator as any).maxTouchPoints === 'number' && (navigator as any).maxTouchPoints > 0;
    const hasTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
    const msPoints = typeof (navigator as any).msMaxTouchPoints === 'number' && (navigator as any).msMaxTouchPoints > 0;
    return hasMax || hasTouch || msPoints;
  } catch {
    return false;
  }
}

export function useMedia() {
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [reduceMotion, setReduceMotion] = useState(getPrefersReducedMotion);
  const isTouch = getIsTouchDevice();

  useEffect(() => {
    const mmMobile = window.matchMedia('(max-width: 768px)');
    const mmReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onMobile = () => setIsMobile(mmMobile.matches);
    const onReduce = () => setReduceMotion(mmReduce.matches);

    mmMobile.addEventListener('change', onMobile);
    mmReduce.addEventListener('change', onReduce);
    return () => {
      mmMobile.removeEventListener('change', onMobile);
      mmReduce.removeEventListener('change', onReduce);
    };
  }, []);

  const lowEnd = useMemo(() => getIsLowEndDevice(), []);

  return {
    isMobile,
    isTouch,
    reduceMotion,
    lowEnd,
    // Disable 3D on narrow screens, touch-capable devices, reduced-motion, and low-end devices
    enable3D: !isMobile && !isTouch && !reduceMotion && !lowEnd,
  };
}


