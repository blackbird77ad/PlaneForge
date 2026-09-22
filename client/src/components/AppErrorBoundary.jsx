import { Component } from 'react';

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('PlaneForge render error', error, info);
  }

  clearSiteData = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      const registrations = await navigator.serviceWorker?.getRegistrations?.();
      registrations?.forEach((registration) => registration.unregister());
      const cacheKeys = await window.caches?.keys?.();
      await Promise.all((cacheKeys || []).map((key) => window.caches.delete(key)));
    } catch {
      // Reload still gives the browser a fresh chance if storage cleanup is blocked.
    } finally {
      window.location.replace('/');
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="app-error-page">
        <section>
          <p className="eyebrow">PlaneForge</p>
          <h1>The page could not finish loading.</h1>
          <p>
            Refresh the page, or clear the old browser session cache if this started after an
            update.
          </p>
          <div>
            <button className="button primary" type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button className="button ghost" type="button" onClick={this.clearSiteData}>
              Clear Session Cache
            </button>
          </div>
        </section>
      </main>
    );
  }
}
