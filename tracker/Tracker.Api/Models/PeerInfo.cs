namespace Tracker.Api.Models;

public class PeerInfo
{
    public string ConnectionId {get; set;}= string.Empty;
    public string DisplayName {get; set;}= string.Empty;
    public string Instrument {get; set;}= "synth";
    public DateTime JoinedAt {get; set;} = DateTime.UtcNow;
}