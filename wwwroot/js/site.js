//upload placeholder
//$(document).ready(function () {
//    $('.file-input').on("change", function () {
//        var fileName = $(this).val().split("\\").pop();
//        $(this).next('.file-label').html(fileName);
//    })
//});

//CodeMirror
var minLines = 3;
var startingValue = '';
for (var i = 0; i < minLines; i++) {
    startingValue += '\n';
}
var editor = CodeMirror.fromTextArea(document.getElementById("geojsonText"), {
    lineNumbers: true,
    gutter: true,
    lineWrapping: true,
    value: initGeoJson
});

//leaflet
var map = L.map('map').setView([47.4, 13.7], 3);
var tile = L.tileLayer('https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=nuUT2YfFKoqeVtbXlFkX', {
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
}).addTo(map);

//feature group for displaying editable shapes
var featureGroup = L.featureGroup().addTo(map);

//hide download button
$(".show-hide").hide();

//init GeoJson FeatureCollection
//populate textarea with an example of a supported FeatureCollection
//use it to push geoJSON of type : feature
var initGeoJson = {
    "type": "FeatureCollection",
    "features": []
};
var initGeoJsonStringBeautify = JSON.stringify(initGeoJson, null, 2);
editor.setValue(initGeoJsonStringBeautify);

//helper methods
//beautify geojson string and add to map
function beautifyAndAdd(geojson) {

    var geojsonStringBeautify = JSON.stringify(geojson, null, 2);
    editor.setValue(geojsonStringBeautify);

    featureGroup.clearLayers();
    try {
        var geojsonLayer = L.geoJSON(geojson);
        geojsonLayer.eachLayer(
            function (l) {
                featureGroup.addLayer(l);
                map.fitBounds(featureGroup.getBounds());
            });
    } catch (err) {
        //alert(err + " Try to validate your GeoJSON at http://geojsonlint.com/");
    }
}

//check if geojson is a FeatureCollection
//if it isn't make it so!
//also, beautify it in both cases
function checkFeatureCollection(geojson) {

    if (geojson['type'].toLowerCase() === 'feature') {
        var emptyFeatureCollection = {
            "type": "FeatureCollection",
            "features": []
        };
        emptyFeatureCollection['features'].push(geojson);
        beautifyAndAdd(emptyFeatureCollection);
    } else {
        beautifyAndAdd(geojson);
    }
}

//shp to geojson
function shpToGeojson(relativeFilePath){
    var geojsonFromShp = null;

    if (relativeFilePath !== '') {
        console.log(relativeFilePath);
        shp(relativeFilePath).then(function (geojson) {
            console.log('start convert');
            geojsonFromShp = geojson;
            console.log('end convert');
            var geojsonString = JSON.stringify(geojson);
            if (geojsonString.toLowerCase().indexOf("multi") >= 0) {
                console.log('multi');
                let flatten = require('geojson-flatten');
                var flattened = flatten(geojson);
                checkFeatureCollection(flattened);
            }
            //if geojson doesn't have multi shapes do the same thing but without flattening
            else {
                checkFeatureCollection(geojson);
            }
        });
    }

};

//upload files and show them on the map
$("#files").change(function () {
    var input = document.getElementById("files");
    var files = input.files;
    var formData = new FormData();

    for (var i = 0; i != files.length; i++) {
        formData.append("files", files[i]);
    }

    $.ajax({
        url: urlPost,
        data: formData,
        processData: false,
        contentType: false,
        type: "POST",
        success: function (data) {
            $.ajax({
                url: urlGet,
                type: "GET",
                success: function (data) {
                    path = data.filepath;
                    var deletePath = path;
                    shpToGeojson(path);
                    $(".show-hide").show();

                    $.ajax({
                        url: urlDelete,
                        data: {'deletePath': deletePath },
                        type: "POST",
                        success: function (data) {
                            console.log("file deleted");
                        }
                    });
                }
            });
        }
    });

    
});

