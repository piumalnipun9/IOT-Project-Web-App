import { useCallback } from 'react';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import mqttService from '../services/mqttService';
import { saveBulb as dbSaveBulb, deleteBulb as dbDeleteBulb, addHistoryEntry } from '../services/dbService';
import { BULB_STATES } from '../utils/constants';

export function useBulbs() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  // Get all bulbs as array
  const bulbs = Object.values(state.bulbs);

  // Get filtered and sorted bulbs
  const getFilteredBulbs = useCallback(() => {
    let filtered = bulbs;

    // Filter by room
    if (state.ui.filterRoom) {
      filtered = filtered.filter(bulb => bulb.room === state.ui.filterRoom);
    }

    // Filter offline bulbs if needed
    if (!state.ui.showOfflineBulbs) {
      filtered = filtered.filter(bulb => bulb.is_online);
    }

    // Sort
    filtered.sort((a, b) => {
      if (state.ui.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (state.ui.sortBy === 'last_updated') {
        return new Date(b.last_updated) - new Date(a.last_updated);
      }
      return 0;
    });

    return filtered;
  }, [bulbs, state.ui.filterRoom, state.ui.showOfflineBulbs, state.ui.sortBy]);

  // Get bulbs grouped by room
  const getBulbsByRoom = useCallback(() => {
    const grouped = {};
    bulbs.forEach(bulb => {
      const room = bulb.room || 'Uncategorized';
      if (!grouped[room]) {
        grouped[room] = [];
      }
      grouped[room].push(bulb);
    });
    return grouped;
  }, [bulbs]);

  // Get single bulb
  const getBulb = useCallback((bulbId) => {
    return state.bulbs[bulbId];
  }, [state.bulbs]);

  // Add bulb
  const addBulb = useCallback(async (bulbData) => {
    const newBulb = {
      bulb_id: bulbData.bulb_id,
      name: bulbData.name || bulbData.bulb_id,
      state: BULB_STATES.OFF,
      brightness: 100,
      color: '#FFFFFF',
      room: bulbData.room || null,
      is_online: false,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      last_seen: null
    };

    // Save to IndexedDB
    await dbSaveBulb(newBulb);

    // Update state
    dispatch(actions.addBulb(newBulb));

    // Subscribe to MQTT topics
    if (mqttService.isConnected()) {
      mqttService.subscribeToBulbState(newBulb.bulb_id);
      mqttService.subscribeToBulbStatus(newBulb.bulb_id);
    }

    // Add to history
    await addHistoryEntry({
      bulb_id: newBulb.bulb_id,
      action: 'BULB_ADDED',
      source: 'user'
    });

    return newBulb;
  }, [dispatch]);

  // Update bulb
  const updateBulb = useCallback(async (bulbId, updates) => {
    // Save to IndexedDB
    await dbSaveBulb({
      ...state.bulbs[bulbId],
      ...updates
    });

    // Update state
    dispatch(actions.updateBulb({
      bulb_id: bulbId,
      ...updates
    }));
  }, [state.bulbs, dispatch]);

  // Delete bulb
  const deleteBulb = useCallback(async (bulbId) => {
    // Unsubscribe from MQTT topics
    if (mqttService.isConnected()) {
      mqttService.unsubscribeFromBulb(bulbId);
    }

    // Delete from IndexedDB
    await dbDeleteBulb(bulbId);

    // Update state
    dispatch(actions.deleteBulb(bulbId));

    // Add to history
    await addHistoryEntry({
      bulb_id: bulbId,
      action: 'BULB_REMOVED',
      source: 'user'
    });
  }, [dispatch]);

  // Toggle bulb power
  const toggleBulb = useCallback(async (bulbId) => {
    const bulb = state.bulbs[bulbId];
    if (!bulb) return;

    const newState = bulb.state === BULB_STATES.ON ? BULB_STATES.OFF : BULB_STATES.ON;

    // Optimistic update
    dispatch(actions.toggleBulbOptimistic(bulbId));

    try {
      // Send MQTT command
      await mqttService.controlPower(bulbId, newState);

      // Add to history
      await addHistoryEntry({
        bulb_id: bulbId,
        action: newState,
        source: 'user'
      });
    } catch (error) {
      console.error('Failed to toggle bulb:', error);
      // Revert optimistic update
      dispatch(actions.toggleBulbOptimistic(bulbId));
      throw error;
    }
  }, [state.bulbs, dispatch]);

  // Set brightness
  const setBrightness = useCallback(async (bulbId, brightness) => {
    const bulb = state.bulbs[bulbId];
    if (!bulb) return;

    // Optimistic update
    dispatch(actions.updateBulb({
      bulb_id: bulbId,
      brightness
    }));

    try {
      // Send MQTT command
      await mqttService.controlBrightness(bulbId, brightness);

      // Add to history
      await addHistoryEntry({
        bulb_id: bulbId,
        action: 'BRIGHTNESS_CHANGE',
        source: 'user',
        data: { brightness }
      });
    } catch (error) {
      console.error('Failed to set brightness:', error);
      throw error;
    }
  }, [state.bulbs, dispatch]);

  // Set color
  const setColor = useCallback(async (bulbId, color) => {
    const bulb = state.bulbs[bulbId];
    if (!bulb) return;

    // Optimistic update
    dispatch(actions.updateBulb({
      bulb_id: bulbId,
      color
    }));

    try {
      // Send MQTT command
      await mqttService.controlColor(bulbId, color);

      // Add to history
      await addHistoryEntry({
        bulb_id: bulbId,
        action: 'COLOR_CHANGE',
        source: 'user',
        data: { color }
      });
    } catch (error) {
      console.error('Failed to set color:', error);
      throw error;
    }
  }, [state.bulbs, dispatch]);

  // Control all bulbs
  const controlAllBulbs = useCallback(async (state) => {
    try {
      await mqttService.controlAllBulbs(state);
      
      // Add to history
      await addHistoryEntry({
        bulb_id: 'all',
        action: state,
        source: 'user'
      });
    } catch (error) {
      console.error('Failed to control all bulbs:', error);
      throw error;
    }
  }, []);

  return {
    bulbs,
    getBulb,
    getFilteredBulbs,
    getBulbsByRoom,
    addBulb,
    updateBulb,
    deleteBulb,
    toggleBulb,
    setBrightness,
    setColor,
    controlAllBulbs,
    isLoading: state.isLoading
  };
}
