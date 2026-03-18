import { motion } from 'framer-motion';

export function XPBar({ value = 0 }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between font-condensed text-[0.65rem] font-bold uppercase tracking-[0.22em] text-forge-muted2">
        <span>XP Progress</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 bg-forge-bg4">
        <motion.div
          className="h-full bg-gradient-to-r from-forge-gold to-forge-orange"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