//show pasted geoJSON on map
$("#convert").click(function () {
    if (editor.getValue() === '' || editor.getValue() === initGeoJsonStringBeautify) {
        console.log("radi");
        return;
    }
    else {
        //read geojson textarea
        var geojsonString = editor.getValue();
        //parse it to a JSON object
        try {

            var geojson = JSON.parse(geojsonString);
            $(".show-hide").show();

        } catch (e) {
            $(".show-hide").hide();
        }

        //check if it needs to be flattened if it has Multi type shapes
        //which aren't supported
        if (geojsonString.toLowerCase().indexOf("multi") >= 0) {
            console.log('multi');
            let flatten = require('geojson-flatten');
            var flattened = flatten(geojson);
            checkFeatureCollection(flattened);
        }
        //if geojson doesn't have multi shapes do the same thing but without flattening
        else {
            checkFeatureCollection(geojson);
        }
    }
});

//download shapes displayed on map
$("#download").click(function () {
    var emptyFeatureCollection = {
        "type": "FeatureCollection",
        "features": []
    };
    featureGroup.eachLayer(function (gLayer) {
        var geojson = gLayer.toGeoJSON();
        emptyFeatureCollection['features'].push(geojson);
    });

    shpwrite.zip(emptyFeatureCollection).then(function (content) {
        console.log('regular');
        saveAs(content, 'export.zip');
    });
});

//edit geojson
//https://codepen.io/mochaNate/pen/bWNveg
//http://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html#leaflet-1-0-examples
//https://github.com/Leaflet/Leaflet.draw/issues/187
//https://github.com/Leaflet/Leaflet.draw/issues/276
//https://gis.stackexchange.com/questions/237171/making-a-geojson-layer-editable-with-the-leaflet-editable-plugin

//drawing, editing and deleting on leaflet map
var drawControl = new L.Control.Draw({
    draw: {
        circle: false
    },

    edit: {
        featureGroup: featureGroup
    }
}).addTo(map);

map.on(L.Draw.Event.CREATED, function (event) {
    var emptyFeatureCollection = {
        "type": "FeatureCollection",
        "features": []
    };
    var gLayer = event.layer;
    featureGroup.addLayer(gLayer);
    if (editor.getValue() === '') {
        console.log("prazno");

        featureGroup.eachLayer(function (gLayer) {
            var geojson = gLayer.toGeoJSON();
            emptyFeatureCollection['features'].push(geojson);
        });
        var geojsonStringBeautify = JSON.stringify(emptyFeatureCollection, null, 2);
        editor.setValue(geojsonStringBeautify);
    }
    else {
        featureGroup.eachLayer(function (gLayer) {
            var geojson = gLayer.toGeoJSON();
            emptyFeatureCollection['features'].push(geojson);
        });
        var geojsonStringBeautify = JSON.stringify(emptyFeatureCollection, null, 2);
        editor.setValue(geojsonStringBeautify);


    }


    $(".show-hide").show();
});

map.on(L.Draw.Event.EDITED, function (event) {
    var emptyFeatureCollection = {
        "type": "FeatureCollection",
        "features": []
    };
    var layer = event.layer;
    featureGroup.eachLayer(function (layer) {
        var geojson = layer.toGeoJSON();
        emptyFeatureCollection['features'].push(geojson);
    });
    var geojsonStringBeautify = JSON.stringify(emptyFeatureCollection, null, 2);
    //$("textarea[name='geojsonInput']").val('');
    //$("textarea[name='geojsonInput']").val(geojsonStringBeautify);
    editor.setValue(geojsonStringBeautify);
});

map.on(L.Draw.Event.DELETED, function (event) {
    var emptyFeatureCollection = {
        "type": "FeatureCollection",
        "features": []
    };
    featureGroup.eachLayer(function (layer) {
        var geojson = layer.toGeoJSON();
        emptyFeatureCollection['features'].push(geojson);
    });
    var geojsonStringBeautify = JSON.stringify(emptyFeatureCollection, null, 2);
    //$("textarea[name='geojsonInput']").val('');
    //$("textarea[name='geojsonInput']").val(geojsonStringBeautify);
    editor.setValue(geojsonStringBeautify);
});
