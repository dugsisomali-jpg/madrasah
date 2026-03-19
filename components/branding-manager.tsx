'use client';

import { useEffect, useCallback } from 'react';

export function BrandingManager() {
  const updateBranding = useCallback(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(settings => {
        if (Array.isArray(settings)) {
          const favicon = settings.find(s => s.key === 'favicon')?.value;
          const title = settings.find(s => s.key === 'name')?.value;

          if (favicon) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = favicon;
          }

          if (title) {
            document.title = title;
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    updateBranding();
    
    // Listen for branding updates
    window.addEventListener('branding-update', updateBranding);
    return () => window.removeEventListener('branding-update', updateBranding);
  }, [updateBranding]);

  return null;
}
