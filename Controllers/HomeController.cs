using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using GeoJSON2Shp.Models;
using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace GeoJSON2Shp.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IHostingEnvironment hostingEnvironment;

        public HomeController(ILogger<HomeController> logger, IHostingEnvironment hostingEnvironment)
        {
            _logger = logger;
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

        public IActionResult Upload(FileModel model)
        {
            if (ModelState.IsValid)
            {
                string uniqueFilename = null;
                if(model.Zip != null)
                {
                    //WebRootPath for the relative path of wwwroot
                    string uploadsFolder = Path.Combine(hostingEnvironment.WebRootPath, "files");

                    //for unique names
                    uniqueFilename = Guid.NewGuid().ToString() + "_" + model.Zip.FileName;

                    string filePath = Path.Combine(uploadsFolder, uniqueFilename);
                    model.Zip.CopyTo(new FileStream(filePath, FileMode.Create));
                }

            }

            return View();
        }
    }
}
