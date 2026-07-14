using System.Collections.Concurrent;

namespace Tracker.Api.Models;

public class Room
{
    public string Id {get; set;} = Guid.NewGuid().ToString();
    public string Name {get; set;} = string.Empty;
    public ConcurrentDictionary<string, PeerInfo> Peers {get; set; }= new();
    public DateTime CreatedAt {get; set; } = DateTime.UtcNow; 
}