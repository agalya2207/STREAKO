import purchaseService from './purchaseService.js';

class PurchaseReminderService {
  constructor() {
    this.watchId = null;
    this.lastKnownPosition = null;
    this.intervalId = null;
    this.checkingNearbyPlaces = false;
    this.isWatching = false;
    this.listeners = new Set();
  }

  /**
   * Subscribe to proximity or reminder events
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notifyListeners(event, data) {
    this.listeners.forEach(fn => {
      try { fn(event, data); } catch (e) { console.error(e); }
    });
  }

  /**
   * Check permissions status
   */
  async checkPermissions() {
    let notification = 'default';
    if ('Notification' in window) {
      notification = Notification.permission;
    }

    let location = 'prompt';
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        location = status.state; // 'granted', 'denied', 'prompt'
      } catch (e) {
        // Some browsers don't support geolocation permission query
      }
    }

    return { notification, location };
  }

  /**
   * Request Notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return 'denied';
    }
  }

  /**
   * Request Geolocation permission
   */
  async requestLocationPermission() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve('unsupported');
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.lastKnownPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          resolve('granted');
        },
        (err) => {
          console.warn('Location permission denied or unavailable:', err.message);
          resolve('denied');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  /**
   * Start tracking and reminder monitors
   */
  startMonitoring() {
    if (this.isWatching) return;
    this.isWatching = true;

    // Check date/time reminders immediately, then every 30 seconds
    this.checkDateTimeReminders();
    this.intervalId = setInterval(() => {
      this.checkDateTimeReminders();
    }, 30000);

    // Start geolocation watcher
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handlePositionUpdate(pos),
        (err) => console.warn('[PurchaseReminderService] Watch error:', err.message),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }
  }

  /**
   * Stop tracking
   */
  stopMonitoring() {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isWatching = false;
  }

  /**
   * Handle continuous position updates
   */
  async handlePositionUpdate(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    this.lastKnownPosition = { latitude: lat, longitude: lng, accuracy: position.coords.accuracy };

    this._notifyListeners('position_updated', this.lastKnownPosition);

    const items = purchaseService.getLocalItems();
    if (!items || items.length === 0) return;

    for (const item of items) {
      if (item.status === 'Done') continue;
      if (!this.isDateConditionValid(item)) continue;
      if (!this.canSendReminder(item)) continue;

      // 1. Specific place geofence (150m)
      if (item.locationType === 'specific' && item.latitude != null && item.longitude != null) {
        const distMeters = this.calculateDistanceMeters(lat, lng, item.latitude, item.longitude);
        if (distMeters <= 150) {
          const shopTitle = item.placeName || 'the designated shop';
          await this.triggerReminder(item, `You're near ${shopTitle}. Buy ${item.itemName}.`, 'location');
        }
      }

      // 2. Place type proximity (150m)
      if (item.locationType === 'type' && item.placeType) {
        await this.checkPlaceTypeProximity(item, lat, lng);
      }
    }
  }

  /**
   * Check nearby place types via OpenStreetMap Overpass / Nominatim
   */
  async checkPlaceTypeProximity(item, currentLat, currentLng) {
    if (this.checkingNearbyPlaces) return;
    this.checkingNearbyPlaces = true;

    try {
      // Map friendly place types to OSM amenity tags
      const tagMap = {
        'medical shop': 'amenity=pharmacy',
        'pharmacy': 'amenity=pharmacy',
        'chemist': 'amenity=pharmacy',
        'supermarket': 'shop=supermarket',
        'grocery': 'shop=convenience',
        'bakery': 'shop=bakery',
        'electronics': 'shop=electronics',
        'hardware': 'shop=hardware',
        'bookstore': 'shop=books'
      };

      const queryType = item.placeType.toLowerCase();
      let filterTag = tagMap[queryType] || `amenity=${queryType}`;

      // Search Overpass within ~200m radius
      const [key, value] = filterTag.split('=');
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:5];node[${key}=${value}](around:200,${currentLat},${currentLng});out 1;`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(overpassUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.elements && data.elements.length > 0) {
          const shop = data.elements[0];
          const dist = this.calculateDistanceMeters(currentLat, currentLng, shop.lat, shop.lon);
          if (dist <= 150) {
            const shopName = (shop.tags && (shop.tags.name || shop.tags.brand)) || item.placeType;
            await this.triggerReminder(item, `A ${item.placeType} (${shopName}) is nearby. Buy ${item.itemName}.`, 'place_type');
          }
        }
      }
    } catch (err) {
      // Non-critical, ignore network error on external OSM API
    } finally {
      this.checkingNearbyPlaces = false;
    }
  }

  /**
   * Check scheduled date/time reminders
   */
  async checkDateTimeReminders() {
    const items = purchaseService.getLocalItems();
    if (!items || items.length === 0) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    for (const item of items) {
      if (item.status === 'Done') continue;
      if (!this.isDateConditionValid(item)) continue;
      if (!this.canSendReminder(item)) continue;

      let timeDue = false;
      if (item.timeType === 'specific' && item.specificTime) {
        // Fire if within 3 minutes of scheduled time
        const [targetH, targetM] = item.specificTime.split(':').map(Number);
        const diffMinutes = Math.abs((now.getHours() * 60 + now.getMinutes()) - (targetH * 60 + targetM));
        if (diffMinutes <= 2) {
          timeDue = true;
        }
      } else if (item.timeType === 'anytime') {
        // For anytime items, fire an afternoon or morning reminder if not reminded today
        if (now.getHours() >= 9 && now.getHours() <= 20 && (!item.lastRemindedAt || !this.isSameDay(new Date(item.lastRemindedAt), now))) {
          timeDue = true;
        }
      }

      if (timeDue) {
        await this.triggerReminder(item, `Time to buy ${item.itemName}! Scheduled for today.`, 'datetime');
      }
    }
  }

  /**
   * Validate if today matches the item's scheduled date or day of week
   */
  isDateConditionValid(item) {
    const now = new Date();
    const todayYmd = now.toISOString().split('T')[0];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayOfWeek = days[now.getDay()];

    if (item.dateType === 'specific') {
      return item.specificDate === todayYmd;
    } else if (item.dateType === 'day_of_week') {
      return String(item.dayOfWeek).toLowerCase() === currentDayOfWeek;
    }
    return true;
  }

  /**
   * Check max reminders (max 3) and 30-minute cooldown
   */
  canSendReminder(item) {
    if (item.status === 'Done') return false;
    if ((item.reminderCount || 0) >= 3) return false;

    if (item.lastRemindedAt) {
      const last = new Date(item.lastRemindedAt).getTime();
      const elapsedMinutes = (Date.now() - last) / (1000 * 60);
      if (elapsedMinutes < 30) {
        return false; // Still in 30-min cooldown
      }
    }

    return true;
  }

  /**
   * Trigger local notification and update item state
   */
  async triggerReminder(item, bodyText, triggerType = 'general') {
    // Increment reminder count and save last reminded time
    await purchaseService.recordReminder(item.id);

    // Send Web Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(`STREAKO - Buy ${item.itemName}`, {
              body: bodyText,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `streako_purchase_${item.id}`,
              data: {
                url: `/purchase-list?highlight=${item.id}`,
                itemId: item.id
              }
            });
          });
        } else {
          const notif = new Notification(`STREAKO - Buy ${item.itemName}`, {
            body: bodyText,
            icon: '/favicon.ico',
            tag: `streako_purchase_${item.id}`
          });
          notif.onclick = () => {
            window.focus();
            if (window.app && window.app.router) {
              window.app.router.navigate('/purchase-list');
            }
          };
        }
      } catch (e) {
        console.warn('[PurchaseReminderService] Notification display error:', e);
      }
    }

    // Play subtle audio chime if supported
    this.playChime();

    // In-app toast notification
    if (window.showNotification) {
      window.showNotification(`🔔 ${bodyText}`, 'info');
    }

    this._notifyListeners('reminder_fired', { item, bodyText, triggerType });
  }

  /**
   * Play subtle alert sound using Web Audio API
   */
  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) { /* ignore */ }
  }

  /**
   * Haversine formula for distance in meters
   */
  calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }
}

export const purchaseReminderService = new PurchaseReminderService();
export default purchaseReminderService;
