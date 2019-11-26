using GeoJSON2Shp.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http.Headers;
using System.Threading.Tasks;

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
            //ViewBag.FilePath = TempData["filepath"];
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Index(IList<IFormFile> files)
        {
            string filePath = null;
            string filePathRelative = null;
            string uniqueFilename = null;
            var filePathDict = new Dictionary<string, string> { };
            
            foreach (IFormFile source in files)
            {
                string filename = ContentDispositionHeaderValue.Parse(source.ContentDisposition).FileName.Trim('"');

                filename = this.EnsureCorrectFilename(filename);

                //WebRootPath for the relative path of wwwroot
                string uploadsFolder = Path.Combine(_hostingEnvironment.WebRootPath, "files");

                //for unique names
                uniqueFilename = Guid.NewGuid().ToString() + "_" + filename;

                filePath = Path.Combine(uploadsFolder, uniqueFilename);
                filePathRelative = Path.Combine("files", uniqueFilename);
                TempData["filepath"] = filePathRelative;
                //ViewBag.FilePath = filePathRelative;

                using (FileStream output = new FileStream(filePath, FileMode.Create))
                    await source.CopyToAsync(output);

                filePathDict.Add("filepath", filePathRelative);
            }

            return this.View(filePathDict);
        }

        public JsonResult PathJson()
        {
            string filePathRelative = TempData["filepath"].ToString();
            
            return Json(new { filepath=filePathRelative});
        }

        private string EnsureCorrectFilename(string filename)
        {
            if (filename.Contains("\\"))
                filename = filename.Substring(filename.LastIndexOf("\\") + 1);

            return filename;
        }

        private string GetPathAndFilename(string filename)
        {
            return this._hostingEnvironment.WebRootPath + "\\files\\" + filename;
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
        public void Upload(FileModel model)
        {
            string filePath = null;
            string filePathRelative = null;
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
                    filePathRelative = Path.Combine("files", uniqueFilename);
                    model.Zip.CopyTo(new FileStream(filePath, FileMode.Create));
                    model.FilePath = filePathRelative;
                    TempData["filepath"] = filePathRelative;
                }

            }

            //return RedirectToAction("Index", "Home");
        }
    }
}
