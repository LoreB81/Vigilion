const fs = require('fs');
const path = require('path');
const proj4 = require('proj4');
const turf = require("@turf/turf");

proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs");

const districtMapping = {
  1: "Gardolo",
  2: "Meano",
  3: "Bondone",
  4: "Sardagna",
  5: "Ravina-Romagnano",
  6: "Argentario",
  7: "Povo",
  8: "Mattarello",
  9: "Villazzano",
  10: "Oltrefersina",
  11: "San Giuseppe-Santa Chiara",
  12: "Centro Storico-Piedicastello",
  13: "Error"
};

function createPolygons(geojson) {
  const polygons = [];

  turf.flattenEach(geojson, function(feature) {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      polygons.push(feature);
    }
  });

  return polygons;
}

const checkDistrict = function(coordinates) {
  return new Promise((resolve, reject) => {
    const geojsonPath = path.join(__dirname, './circoscrizioni.geojson');
    fs.readFile(geojsonPath, 'utf8', (err, data) => {
      if (err) {
        console.log("Error reading file:", err);
        reject(err);
        return;
      }

      const polygons = createPolygons(JSON.parse(data));

      const point = [coordinates[1], coordinates[0]];
      const projectedPoint = proj4('EPSG:4326', 'EPSG:25832', point);
      const turfPoint = turf.point(projectedPoint);

      let districtIndex = 13;

      for (const feature of polygons) {
        if (turf.booleanPointInPolygon(turfPoint, feature)) {
          districtIndex = feature.properties?.numero_circ;
          break;
        }
      }

      resolve(districtMapping[districtIndex]);
    });
  });
}

module.exports = checkDistrict;