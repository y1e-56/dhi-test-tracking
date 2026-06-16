import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (error.name === 'NotFoundError' && (error.message.includes('removeChild') || error.message.includes('insertBefore'))) {
      console.warn('[ErrorBoundary] React DOM reconciliation conflict (harmless).');
      this.setState({ hasError: false });
      return;
    }
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-slate-400">Une erreur est survenue. Rechargez la page.</p>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}
