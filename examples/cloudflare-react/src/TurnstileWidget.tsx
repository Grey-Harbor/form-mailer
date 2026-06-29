import { useEffect, useRef, useState } from 'react';
import { loadTurnstileScript } from './turnstile.js';

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string) => void;
}

export function TurnstileWidget({ siteKey, onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function mountWidget() {
      if (!siteKey.trim()) {
        onToken('');
        setStatus('missing');
        return;
      }

      try {
        await loadTurnstileScript();

        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            onToken(token);
          },
          'error-callback': () => {
            onToken('');
            setStatus('error');
          },
          'expired-callback': () => {
            onToken('');
          },
        });
        setStatus('ready');
      } catch {
        if (!cancelled) {
          onToken('');
          setStatus('error');
        }
      }
    }

    mountWidget();

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;

      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onToken, siteKey]);

  if (status === 'missing') {
    return (
      <p className="muted">
        Turnstile site key is missing. Use the testing page linked in the docs to get a test site key and secret,
        then set <code>TURNSTILE_SITE_KEY</code>.
      </p>
    );
  }

  if (status === 'error') {
    return (
      <p className="error">
        Turnstile could not load. Check the widget script, site key, and browser network access.
      </p>
    );
  }

  return <div ref={containerRef} className="turnstile-widget" />;
}
