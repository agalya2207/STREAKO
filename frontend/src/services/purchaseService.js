import api from './api.js';

const STORAGE_KEY = 'streako_purchase_items';

class PurchaseService {
  /**
   * Get all items from local cache
   */
  getLocalItems() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[PurchaseService] Local storage read error:', e);
      return [];
    }
  }

  /**
   * Save items to local cache
   */
  setLocalItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[PurchaseService] Local storage write error:', e);
    }
  }

  /**
   * Get all purchase items from backend with local fallback
   */
  async getItems() {
    try {
      const res = await api.get('/purchase-items');
      if (res && res.success && Array.isArray(res.items)) {
        this.setLocalItems(res.items);
        return res.items;
      }
    } catch (err) {
      console.warn('[PurchaseService] Backend fetch failed, using local cache:', err.message);
    }
    return this.getLocalItems();
  }

  /**
   * Create a new purchase item
   */
  async createItem(itemData) {
    let created = null;
    try {
      const res = await api.post('/purchase-items', itemData);
      if (res && res.success && res.item) {
        created = res.item;
      }
    } catch (err) {
      console.warn('[PurchaseService] Backend create failed, creating locally:', err.message);
    }

    if (!created) {
      created = {
        id: 'purch_local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        ...itemData,
        status: 'Pending',
        reminderCount: 0,
        lastRemindedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const local = this.getLocalItems();
    local.unshift(created);
    this.setLocalItems(local);
    return created;
  }

  /**
   * Update an existing purchase item
   */
  async updateItem(id, itemData) {
    let updated = null;
    try {
      const res = await api.put(`/purchase-items/${id}`, itemData);
      if (res && res.success && res.item) {
        updated = res.item;
      }
    } catch (err) {
      console.warn('[PurchaseService] Backend update failed, updating locally:', err.message);
    }

    const local = this.getLocalItems();
    const idx = local.findIndex(i => String(i.id) === String(id));
    if (idx !== -1) {
      local[idx] = {
        ...local[idx],
        ...itemData,
        updatedAt: new Date().toISOString()
      };
      this.setLocalItems(local);
      if (!updated) updated = local[idx];
    }

    return updated;
  }

  /**
   * Toggle or update item status (Pending, Reminder active, Done)
   */
  async updateStatus(id, status) {
    try {
      await api.patch(`/purchase-items/${id}/status`, { status });
    } catch (err) {
      console.warn('[PurchaseService] Backend status update failed:', err.message);
    }

    const local = this.getLocalItems();
    const item = local.find(i => String(i.id) === String(id));
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      this.setLocalItems(local);
      return item;
    }
    return { id, status };
  }

  /**
   * Record reminder trigger
   */
  async recordReminder(id) {
    const nowIso = new Date().toISOString();
    try {
      await api.post(`/purchase-items/${id}/reminder`);
    } catch (err) {
      console.warn('[PurchaseService] Backend record reminder failed:', err.message);
    }

    const local = this.getLocalItems();
    const item = local.find(i => String(i.id) === String(id));
    if (item) {
      item.reminderCount = (item.reminderCount || 0) + 1;
      item.lastRemindedAt = nowIso;
      item.status = 'Reminder active';
      this.setLocalItems(local);
      return item;
    }
    return { id, reminderCount: 1, lastRemindedAt: nowIso };
  }

  /**
   * Delete an item
   */
  async deleteItem(id) {
    try {
      await api.delete(`/purchase-items/${id}`);
    } catch (err) {
      console.warn('[PurchaseService] Backend delete failed:', err.message);
    }

    const local = this.getLocalItems().filter(i => String(i.id) !== String(id));
    this.setLocalItems(local);
    return { success: true, id };
  }
}

export const purchaseService = new PurchaseService();
export default purchaseService;
