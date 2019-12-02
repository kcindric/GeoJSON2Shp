(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* global FileReader */

'use strict'

module.exports = function fileToArrayBuffer (file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader()

    reader.onerror = function onerror (ev) {
      reject(ev.target.error)
    }

    reader.onload = function onload (ev) {
      resolve(ev.target.result)
    }

    reader.readAsArrayBuffer(file)
  })
}

},{}],2:[function(require,module,exports){
module.exports=function e(t){switch(t&&t.type||null){case"FeatureCollection":return t.features=t.features.reduce(function(t,r){return t.concat(e(r))},[]),t;case"Feature":return t.geometry?e(t.geometry).map(function(e){var r={type:"Feature",properties:JSON.parse(JSON.stringify(t.properties)),geometry:e};return void 0!==t.id&&(r.id=t.id),r}):t;case"MultiPoint":return t.coordinates.map(function(e){return{type:"Point",coordinates:e}});case"MultiPolygon":return t.coordinates.map(function(e){return{type:"Polygon",coordinates:e}});case"MultiLineString":return t.coordinates.map(function(e){return{type:"LineString",coordinates:e}});case"GeometryCollection":return t.geometries.map(e).reduce(function(e,t){return e.concat(t)},[]);case"Point":case"Polygon":case"LineString":return[t]}};


},{}],3:[function(require,module,exports){
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
//use it to push pasted geoJSON of type : feature
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

//main method for adding geojson to map
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
function shpToGeojson(relativeFilePath) {
    var geojsonFromShp = null;

    if (relativeFilePath !== '') {
        shp(relativeFilePath).then(function (geojson) {
            geojsonFromShp = geojson;
            var geojsonString = JSON.stringify(geojson);
            if (geojsonString.toLowerCase().indexOf("multi") >= 0) {
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

const fileToArrayBuffer = require('file-to-array-buffer');

//upload ziped shapefiles and show them on the map
$("#filesOGRE").change(function () {

    var input = document.getElementById("filesOGRE");
    var files = input.files;
    //$('#loading').show();

    //convert zip file to ArrayBuffer which then can be used by shpjs
    fileToArrayBuffer(files[0]).then(function (data) {
        shp(data).then(function (geojson) {
            if (Array.isArray(geojson)) {
                var emptyFeatureCollection = {
                    "type": "FeatureCollection",
                    "features": []
                };
                //append to initGeojson
                for (var i = 0; i != geojson.length; i++) {
                    emptyFeatureCollection['features'].push(geojson[i]['features'][0])
                }
                geojson = emptyFeatureCollection;
            }
            else {

                //continue as usual
            }

            var geojsonString = JSON.stringify(geojson);
            if (geojsonString.toLowerCase().indexOf("multi") >= 0) {
                let flatten = require('geojson-flatten');
                var flattened = flatten(geojson);
                checkFeatureCollection(flattened);

            }
            //if geojson doesn't have multi shapes do the same thing but without flattening
            else {
                checkFeatureCollection(geojson);
            }

        });
    });

    //$('#loading').hide();
    $(".show-hide").show();
});

//show pasted geoJSON on map
$("#convert").click(function () {
    if (editor.getValue() === '' || editor.getValue() === initGeoJsonStringBeautify) {
        alert('Nothing to convert!');
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
        saveAs(content, 'export.zip');
    });
});

//edit geojson
//notes that helped me with implementing imported shp editing
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
    editor.setValue(geojsonStringBeautify);
});

},{"file-to-array-buffer":1,"geojson-flatten":2}]},{},[3]);
