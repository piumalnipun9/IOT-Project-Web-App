import React, { useState } from 'react';
import { X, Plus, Loader2, Search } from 'lucide-react';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import { useBulbs } from '../hooks/useBulbs';
import { useMQTT } from '../hooks/useMQTT';
import { validateBulbId, sanitizeInput } from '../utils/validators';
import { bulbExists } from '../services/dbService';

export default function AddBulbDialog() {
  const { ui } = useAppState();
  const dispatch = useAppDispatch();
  const { addBulb } = useBulbs();
  const { discoverBulbs } = useMQTT();

  const [formData, setFormData] = useState({
    bulb_id: '',
    name: '',
    room: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const handleClose = () => {
    dispatch(actions.setUIState({ isAddDialogOpen: false }));
    setFormData({ bulb_id: '', name: '', room: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate bulb ID
    const validation = validateBulbId(formData.bulb_id);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Check if bulb already exists
    const exists = await bulbExists(formData.bulb_id);
    if (exists) {
      setError('A bulb with this ID already exists');
      return;
    }

    setIsSubmitting(true);

    try {
      await addBulb({
        bulb_id: sanitizeInput(formData.bulb_id),
        name: sanitizeInput(formData.name) || formData.bulb_id,
        room: sanitizeInput(formData.room) || null
      });

      handleClose();
    } catch (err) {
      console.error('Failed to add bulb:', err);
      setError('Failed to add bulb. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setError('');

    try {
      await discoverBulbs();
      // In a real implementation, discovered bulbs would be shown here
      setError('Discovery request sent. Check your gateway for responses.');
    } catch (err) {
      console.error('Failed to discover bulbs:', err);
      setError('Failed to discover bulbs. Make sure you are connected to MQTT.');
    } finally {
      setIsDiscovering(false);
    }
  };

  if (!ui.isAddDialogOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add New Bulb
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Bulb ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bulb ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.bulb_id}
              onChange={(e) => setFormData({ ...formData, bulb_id: e.target.value })}
              className="input-field"
              placeholder="e.g., bulb_001"
              required
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Unique identifier for the bulb (letters, numbers, - and _ only)
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., Living Room Lamp"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Friendly name for the bulb (optional)
            </p>
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Room
            </label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="input-field"
              placeholder="e.g., Living Room"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Room or location (optional)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Discovery Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Or discover bulbs automatically:
            </p>
            <button
              type="button"
              onClick={handleDiscover}
              disabled={isDiscovering || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isDiscovering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{isDiscovering ? 'Discovering...' : 'Scan Network'}</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.bulb_id}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Bulb</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
