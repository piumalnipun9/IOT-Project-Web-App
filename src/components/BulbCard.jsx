import React, { useState } from 'react';
import { Lightbulb, Power, Trash2, Edit2, Clock, Signal } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';
import { useBulbs } from '../hooks/useBulbs';
import { BULB_STATES } from '../utils/constants';

export default function BulbCard({ bulb }) {
  const { toggleBulb, setBrightness, deleteBulb, updateBulb } = useBulbs();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(bulb.name);
  const [brightness, setBrightnessLocal] = useState(bulb.brightness || 100);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOn = bulb.state === BULB_STATES.ON;

  const handleToggle = async () => {
    try {
      await toggleBulb(bulb.bulb_id);
    } catch (error) {
      console.error('Failed to toggle bulb:', error);
    }
  };

  const handleBrightnessChange = (e) => {
    const value = parseInt(e.target.value);
    setBrightnessLocal(value);
  };

  const handleBrightnessCommit = async () => {
    try {
      await setBrightness(bulb.bulb_id, brightness);
    } catch (error) {
      console.error('Failed to set brightness:', error);
    }
  };

  const handleNameSave = async () => {
    try {
      await updateBulb(bulb.bulb_id, { name });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update bulb name:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${bulb.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBulb(bulb.bulb_id);
    } catch (error) {
      console.error('Failed to delete bulb:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className={`card transition-all duration-200 hover:shadow-lg ${isDeleting ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Bulb Icon */}
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isOn 
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
          }`}>
            <Lightbulb className={`w-6 h-6 ${isOn ? 'fill-current' : ''}`} />
          </div>

          {/* Bulb Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field py-1 px-2 text-sm"
                  onBlur={handleNameSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {bulb.name}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Edit name"
                >
                  <Edit2 className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {bulb.bulb_id}
              </span>
              {bulb.room && (
                <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                  {bulb.room}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
          title="Delete bulb"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Power Toggle */}
      <button
        onClick={handleToggle}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          isOn
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md'
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
        }`}
      >
        <Power className="w-4 h-4" />
        <span>{isOn ? 'ON' : 'OFF'}</span>
      </button>

      {/* Brightness Slider (only if bulb is on) */}
      {isOn && bulb.brightness !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Brightness</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={handleBrightnessChange}
            onMouseUp={handleBrightnessCommit}
            onTouchEnd={handleBrightnessCommit}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      )}

      {/* Status Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(bulb.last_updated)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Signal className={`w-3 h-3 ${bulb.is_online ? 'text-green-500' : 'text-gray-400'}`} />
          <span>{bulb.is_online ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
}
