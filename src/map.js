import KML from 'ol/format/kml';
import TileLayer from 'ol/layer/tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/map';
import OSMSource from 'ol/source/osm';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import * as utils from './utils';

export function createMap(id, url) {
  return new Promise(resolve => {
    const target = document.getElementById(id);
    const view = new View({
      center: [0, 0],
      zoom: 0,
      projection: 'EPSG:4326',
    });
    const source = new VectorSource({
      url,
      format: new KML(),
    });
    const map = new Map({
      target,
      loadTilesWhileAnimating: true,
      view,
      layers: [
        new TileLayer({
          source: new OSMSource(),
        }),
        new VectorLayer({
          source,
        }),
      ],
    });
    source.on('change', ({ target }) => {
      const extent = target.getExtent();
      view.fit(extent);
      const lineString = utils.toGeoJson(target);
      resolve({ map, lineString });
    });
  });
}
