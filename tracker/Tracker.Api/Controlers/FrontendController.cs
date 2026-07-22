using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using System.IO;

namespace Tracker.Api.Controllers;

[ApiController]
public class FrontendController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public FrontendController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet("/")]
    public IActionResult Index()
    {
        var filePath = Path.Combine(_environment.WebRootPath, "index.html");
        if (System.IO.File.Exists(filePath))
        {
            return PhysicalFile(filePath, "text/html");
        }
        return Content("🎵 Aether Jam API is running!\nFrontend: Add your built web-client files to wwwroot folder", "text/plain");
    }

    [HttpGet("/assets/{**path}")]
    public IActionResult Assets(string path)
    {
        var filePath = Path.Combine(_environment.WebRootPath, "assets", path);
        if (System.IO.File.Exists(filePath))
        {
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }
            return PhysicalFile(filePath, contentType);
        }
        return NotFound();
    }
}