import React, { useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useBulbs } from '../hooks/useBulbs';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import BulbCard from './BulbCard';

export default function BulbList() {
  const { bulbs, getBulbsByRoom, isLoading } = useBulbs();
  const { ui } = useAppState();
  const dispatch = useAppDispatch();

  const [searchQuery, setSearchQuery] = React.useState('');

  // Group bulbs by room
  const bulbsByRoom = useMemo(() => getBulbsByRoom(), [getBulbsByRoom]);

  // Filter bulbs based on search query
  const filteredBulbsByRoom = useMemo(() => {
    if (!searchQuery) return bulbsByRoom;

    const filtered = {};
    Object.entries(bulbsByRoom).forEach(([room, roomBulbs]) => {
      const matchingBulbs = roomBulbs.filter(bulb =>
        bulb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bulb.bulb_id.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingBulbs.length > 0) {
        filtered[room] = matchingBulbs;
      }
    });

    return filtered;
  }, [bulbsByRoom, searchQuery]);

  // Filter offline bulbs if needed
  const displayBulbsByRoom = useMemo(() => {
    if (ui.showOfflineBulbs) return filteredBulbsByRoom;

    const filtered = {};
    Object.entries(filteredBulbsByRoom).forEach(([room, roomBulbs]) => {
      const onlineBulbs = roomBulbs.filter(bulb => bulb.is_online);
      if (onlineBulbs.length > 0) {
        filtered[room] = onlineBulbs;
      }
    });

    return filtered;
  }, [filteredBulbsByRoom, ui.showOfflineBulbs]);

  const totalBulbs = bulbs.length;
  const onlineBulbs = bulbs.filter(b => b.is_online).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading bulbs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search bulbs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Stats and Filter */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{totalBulbs}</span> bulbs
            {' · '}
            <span className="font-semibold text-green-600">{onlineBulbs}</span> online
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ui.showOfflineBulbs}
              onChange={(e) => dispatch(actions.setUIState({ showOfflineBulbs: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show offline</span>
          </label>
        </div>
      </div>

      {/* Bulb Cards by Room */}
      {totalBulbs === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💡</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No bulbs yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add your first IoT bulb to get started
          </p>
          <button
            onClick={() => dispatch(actions.setUIState({ isAddDialogOpen: true }))}
            className="btn-primary"
          >
            Add Bulb
          </button>
        </div>
      ) : Object.keys(displayBulbsByRoom).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? 'No bulbs match your search' : 'No online bulbs'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(displayBulbsByRoom)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([room, roomBulbs]) => (
              <div key={room}>
                {/* Room Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {room}
                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({roomBulbs.length})
                    </span>
                  </h2>
                </div>

                {/* Bulb Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {roomBulbs.map((bulb) => (
                    <BulbCard key={bulb.bulb_id} bulb={bulb} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
