import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from '../utils/constants';

let dbPromise = null;

/**
 * Initialize IndexedDB database
 */
export async function initDB() {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create bulbs store
      if (!db.objectStoreNames.contains(STORES.BULBS)) {
        const bulbStore = db.createObjectStore(STORES.BULBS, { 
          keyPath: 'bulb_id' 
        });
        bulbStore.createIndex('room', 'room', { unique: false });
        bulbStore.createIndex('last_updated', 'last_updated', { unique: false });
        bulbStore.createIndex('is_online', 'is_online', { unique: false });
      }
      
      // Create settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
      
      // Create history store
      if (!db.objectStoreNames.contains(STORES.HISTORY)) {
        const historyStore = db.createObjectStore(STORES.HISTORY, { 
          keyPath: 'id',
          autoIncrement: true 
        });
        historyStore.createIndex('bulb_id', 'bulb_id', { unique: false });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    }
  });
  
  return dbPromise;
}

// ============= BULB OPERATIONS =============

/**
 * Save or update a bulb
 */
export async function saveBulb(bulb) {
  const db = await initDB();
  const now = new Date().toISOString();
  
  const bulbData = {
    ...bulb,
    last_updated: now,
    created_at: bulb.created_at || now
  };
  
  return db.put(STORES.BULBS, bulbData);
}

/**
 * Get a single bulb by ID
 */
export async function getBulb(bulb_id) {
  const db = await initDB();
  return db.get(STORES.BULBS, bulb_id);
}

/**
 * Get all bulbs
 */
export async function getAllBulbs() {
  const db = await initDB();
  return db.getAll(STORES.BULBS);
}

/**
 * Get bulbs by room
 */
export async function getBulbsByRoom(room) {
  const db = await initDB();
  const index = db.transaction(STORES.BULBS).store.index('room');
  return index.getAll(room);
}

/**
 * Update bulb state
 */
export async function updateBulbState(bulb_id, stateUpdate) {
  const db = await initDB();
  const bulb = await db.get(STORES.BULBS, bulb_id);
  
  if (!bulb) {
    throw new Error(`Bulb ${bulb_id} not found`);
  }
  
  const updatedBulb = {
    ...bulb,
    ...stateUpdate,
    last_updated: new Date().toISOString()
  };
  
  return db.put(STORES.BULBS, updatedBulb);
}

/**
 * Delete a bulb
 */
export async function deleteBulb(bulb_id) {
  const db = await initDB();
  return db.delete(STORES.BULBS, bulb_id);
}

/**
 * Delete all bulbs
 */
export async function deleteAllBulbs() {
  const db = await initDB();
  const tx = db.transaction(STORES.BULBS, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

/**
 * Check if bulb exists
 */
export async function bulbExists(bulb_id) {
  const bulb = await getBulb(bulb_id);
  return bulb !== undefined;
}

// ============= SETTINGS OPERATIONS =============

/**
 * Save a setting
 */
export async function saveSetting(key, value) {
  const db = await initDB();
  return db.put(STORES.SETTINGS, { key, value });
}

/**
 * Get a setting
 */
export async function getSetting(key) {
  const db = await initDB();
  const record = await db.get(STORES.SETTINGS, key);
  return record ? record.value : null;
}

/**
 * Get all settings
 */
export async function getAllSettings() {
  const db = await initDB();
  const records = await db.getAll(STORES.SETTINGS);
  
  // Convert array of {key, value} to object
  return records.reduce((acc, record) => {
    acc[record.key] = record.value;
    return acc;
  }, {});
}

/**
 * Save multiple settings at once
 */
export async function saveSettings(settingsObj) {
  const db = await initDB();
  const tx = db.transaction(STORES.SETTINGS, 'readwrite');
  
  for (const [key, value] of Object.entries(settingsObj)) {
    await tx.store.put({ key, value });
  }
  
  await tx.done;
}

/**
 * Delete a setting
 */
export async function deleteSetting(key) {
  const db = await initDB();
  return db.delete(STORES.SETTINGS, key);
}

/**
 * Clear all settings
 */
export async function clearSettings() {
  const db = await initDB();
  const tx = db.transaction(STORES.SETTINGS, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

// ============= HISTORY OPERATIONS =============

/**
 * Add history entry
 */
export async function addHistoryEntry(entry) {
  const db = await initDB();
  const historyEntry = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  
  return db.add(STORES.HISTORY, historyEntry);
}

/**
 * Get history for a specific bulb
 */
export async function getBulbHistory(bulb_id, limit = 50) {
  const db = await initDB();
  const index = db.transaction(STORES.HISTORY).store.index('bulb_id');
  const entries = await index.getAll(bulb_id);
  
  // Sort by timestamp descending and limit
  return entries
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Get all history entries
 */
export async function getAllHistory(limit = 100) {
  const db = await initDB();
  const entries = await db.getAll(STORES.HISTORY);
  
  return entries
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Clear history older than specified days
 */
export async function clearOldHistory(days = 30) {
  const db = await initDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffISO = cutoffDate.toISOString();
  
  const tx = db.transaction(STORES.HISTORY, 'readwrite');
  const index = tx.store.index('timestamp');
  let cursor = await index.openCursor();
  
  while (cursor) {
    if (cursor.value.timestamp < cutoffISO) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
  
  await tx.done;
}

/**
 * Clear all history
 */
export async function clearAllHistory() {
  const db = await initDB();
  const tx = db.transaction(STORES.HISTORY, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

// ============= DATABASE MANAGEMENT =============

/**
 * Get database storage usage estimate
 */
export async function getStorageUsage() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  }
  return null;
}

/**
 * Clear all data from database
 */
export async function clearAllData() {
  await deleteAllBulbs();
  await clearSettings();
  await clearAllHistory();
}

/**
 * Export all data as JSON
 */
export async function exportData() {
  const bulbs = await getAllBulbs();
  const settings = await getAllSettings();
  const history = await getAllHistory();
  
  return {
    bulbs,
    settings,
    history,
    exportDate: new Date().toISOString(),
    version: DB_VERSION
  };
}

/**
 * Import data from JSON
 */
export async function importData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data');
  }
  
  // Import bulbs
  if (Array.isArray(data.bulbs)) {
    for (const bulb of data.bulbs) {
      await saveBulb(bulb);
    }
  }
  
  // Import settings
  if (data.settings && typeof data.settings === 'object') {
    await saveSettings(data.settings);
  }
  
  // Import history
  if (Array.isArray(data.history)) {
    for (const entry of data.history) {
      await addHistoryEntry(entry);
    }
  }
  
  return {
    bulbsImported: data.bulbs?.length || 0,
    settingsImported: Object.keys(data.settings || {}).length,
    historyImported: data.history?.length || 0
  };
}
