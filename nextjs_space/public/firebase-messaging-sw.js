importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Extract configuration from query parameters
const urlParams = new URLSearchParams(location.search);
const apiKey = urlParams.get('apiKey');
const authDomain = urlParams.get('authDomain');
const projectId = urlParams.get('projectId');
const storageBucket = urlParams.get('storageBucket');
const messagingSenderId = urlParams.get('messagingSenderId');
const appId = urlParams.get('appId');

if (apiKey && projectId && messagingSenderId) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  });

  const messaging = firebase.messaging();

  // Handle background notifications
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // Customize notification behavior if needed
    const notificationTitle = payload.notification?.title || "Hello Bazaar Alert";
    const notificationOptions = {
      body: payload.notification?.body || "",
      icon: payload.notification?.icon || "/favicon.svg",
      image: payload.notification?.image || payload.data?.image || null,
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click to redirect to the product or order page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let clickAction = '/';
  if (event.notification.data && event.notification.data.click_action) {
    clickAction = event.notification.data.click_action;
  }
  
  // Convert relative url to absolute if needed
  const targetUrl = clickAction.startsWith('http') 
    ? clickAction 
    : new URL(clickAction, self.location.origin).toString();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open with the target URL, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
