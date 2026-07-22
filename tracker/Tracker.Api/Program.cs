using Tracker.Api.Hubs;
using Tracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddSingleton<RoomManager>();

// CORS - разрешаем все источники
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors();

// Раздача статических файлов (фронтенд)
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHub<SyncHub>("/sync");

// Fallback для SPA роутинга
app.MapFallbackToFile("index.html");

app.Run();