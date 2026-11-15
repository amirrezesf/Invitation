import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CashierMode } from './components/CashierMode';
import { CreatorWizard } from './components/CreatorWizard';
import { HostDashboard } from './components/HostDashboard';
import { InviteReceiverView } from './components/InviteReceiverView';
import { ResponseCardView } from './components/ResponseCardView';
import { SetupView } from './components/SetupView';
import {
  applyCafeTheme,
  loadCafeConfig,
  resetCafeConfig,
  saveCafeConfig,
} from './store/cafeConfig';
import { CafeConfig } from './types/invite';
import { decodeInvitePayload, decodeResponsePayload } from './utils/codec';

type RouteState =
  | { page: 'create' }
  | { page: 'mine' }
  | { page: 'cashier' }
  | { page: 'setup' }
  | { page: 'invite'; payload: string }
  | { page: 'response'; payload: string };

function parseRoute(): RouteState {
  const hash = window.location.hash || '';
  const path = window.location.pathname || '/';
  const effective = hash && hash !== '#' ? hash : path !== '/' ? `#${path}` : '#/';

  if (effective.startsWith('#/i/')) {
    return { page: 'invite', payload: effective.slice(4) };
  }
  if (effective.startsWith('#/r/')) {
    return { page: 'response', payload: effective.slice(4) };
  }
  if (effective.startsWith('#/mine')) {
    return { page: 'mine' };
  }
  if (effective.startsWith('#/cashier')) {
    return { page: 'cashier' };
  }
  if (effective.startsWith('#/setup')) {
    return { page: 'setup' };
  }
  return { page: 'create' };
}

export default function App() {
  const [config, setConfig] = useState<CafeConfig>(() => {
    const loaded = loadCafeConfig();
    applyCafeTheme(loaded.primaryColor, loaded.accentColor);
    return loaded;
  });

  const [route, setRoute] = useState<RouteState>(() => parseRoute());
  const secretTapCount = useRef(0);
  const secretTapTimer = useRef<number | null>(null);

  useEffect(() => {
    document.title = `دعوت‌نامه ${config.name} | قرار قهوه`;
  }, [config.name]);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((hash: string) => {
    const normalized = hash.startsWith('#') ? hash : `#${hash}`;
    if (window.location.hash === normalized) {
      setRoute(parseRoute());
    } else {
      window.location.hash = normalized;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSaveConfig = (next: CafeConfig) => {
    saveCafeConfig(next);
    setConfig(next);
  };

  const handleResetConfig = () => {
    const fresh = resetCafeConfig();
    setConfig(fresh);
    return fresh;
  };

  const handleSecretLogoTap = () => {
    secretTapCount.current += 1;
    if (secretTapTimer.current) window.clearTimeout(secretTapTimer.current);
    if (secretTapCount.current >= 5) {
      secretTapCount.current = 0;
      navigate('#/setup');
      return;
    }
    secretTapTimer.current = window.setTimeout(() => {
      secretTapCount.current = 0;
    }, 500);
  };

  const decodedInvite = useMemo(() => {
    if (route.page !== 'invite') return null;
    return decodeInvitePayload(route.payload);
  }, [route]);

  const decodedResponse = useMemo(() => {
    if (route.page !== 'response') return null;
    return decodeResponsePayload(route.payload);
  }, [route]);

  return (
    <div className="min-h-dvh relative overflow-x-hidden">
      {/* Subtle Decorative Background Shapes & Stickers (matches reference screenshots) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Top-left soft peach circle */}
        <div
          className="hidden sm:block absolute top-10 left-16 w-28 h-28 rounded-full opacity-35"
          style={{ backgroundColor: '#F6CBB4' }}
        />
        {/* Top-left lime pill peek */}
        <div
          className="hidden sm:block absolute -top-8 left-44 w-36 h-16 rounded-full border-2 border-[#1A1816] -rotate-12"
          style={{ backgroundColor: config.accentColor }}
        />
        {/* Bottom-right pink corner circle */}
        <div
          className="hidden sm:block absolute -bottom-12 -right-10 w-36 h-36 rounded-full border-2 border-[#1A1816]"
          style={{ backgroundColor: '#FF9BB8' }}
        />
        {/* Floating tilted stickers on wide screens */}
        <div className="hidden md:flex absolute top-32 left-[18%] bg-[#FF9BB8] border-2 border-[#1A1816] shadow-[3px_3px_0px_#1A1816] px-3 py-1.5 rounded-lg text-xs font-black text-[#1A1816] rotate-6">
          پایه‌ست؟
        </div>
        <div
          style={{ backgroundColor: config.accentColor }}
          className="hidden md:flex absolute top-28 right-[18%] w-14 h-14 rounded-full border-2 border-[#1A1816] items-center justify-center text-lg font-black text-[#1A1816] -rotate-12"
        >
          ؟♡!
        </div>
        <div className="hidden md:flex absolute bottom-24 left-[20%] bg-white/80 border border-dashed border-[#1A1816] px-3 py-1 rounded-lg text-[11px] font-bold text-[#1A1816] -rotate-3">
          سورپرایزش برای مهمونته
        </div>
        {/* Minimal corner mark */}
        <div
          style={{ color: config.primaryColor }}
          className="hidden sm:block absolute top-16 right-16 text-xl font-black"
        >
          ✦
        </div>
        <div
          style={{ backgroundColor: config.primaryColor }}
          className="hidden sm:block absolute bottom-28 left-12 w-3.5 h-3.5 rounded-full"
        />
      </div>

      {/* Main Centered Content */}
      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 py-3">
        {route.page === 'create' && (
          <CreatorWizard
            config={config}
            onNavigate={navigate}
            onSecretLogoTap={handleSecretLogoTap}
          />
        )}
        {route.page === 'invite' && (
          <InviteReceiverView
            invite={decodedInvite}
            fallbackConfig={config}
            onNavigate={navigate}
          />
        )}
        {route.page === 'response' && (
          <ResponseCardView
            response={decodedResponse}
            config={config}
            onNavigate={navigate}
          />
        )}
        {route.page === 'mine' && (
          <HostDashboard config={config} onNavigate={navigate} />
        )}
        {route.page === 'cashier' && (
          <CashierMode config={config} onNavigate={navigate} />
        )}
        {route.page === 'setup' && (
          <SetupView
            config={config}
            onSaveConfig={handleSaveConfig}
            onResetConfig={handleResetConfig}
            onNavigate={navigate}
          />
        )}
      </main>
    </div>
  );
}
