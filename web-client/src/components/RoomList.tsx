import { useState, useEffect } from 'react';
import { trackerClient } from '../network/TrackerClient';
import { useStore } from '../store/useStore';
import { audioEngine } from '../audio/AudioEngine';

export function RoomList() {
  const { isConnected, currentRoom, peers } = useStore();
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadRooms();
    }
  }, [isConnected]);

  const loadRooms = async () => {
    try {
      const roomsList = await trackerClient.getRooms();
      setRooms(roomsList);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    // Инициализируем аудио при первом действии пользователя
    audioEngine.init();

    setIsCreating(true);
    try {
      const room = await trackerClient.createRoom(newRoomName);
      const displayName = 'User_' + Math.random().toString(36).substr(2, 5);
      await trackerClient.joinRoom(room.id, displayName, 'synth');
      
      useStore.getState().setCurrentRoom(room);
      setNewRoomName('');
      loadRooms();
      
      console.log('Room created:', room);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    // Инициализируем аудио при первом действии пользователя
    audioEngine.init();

    try {
      const displayName = 'User_' + Math.random().toString(36).substr(2, 5);
      await trackerClient.joinRoom(roomId, displayName, 'synth');
      
      const room = rooms.find(r => r.id === roomId);
      useStore.getState().setCurrentRoom(room);
      
      console.log('Joined room:', room);
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('Failed to join room. Please try again.');
    }
  };

  const leaveRoom = async () => {
    if (currentRoom) {
      await trackerClient.leaveRoom(currentRoom.id);
      useStore.getState().setCurrentRoom(null);
      loadRooms();
    }
  };

  if (!isConnected) {
    return (
      <div className="room-list">
        <div className="status-message">
          <p>🔴 Not connected to tracker</p>
          <p style={{ fontSize: '12px', color: '#888' }}>
            Make sure the tracker is running on http://localhost:5201
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="room-list">
      <h2>Rooms</h2>
      
      {!currentRoom ? (
        <>
          <div className="create-room">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name..."
              onKeyPress={(e) => e.key === 'Enter' && createRoom()}
              disabled={isCreating}
            />
            <button 
              onClick={createRoom} 
              disabled={isCreating || !newRoomName.trim()}
              className="create-button"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No rooms yet. Create one!</p>
            </div>
          ) : (
            <ul className="rooms">
              {rooms.map((room) => (
                <li key={room.id}>
                  <div className="room-info">
                    <span className="room-name">{room.name}</span>
                    <span className="room-peers">
                      👥 {room.peers?.length || 0} peers
                    </span>
                  </div>
                  <button 
                    onClick={() => joinRoom(room.id)}
                    className="join-button"
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="current-room">
          <div className="room-header">
            <h3>🎵 {currentRoom.name}</h3>
            <button onClick={leaveRoom} className="leave-button">
              Leave
            </button>
          </div>
          
          <div className="peers-list">
            <h4>Participants ({peers.length}):</h4>
            {peers.length === 0 ? (
              <p className="no-peers">You're alone here. Invite someone!</p>
            ) : (
              <ul>
                {peers.map((peer) => (
                  <li key={peer.connectionId} className="peer-item">
                    <span className="peer-name">{peer.displayName}</span>
                    <span className="peer-instrument">
                      🎹 {peer.instrument}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="room-hint">
            <p>💡 Play with keyboard: <b>A S D F G H J K</b></p>
          </div>
        </div>
      )}
    </div>
  );
}