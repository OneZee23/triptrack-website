import { Component, type ReactNode } from 'react';

/** A failed optional map download must not replace the marketing page. */
export class GlobeBoundary extends Component<{ children: ReactNode; onFailed: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailed(); }
  render() { return this.state.failed ? null : this.props.children; }
}
