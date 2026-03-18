import React from 'react';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      retryKey: 0,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState((state) => ({
      hasError: false,
      retryKey: state.retryKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <PageWrapper>
          <Card className="p-5">
            <div className="section-label mb-2 text-forge-red">Dashboard unavailable</div>
            <p className="text-sm text-forge-muted2">
              Something broke while loading your dashboard. Tap to retry.
            </p>
            <Button className="mt-4 w-full" onClick={this.handleRetry}>
              Tap to retry
            </Button>
          </Card>
        </PageWrapper>
      );
    }

    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}
