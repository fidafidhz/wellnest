
// Emergency Service Worker
// This service worker will run in the background and can trigger emergency alerts

const INACTIVITY_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
let lastActivityTimestamp = Date.now();

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ACTIVITY_PING') {
    // Update the last activity timestamp when the user interacts with the app
    lastActivityTimestamp = Date.now();
    console.log('Activity ping received, timestamp updated:', new Date(lastActivityTimestamp));
  }
  
  if (event.data && event.data.type === 'REGISTER_EMERGENCY_CHECK') {
    // Start the inactivity monitoring process
    const checkInterval = event.data.interval || INACTIVITY_CHECK_INTERVAL;
    startInactivityMonitoring(checkInterval, event.data.maxInactivityPeriod);
    console.log('Emergency check registered with interval:', checkInterval, 'ms');
  }
});

// Function to monitor user inactivity
function startInactivityMonitoring(checkInterval, maxInactivityPeriod) {
  setInterval(async () => {
    const currentTime = Date.now();
    const inactivityDuration = currentTime - lastActivityTimestamp;
    
    console.log('Checking inactivity:', {
      lastActivity: new Date(lastActivityTimestamp),
      currentTime: new Date(currentTime),
      inactivityDuration: Math.floor(inactivityDuration / 1000 / 60) + ' minutes'
    });

    if (inactivityDuration > maxInactivityPeriod) {
      console.log('Inactivity threshold exceeded, triggering emergency alert');
      
      try {
        // Attempt to use Background Sync API to queue an alert request
        // that will be sent when online
        const registration = await self.registration;
        if ('sync' in registration) {
          registration.sync.register('emergency-alert-trigger');
        } else {
          // Fallback: try to send the alert directly
          await triggerEmergencyAlert();
        }
      } catch (error) {
        console.error('Error triggering emergency alert:', error);
      }
    }
  }, checkInterval);
}

// Function to trigger an emergency alert
async function triggerEmergencyAlert() {
  try {
    // Get the stored profile data
    const profileData = await getStoredProfileData();
    
    if (!profileData) {
      console.error('No profile data found, cannot send emergency alert');
      return;
    }
    
    // Get the Supabase URL and key from stored config
    const config = await getStoredConfig();
    
    if (!config || !config.supabaseUrl || !config.supabaseKey) {
      console.error('No Supabase configuration found, cannot send emergency alert');
      return;
    }
    
    // Send the emergency alert request
    const response = await fetch(`${config.supabaseUrl}/rest/v1/emergency_alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      },
      body: JSON.stringify({
        type: 'inactivity',
        status: 'active',
        description: 'Automated alert triggered due to extended inactivity',
        location: profileData.address
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send emergency alert: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Emergency alert sent successfully:', data);
    
    // Now send notifications to contacts
    if (profileData.emergencyContacts && profileData.emergencyContacts.length > 0) {
      const alertId = data.id;
      
      for (const contact of profileData.emergencyContacts) {
        await fetch(`${config.supabaseUrl}/rest/v1/alert_contacts_notified`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.supabaseKey,
            'Authorization': `Bearer ${config.supabaseKey}`
          },
          body: JSON.stringify({
            alert_id: alertId,
            contact_name: contact.name
          })
        });
      }
      
      console.log('Emergency contacts notified');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    throw error;
  }
}

// Helper function to get stored profile data
async function getStoredProfileData() {
  return new Promise((resolve) => {
    self.indexedDB.open('emergency-app-storage', 1).onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['profile'], 'readonly');
      const store = transaction.objectStore('profile');
      const request = store.get('current-profile');
      
      request.onsuccess = function() {
        resolve(request.result);
      };
      
      request.onerror = function() {
        console.error('Error getting profile data from IndexedDB');
        resolve(null);
      };
    };
  });
}

// Helper function to get stored Supabase config
async function getStoredConfig() {
  return new Promise((resolve) => {
    self.indexedDB.open('emergency-app-storage', 1).onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['config'], 'readonly');
      const store = transaction.objectStore('config');
      const request = store.get('supabase-config');
      
      request.onsuccess = function() {
        resolve(request.result);
      };
      
      request.onerror = function() {
        console.error('Error getting config from IndexedDB');
        resolve(null);
      };
    };
  });
}

// Register for background sync events (for offline support)
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-alert-trigger') {
    event.waitUntil(triggerEmergencyAlert());
  }
});

console.log('Emergency service worker initialized');
