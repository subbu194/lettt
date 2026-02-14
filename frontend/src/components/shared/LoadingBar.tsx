import { motion } from 'framer-motion';

type Props = {
  progress?: number; // 0-100
  className?: string;
};

export function LoadingBar({ progress, className = '' }: Props) {
  return (
    <div className={`h-1 w-full overflow-hidden rounded-full bg-black/5 ${className}`}>
      {progress !== undefined ? (
        <motion.div
          className="h-full bg-(--color-red)"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      ) : (
        <motion.div
          className="h-full w-1/3 bg-(--color-red)"
          animate={{
            x: ['0%', '300%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
}
