using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GeoJSON2Shp.Models
{
    public class FileModel
    {
        public IFormFile Zip { get; set; }
        public string FilePath { get; set; }
    }
}
