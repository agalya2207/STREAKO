const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');
const PurchaseItem = require('../models/PurchaseItem');

const LOCAL_DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'purchase_items.json');

// Ensure local persistence directory exists
if (!fs.existsSync(LOCAL_DATA_DIR)) {
  try {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('[PurchaseService] Failed to create data dir:', e.message);
  }
}

class PurchaseService {
  constructor() {
    this.useSupabase = true;
  }

  _readLocal() {
    try {
      if (fs.existsSync(LOCAL_DATA_FILE)) {
        const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[PurchaseService] Error reading local file:', e.message);
    }
    return [];
  }

  _writeLocal(items) {
    try {
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
    } catch (e) {
      console.warn('[PurchaseService] Error writing local file:', e.message);
    }
  }

  /**
   * Normalize db row to PurchaseItem instance
   */
  _mapFromDb(row) {
    return new PurchaseItem({
      id: row.id,
      userId: row.user_id,
      itemName: row.item_name,
      locationType: row.location_type || 'specific',
      placeName: row.place_name || '',
      placeType: row.place_type || '',
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address || '',
      dateType: row.date_type || 'specific',
      specificDate: row.specific_date,
      dayOfWeek: row.day_of_week,
      timeType: row.time_type || 'anytime',
      specificTime: row.specific_time,
      repeatType: row.repeat_type || 'once',
      status: row.status || 'Pending',
      reminderCount: row.reminder_count || 0,
      lastRemindedAt: row.last_reminded_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Map domain item to Supabase table row
   */
  _mapToDb(userId, item) {
    return {
      user_id: userId,
      item_name: item.itemName,
      location_type: item.locationType,
      place_name: item.placeName,
      place_type: item.placeType,
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.address,
      date_type: item.dateType,
      specific_date: item.specificDate || null,
      day_of_week: item.dayOfWeek || null,
      time_type: item.timeType,
      specific_time: item.specificTime || null,
      repeat_type: item.repeatType,
      status: item.status || 'Pending',
      reminder_count: item.reminderCount || 0,
      last_reminded_at: item.lastRemindedAt || null,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Get all purchase items for a user
   */
  async getItems(userId) {
    if (this.useSupabase) {
      try {
        let query = supabase.from('purchase_items').select('*').order('created_at', { ascending: false });
        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(row => this._mapFromDb(row));
        } else if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
          // Table doesn't exist yet in Supabase
          this.useSupabase = false;
        } else if (error) {
          console.warn('[PurchaseService] Supabase query notice:', error.message);
        }
      } catch (err) {
        console.warn('[PurchaseService] Supabase fallback triggered:', err.message);
        this.useSupabase = false;
      }
    }

    // Fallback to resilient local JSON persistence
    const localItems = this._readLocal();
    const userItems = userId 
      ? localItems.filter(i => !i.userId || i.userId === userId)
      : localItems;
    return userItems.map(item => new PurchaseItem(item));
  }

  /**
   * Create a new purchase item
   */
  async createItem(userId, data) {
    const validation = PurchaseItem.validate(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    const payload = new PurchaseItem({
      ...data,
      userId: userId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (this.useSupabase) {
      try {
        const dbRow = this._mapToDb(userId, payload);
        const { data: inserted, error } = await supabase
          .from('purchase_items')
          .insert([dbRow])
          .select()
          .single();

        if (!error && inserted) {
          const created = this._mapFromDb(inserted);
          // Mirror to local
          const local = this._readLocal();
          local.unshift(created.toJSON());
          this._writeLocal(local);
          return created;
        } else if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
          this.useSupabase = false;
        } else if (error) {
          console.warn('[PurchaseService] Supabase insert warning:', error.message);
        }
      } catch (err) {
        this.useSupabase = false;
      }
    }

    // Local file fallback
    const id = 'purch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const created = new PurchaseItem({
      ...payload.toJSON(),
      id
    });
    const local = this._readLocal();
    local.unshift(created.toJSON());
    this._writeLocal(local);
    return created;
  }

  /**
   * Update an existing purchase item
   */
  async updateItem(userId, itemId, data) {
    const validation = PurchaseItem.validate(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    let updated = null;

    if (this.useSupabase) {
      try {
        const dbRow = this._mapToDb(userId, data);
        const { data: result, error } = await supabase
          .from('purchase_items')
          .update(dbRow)
          .eq('id', itemId)
          .select()
          .single();

        if (!error && result) {
          updated = this._mapFromDb(result);
        }
      } catch (err) {
        console.warn('[PurchaseService] Supabase update warning:', err.message);
      }
    }

    // Update in local file
    const local = this._readLocal();
    const idx = local.findIndex(i => String(i.id) === String(itemId));
    if (idx !== -1) {
      local[idx] = {
        ...local[idx],
        ...data,
        updatedAt: new Date().toISOString()
      };
      this._writeLocal(local);
      if (!updated) {
        updated = new PurchaseItem(local[idx]);
      }
    }

    if (!updated) {
      const err = new Error('Purchase item not found.');
      err.statusCode = 404;
      throw err;
    }

    return updated;
  }

  /**
   * Toggle or update item status (Pending, Reminder active, Done)
   */
  async updateStatus(userId, itemId, status) {
    const validStatuses = ['Pending', 'Reminder active', 'Done'];
    if (!validStatuses.includes(status)) {
      const err = new Error('Invalid status: ' + status);
      err.statusCode = 400;
      throw err;
    }

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'Done') {
      // Done items stop reminders
      updates.status = 'Done';
    }

    if (this.useSupabase) {
      try {
        await supabase
          .from('purchase_items')
          .update(updates)
          .eq('id', itemId);
      } catch (e) { /* ignore */ }
    }

    const local = this._readLocal();
    const item = local.find(i => String(i.id) === String(itemId));
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      this._writeLocal(local);
      return new PurchaseItem(item);
    }

    return { id: itemId, status };
  }

  /**
   * Record a reminder occurrence (increment count and record timestamp)
   */
  async recordReminder(userId, itemId) {
    const nowIso = new Date().toISOString();
    let currentCount = 0;

    const local = this._readLocal();
    const item = local.find(i => String(i.id) === String(itemId));
    if (item) {
      item.reminderCount = (item.reminderCount || 0) + 1;
      item.lastRemindedAt = nowIso;
      item.status = 'Reminder active';
      item.updatedAt = nowIso;
      this._writeLocal(local);
      currentCount = item.reminderCount;
    }

    if (this.useSupabase) {
      try {
        await supabase
          .from('purchase_items')
          .update({
            reminder_count: currentCount,
            last_reminded_at: nowIso,
            status: 'Reminder active',
            updated_at: nowIso
          })
          .eq('id', itemId);
      } catch (e) { /* ignore */ }
    }

    return { id: itemId, reminderCount: currentCount, lastRemindedAt: nowIso };
  }

  /**
   * Delete an item
   */
  async deleteItem(userId, itemId) {
    if (this.useSupabase) {
      try {
        await supabase
          .from('purchase_items')
          .delete()
          .eq('id', itemId);
      } catch (e) { /* ignore */ }
    }

    const local = this._readLocal();
    const filtered = local.filter(i => String(i.id) !== String(itemId));
    this._writeLocal(filtered);
    return { success: true, id: itemId };
  }
}

module.exports = new PurchaseService();
