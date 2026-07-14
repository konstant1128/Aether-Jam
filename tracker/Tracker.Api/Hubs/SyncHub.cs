using Microsoft.AspNetCore.SignalR;
using Tracker.Api.Models;
using Tracker.Api.Services;

namespace Tracker.Api.Hubs;

public class SyncHub : Hub
{
    private readonly RoomManager _roomManager;

    public SyncHub(RoomManager roomManager)
    {
        _roomManager = roomManager;
    }

    public async Task<Room> CreateRoom(string roomName)
    {
        var room = _roomManager.CreateRoom(roomName);
        await Clients.Caller.SendAsync("RoomCreated", room);
        return room;
    }

    public async Task<bool> JoinRoom(string roomId, string displayName, string instrument)
    {
        var peer = new PeerInfo
        {
            ConnectionId = Context.ConnectionId,
            DisplayName = displayName,
            Instrument = instrument
        };

        var success = _roomManager.JoinRoom(roomId, peer);
        
        if (success)
        {
            // Уведомляем всех в комнате о новом участнике
            await Clients.Group(roomId).SendAsync("PeerJoined", peer);
            
            // Добавляем соединение в группу комнаты
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            
            // Отправляем текущему клиенту список уже подключенных пиров
            var peers = _roomManager.GetPeersInRoom(roomId);
            await Clients.Caller.SendAsync("CurrentPeers", peers);
        }
        
        return success;
    }

    // Покинуть комнату
    public async Task LeaveRoom(string roomId)
    {
        _roomManager.LeaveRoom(roomId, Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId).SendAsync("PeerLeft", Context.ConnectionId);
    }

    public List<Room> GetRooms()
    {
        return _roomManager.GetAllRooms();
    }

    public async Task ExchangeSDP(string targetConnectionId, string sdp)
    {
        await Clients.Client(targetConnectionId).SendAsync("SDPReceived", Context.ConnectionId, sdp);
    }

    public async Task ExchangeICE(string targetConnectionId, string candidate)
    {
        await Clients.Client(targetConnectionId).SendAsync("ICEReceived", Context.ConnectionId, candidate);
    }

    public async Task BroadcastParam(string roomId, string paramId, float value)
    {
        await Clients.Group(roomId).SendAsync("ParamChanged", Context.ConnectionId, paramId, value);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Находим все комнаты, где был этот клиент, и удаляем его
        var rooms = _roomManager.GetAllRooms();
        foreach (var room in rooms)
        {
            if (room.Peers.ContainsKey(Context.ConnectionId))
            {
                _roomManager.LeaveRoom(room.Id, Context.ConnectionId);
                await Clients.Group(room.Id).SendAsync("PeerLeft", Context.ConnectionId);
            }
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}