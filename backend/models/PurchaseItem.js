/**
 * PurchaseItem Model
 * Represents a real shopping reminder item with location and date/time triggers.
 */
class PurchaseItem {
  constructor({
    id,
    userId,
    itemName,
    locationType = 'specific', // 'specific' | 'type'
    placeName = '',
    placeType = '',
    latitude = null,
    longitude = null,
    address = '',
    dateType = 'specific', // 'specific' | 'day_of_week'
    specificDate = null,
    dayOfWeek = null, // 'monday' ... 'sunday'
    timeType = 'anytime', // 'specific' | 'anytime'
    specificTime = null,
    repeatType = 'once', // 'once' | 'weekly'
    status = 'Pending', // 'Pending' | 'Reminder active' | 'Done'
    reminderCount = 0,
    lastRemindedAt = null,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.userId = userId;
    this.itemName = itemName;
    this.locationType = locationType;
    this.placeName = placeName;
    this.placeType = placeType;
    this.latitude = latitude !== null && latitude !== undefined ? Number(latitude) : null;
    this.longitude = longitude !== null && longitude !== undefined ? Number(longitude) : null;
    this.address = address;
    this.dateType = dateType;
    this.specificDate = specificDate;
    this.dayOfWeek = dayOfWeek;
    this.timeType = timeType;
    this.specificTime = specificTime;
    this.repeatType = repeatType;
    this.status = status;
    this.reminderCount = Number(reminderCount) || 0;
    this.lastRemindedAt = lastRemindedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static validate(data) {
    const errors = [];
    if (!data.itemName || !data.itemName.trim()) {
      errors.push('Item name is required.');
    }

    if (data.locationType === 'specific') {
      if (!data.placeName && (data.latitude == null || data.longitude == null)) {
        errors.push('Please select a specific place or switch to place type.');
      }
    } else if (data.locationType === 'type') {
      if (!data.placeType || !data.placeType.trim()) {
        errors.push('Please select or specify a place type.');
      }
    }

    if (data.dateType === 'specific') {
      if (!data.specificDate) {
        errors.push('Please provide a specific date.');
      }
    } else if (data.dateType === 'day_of_week') {
      if (!data.dayOfWeek) {
        errors.push('Please specify the day of the week.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      itemName: this.itemName,
      locationType: this.locationType,
      placeName: this.placeName,
      placeType: this.placeType,
      latitude: this.latitude,
      longitude: this.longitude,
      address: this.address,
      dateType: this.dateType,
      specificDate: this.specificDate,
      dayOfWeek: this.dayOfWeek,
      timeType: this.timeType,
      specificTime: this.specificTime,
      repeatType: this.repeatType,
      status: this.status,
      reminderCount: this.reminderCount,
      lastRemindedAt: this.lastRemindedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = PurchaseItem;
