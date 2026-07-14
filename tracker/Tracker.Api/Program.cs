using Tracker.Api.Hubs;
using Tracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();

builder.Services.AddSingleton<RoomManager>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173") 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors();

app.MapHub<SyncHub>("/sync");

app.MapGet("/", () => "Aether Jam Tracker is running!");

app.Run();