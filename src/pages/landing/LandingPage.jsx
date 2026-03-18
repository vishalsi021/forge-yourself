import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { landingContent } from '@/data/landing';

export default function LandingPage() {
  return (
    <PageWrapper className="pt-0">
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.12),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70" />
        <div className="relative z-10 py-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex self-center border border-forge-gold/30 bg-forge-gold/10 px-4 py-2 font-condensed text-[0.7rem] font-bold uppercase tracking-[0.32em] text-forge-gold">
            Complete Self-Mastery System
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="display-title text-[5rem] leading-[0.85] sm:text-[5.4rem]">
            FORGE
            <span className="block text-forge-red">YOUR</span>
            <span className="block">SELF</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mx-auto mt-5 max-w-sm font-condensed text-base font-semibold uppercase tracking-[0.28em] text-forge-muted2">
            The full science. 60 days. No shortcuts.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-8 grid gap-3">
            <Link to="/signup"><Button className="w-full py-4 text-xl">Begin Your Forge</Button></Link>
            <a href="#how-it-works"><Button variant="secondary" className="w-full">See how it works</Button></a>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="mt-8 grid grid-cols-3 gap-3">
            {landingContent.metrics.map((item) => (
              <Card key={item.label} className="bg-forge-bg3 p-3 text-center">
                <div className="font-display text-3xl text-forge-gold">{item.value}</div>
                <div className="mt-1 font-condensed text-[0.65rem] font-bold uppercase tracking-[0.22em] text-forge-muted2">{item.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-6">
        <div className="surface overflow-hidden py-3">
          <div className="flex gap-6 whitespace-nowrap px-4 font-condensed text-[0.72rem] font-bold uppercase tracking-[0.22em] text-forge-muted2">
            <span>Real daily protocol</span>
            <span>Identity-based growth</span>
            <span>CBT and reflection</span>
            <span>Progress you can actually see</span>
            <span>Finance and future-self alignment</span>
          </div>
        </div>
      </section>

      <section className="space-y-4 py-8">
        <div className="section-label">Why most self-improvement fails</div>
        <h2 className="display-title text-4xl">92% of self-improvement apps break because they isolate one piece of the system.</h2>
        <p className="text-sm leading-6 text-forge-muted2">FORGE treats body, mind, identity, finance, and direction as one operating system instead of disconnected checklists.</p>
      </section>

      <section className="space-y-4 py-8">
        <div className="section-label">The 7 Pillars</div>
        <div className="grid gap-3">
          {landingContent.pillars.map((pillar, index) => (
            <motion.div key={pillar.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.05 }}>
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="display-title text-3xl">{pillar.name}</h3>
                  <span className="section-label">Science-backed</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-forge-muted2">{pillar.basis}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="space-y-4 py-8">
        <div className="section-label">How it works</div>
        {[
          'Take the deep assessment across identity, body, mind, career, relationships, finance, purpose, blockers, and habits.',
          'Get your AI-personalized 60-day protocol, weakness map, and daily momentum system.',
          'Track daily completion, psychology work, reviews, and your best-version progress over time.',
        ].map((text, index) => (
          <Card key={text}>
            <div className="font-display text-3xl text-forge-gold">0{index + 1}</div>
            <p className="mt-3 text-sm leading-6 text-forge-muted2">{text}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-4 py-8">
        <div className="section-label">Science</div>
        <Card>
          <h3 className="display-title text-3xl">Built on peer-reviewed research and practical operators.</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-forge-muted2">
            <p>Sleep, light exposure, deep work, and recovery protocols echo the behavioral science popularized by Huberman and Matthew Walker.</p>
            <p>Identity-based habits and systems thinking borrow heavily from James Clear’s work on repetition, environment, and standards.</p>
            <p>The psychology layer uses CBT-style reframing, evidence checks, and actionable belief updates rather than vague positivity.</p>
          </div>
        </Card>
      </section>

      <section className="space-y-4 py-8">
        <div className="section-label">What’s inside FORGE</div>
        <div className="grid gap-3">
          {[
            'Daily protocol with 15 core tasks plus personalized additions',
            'Psychology tools: CBT, limiting beliefs, dopamine science, stoicism, Huberman protocol',
            'Identity system: alter ego, values, mission statement, identity votes',
            'Progress tracking, weekly review, finance module, vision analysis, and profile controls',
          ].map((item) => (
            <Card key={item}><p className="text-sm leading-6 text-forge-muted2">{item}</p></Card>
          ))}
        </div>
      </section>

      <section className="space-y-4 py-8">
        <div className="section-label">FAQ</div>
        <div className="grid gap-3">
          {landingContent.faq.map((item) => (
            <Card key={item.q}>
              <h3 className="font-condensed text-sm font-bold uppercase tracking-[0.18em] text-forge-text">{item.q}</h3>
              <p className="mt-3 text-sm leading-6 text-forge-muted2">{item.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-10 text-center">
        <Card className="bg-forge-bg3 p-6">
          <div className="section-label mb-2">Start now</div>
          <h2 className="display-title text-5xl">Stop planning. Start forging.</h2>
          <p className="mt-3 text-sm leading-6 text-forge-muted2">No billing wall. No fluff. Just the full protocol, your data, and your next move.</p>
          <Link to="/signup"><Button className="mt-5 w-full">Create Your Account</Button></Link>
        </Card>
      </section>
    </PageWrapper>
  );
}
