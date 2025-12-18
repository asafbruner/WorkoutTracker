/**
 * PWA utilities - service worker registration and install prompt
 */

let deferredPrompt = null;

/**
 * Register service worker
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Unregister service worker (useful for debugging)
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
}

/**
 * Check if app is installed as PWA
 */
export function isInstalled() {
  // Check if running in standalone mode
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Setup install prompt handler
 */
export function setupInstallPrompt(onPromptAvailable) {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Save the event for later use
    deferredPrompt = e;
    // Notify that prompt is available
    if (onPromptAvailable) {
      onPromptAvailable(true);
    }
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
    if (onPromptAvailable) {
      onPromptAvailable(false);
    }
  });
}

/**
 * Show install prompt
 */
export async function showInstallPrompt() {
  if (!deferredPrompt) {
    return { outcome: 'unavailable' };
  }

  // Show the prompt
  deferredPrompt.prompt();

  // Wait for the user's response
  const choiceResult = await deferredPrompt.userChoice;

  // Clear the deferred prompt
  deferredPrompt = null;

  return choiceResult;
}

/**
 * Check if install prompt is available
 */
export function canShowInstallPrompt() {
  return deferredPrompt !== null;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Check if notifications are supported and enabled
 */
export function canSendNotifications() {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Send a local notification
 */
export async function sendNotification(title, options = {}) {
  if (!canSendNotifications()) {
    return null;
  }

  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    ...options
  };

  // If service worker is registered, use it
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const registration = await navigator.serviceWorker.ready;
    return registration.showNotification(title, defaultOptions);
  }

  // Fallback to regular notification
  return new Notification(title, defaultOptions);
}

/**
 * Check if app is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Setup online/offline listeners
 */
export function setupNetworkListeners(onOnline, onOffline) {
  window.addEventListener('online', () => {
    console.log('App is online');
    if (onOnline) onOnline();
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    if (onOffline) onOffline();
  });
}

/**
 * Get app version from cache
 */
export async function getAppVersion() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    return cacheNames[0] || 'unknown';
  }
  return 'unknown';
}
