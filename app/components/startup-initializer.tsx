
'use client';

import { useEffect, useState } from 'react';

export function StartupInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      // Инициализируем сервисы при первой загрузке
      fetch('/api/init')
        .then(() => {
          console.log('Startup services initialized');
          setInitialized(true);
        })
        .catch((error) => {
          console.error('Error initializing startup services:', error);
        });
    }
  }, [initialized]);

  return null;
}
