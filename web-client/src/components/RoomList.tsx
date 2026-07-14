import { useState, useEffect } from 'react';
import { trackerClient } from '../network/TrackerClient';
import { useStore } from '../store/useStore';

export function RoomList() {
  const { isConnected, currentRoom, peers } = useStore();
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState('');

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
    if (!newRoomName.trim()) return;
    try {
      const room = await trackerClient.createRoom(newRoomName);
      await trackerClient.joinRoom(room.id, 'User_' + Math.random().toString(36).substr(2, 5), 'synth');
      useStore.getState().setCurrentRoom(room);
      setNewRoomName('');
      loadRooms();
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      await trackerClient.joinRoom(roomId, 'User_' + Math.random().toString(36).substr(2, 5), 'synth');
      const room = rooms.find(r => r.id === roomId);
      useStore.getState().setCurrentRoom(room);
    } catch (err) {
      console.error('Failed to join room:', err);
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
    return <div className="room-list">Not connected to tracker</div>;
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
              placeholder="Room name"
              onKeyPress={(e) => e.key === 'Enter' && createRoom()}
            />
            <button onClick={createRoom}>Create</button>
          </div>

          <ul className="rooms">
            {rooms.map((room) => (
              <li key={room.id}>
                <span>{room.name} ({room.peers?.length || 0} peers)</span>
                <button onClick={() => joinRoom(room.id)}>Join</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="current-room">
          <h3>In room: {currentRoom.name}</h3>
          <h4>Peers ({peers.length}):</h4>
          <ul>
            {peers.map((peer) => (
              <li key={peer.connectionId}>
                {peer.displayName} ({peer.instrument})
              </li>
            ))}
          </ul>
          <button onClick={leaveRoom}>Leave</button>
        </div>
      )}
    </div>
  );
}