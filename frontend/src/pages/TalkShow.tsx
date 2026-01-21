import { motion } from 'framer-motion';
import { TalkShowVideos } from '@/components/home/TalkShowVideos';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';

export default function TalkShowPage() {
  return (
    <PageTransition>
      <div className="bg-(--color-bg)">
        <div className="lux-container py-16">
          <motion.div
            className="max-w-3xl"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight">Talk Show</h1>
            <p className="mt-3 text-(--color-muted)">   conversations and performances — curated for a   experience.</p>
          </motion.div>
        </div>
        <TalkShowVideos />
      </div>
    </PageTransition>
  );
}
