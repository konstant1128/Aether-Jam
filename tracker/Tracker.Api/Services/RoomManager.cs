using System.Collections.Concurrent;
using Tracker.Api.Models;

namespace Tracker.Api.Services;

public class RoomManager
{
    private readonly ConcurrentDictionary<string, Room> _rooms = new();

    public Room CreateRoom(string name)
    {
        var room = new Room { Name = name };
        _rooms[room.Id] = room;
        return room;
    }

    public bool JoinRoom(string roomId, PeerInfo peer)
    {
        if(!_rooms.TryGetValue(roomId, out var room))
            return false;
        room.Peers[peer.ConnectionId] = peer;
        return true;
    }

    public bool LeaveRoom(string roomId, string connectionId)
    {
        if(!_rooms.TryGetValue(roomId, out var room))
            return false;
        room.Peers.TryRemove(connectionId, out _);
        if (room.Peers.IsEmpty)
        {
            _rooms.TryRemove(roomId, out _);
        }
        return true;
    }

    public List<Room> GetAllRooms()
    {
        return _rooms.Values.ToList();
    }

    public Room? GetRoom(string roomId)
    {
        _rooms.TryGetValue(roomId, out var room);
        return room;
    }

    public List<PeerInfo> GetPeersInRoom(string roomId)
    {
        if (!_rooms.TryGetValue(roomId, out var room))
            return new List<PeerInfo>();

        return room.Peers.Values.ToList();
    }
}