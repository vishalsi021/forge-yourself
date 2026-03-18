import { motion } from 'framer-motion';

const toneMap = {
  fitness: '#FF6B35',
  mind: '#BF5AF2',
  career: '#FFD700',
  social: '#00FF88',
  habits: '#0A84FF',
  purpose: '#FF2D55',
};

export function ArchBars({ scores = {} }) {
  const entries = Object.entries(scores).filter(([key]) => key !== 'wealth');
  const hasAnyScore = entries.some(([, value]) => value > 0);

  if (!entries.length || !hasAnyScore) {
    return (
      <div className="py-4 text-center text-sm text-forge-muted2">
        Complete tasks to see your dimension breakdown.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries
        .map(([key, value], index) => {
          const percent = Math.round((value / 10) * 100);
          return (
            <div key={key} className="grid grid-cols-[68px_1fr_40px] items-center gap-2">
              <span className="font-condensed text-[0.7rem] font-bold uppercase tracking-[0.18em] text-forge-muted2">{key}</span>
              <div className="h-[3px] bg-forge-bg4">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: toneMap[key] }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percent}%` }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                />
              </div>
              <span className="font-display text-lg text-right" style={{ color: toneMap[key] }}>{percent}%</span>
            </div>
          );
        })}
    </div>
  );
}
