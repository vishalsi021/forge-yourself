import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageWrapper } from '@/components/layout/PageWrapper';

export default function OnboardingIntro() {
  return (
    <PageWrapper className="flex min-h-screen items-center">
      <Card className="w-full p-6">
        <div className="section-label mb-2">Step 0 of 9</div>
        <h1 className="display-title text-5xl">This is where you commit.</h1>
        <p className="mt-3 text-sm leading-6 text-forge-muted2">
          The onboarding is deep by design. You will answer across identity, fitness, mind, career, social, wealth, purpose, blockers, and your custom habits. The result becomes your day-one operating system.
        </p>
        <div className="mt-5 grid gap-3 text-sm leading-6 text-forge-muted2">
          <p>• Every slider has a default, so momentum never stalls.</p>
          <p>• Your custom habits are required because the system should fit your real life.</p>
          <p>• The analysis screen runs a real Claude-backed interpretation, not a fake loading state.</p>
        </div>
        <Link to="/onboarding/1"><Button className="mt-6 w-full">Begin Step 1</Button></Link>
      </Card>
    </PageWrapper>
  );
}
