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

export function useMedia() {
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [reduceMotion, setReduceMotion] = useState(getPrefersReducedMotion);

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
    reduceMotion,
    lowEnd,
    enable3D: !isMobile && !reduceMotion && !lowEnd,
  };
}


