'use client';

import { useEffect } from 'react';

export function BrandingManager() {
  useEffect(() => {
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

  return null;
}
