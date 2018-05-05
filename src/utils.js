import * as turf from '@turf/turf';
import dissolve from 'geojson-dissolve';

const meters = {
  units: 'meters',
};

export function along(line, distance) {
  return turf.along(line, distance, meters);
}

export function length(geoJson) {
  return turf.length(geoJson, meters);
}

export function toGeoJson(source) {
  let features = source.getFeatures().map(f => {
    const geometry = f.getGeometry();
    const coordinates = geometry.getCoordinates();
    const multiLineString = turf.multiLineString(coordinates);
    let lineString = dissolve(multiLineString);
    return turf.feature(lineString);
  });
  let prevLength = 0;
  let length = features.length;
  while (length !== prevLength) {
    features = features.sort(
      (f1, f2) =>
        f2.geometry.coordinates.length - f1.geometry.coordinates.length,
    );
    features = dissolve(features);
    features = turf.flatten(features).features;
    prevLength = length;
    length = features.length;
  }

  return features;
}

export function getSection(start, stop, geoJson) {
  return turf.lineSlice(start, stop, geoJson[0]);
}
