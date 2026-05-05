import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useLocation, useNavigate } from 'react-router-dom';

export function useAndroidBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return undefined;

    let listener;
    let cancelled = false;

    App.addListener('backButton', ({ canGoBack }) => {
      const isRootRoute = location.pathname === '/';

      if (canGoBack && !isRootRoute) {
        navigate(-1);
        return;
      }

      App.exitApp();
    }).then((handle) => {
      if (cancelled) {
        handle.remove();
        return;
      }
      listener = handle;
    });

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, [location.pathname, navigate]);
}
