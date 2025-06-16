const fs = require('fs');
const path = require('path');
const proj4 = require('proj4');
const turf = require("@turf/turf");

proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs");

const geojsonPath = path.join(__dirname, './circoscrizioni.geojson');
fs.readFile(geojsonPath, 'utf8', (err, data) => {
  if (err) {
    console.log("Error reading file:", err);
    return;
  }

  const polygons = createPolygons(JSON.parse(data));
  const testPoint = [11.0344511,46.0188397];
  const projectedPoint = proj4('EPSG:4326', 'EPSG:25832', testPoint);
  const turfPoint = turf.point(projectedPoint);

  let found = false;

  for (const feature of polygons) {
    if (turf.booleanPointInPolygon(turfPoint, feature)) {
      const name = feature.properties?.nome || feature.properties?.NOME || 'Unknown';
      console.log(`The point is in district ${name}`);
      found = true;
      break;
    }
  }

  if (!found) {
    console.log("The point isn't in any district");
  }
});

function createPolygons(geojson) {
  const polygons = [];

  turf.flattenEach(geojson, function(feature) {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      polygons.push(feature);
    }
  });

  return polygons;
}