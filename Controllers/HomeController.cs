using GeoJSON2Shp.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;

namespace GeoJSON2Shp.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IWebHostEnvironment _hostingEnvironment;

        public HomeController(ILogger<HomeController> logger, IWebHostEnvironment hostingEnvironment)
        {
            _logger = logger;
            _hostingEnvironment = hostingEnvironment;
        }

        public IActionResult Index()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public IActionResult About()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Upload(FileModel model)
        {
            string filePath = null;
            if (ModelState.IsValid)
            {
                string uniqueFilename = null;
                if (model.Zip != null)
                {
                    //WebRootPath for the relative path of wwwroot
                    string uploadsFolder = Path.Combine(_hostingEnvironment.WebRootPath, "files");

                    //for unique names
                    uniqueFilename = Guid.NewGuid().ToString() + "_" + model.Zip.FileName;

                    filePath = Path.Combine(uploadsFolder, uniqueFilename);
                    model.Zip.CopyTo(new FileStream(filePath, FileMode.Create));

                    
                }

            }

            return Json(filePath);
        }
    }
}
