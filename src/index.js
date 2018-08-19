import parse from 'csv-parse/lib/sync';
import { DateTime, Interval } from 'luxon';
import 'ol/ol.css';
import HikerMarker from './HikerMarker';
import { createMap } from './map';
import './style.css';

function getProjectedTime(projectedStart, elapsedTime) {
  const projectedDays = elapsedTime / (12 * 1000);
  const fullDays = Math.floor(projectedDays);
  const projectedHours = elapsedTime % (12 * 1000);
  const daySpeedHours = Math.min(projectedHours, 10 * 1000);
  const nightSpeedHours = Math.max(projectedHours - 10 * 1000, 0);
  return projectedStart.plus({
    days: fullDays,
    milliseconds: daySpeedHours * 60 * 60 + nightSpeedHours * 60 * 60 * 7,
  });
}

async function getCsvData(fileName) {
  const res = await fetch(fileName);
  const data = await res.text();
  return parse(data, {
    cast: true,
    cast_date: (value, { header }) => {
      return header ? value : DateTime.fromISO(value);
    },
    columns: true,
    comment: '#',
    relax_column_count: true,
    trim: true,
  });
}

async function animate(map, hikers) {
  const projectedStart = DateTime.min(...hikers.map(h => h.start));
  const projectedEnd = DateTime.max(...hikers.map(h => h.end));
  const projectedInterval = Interval.fromDateTimes(
    projectedStart,
    projectedEnd,
  );
  const postCompose = ({ frameState, vectorContext }) => {
    const elapsedTime = frameState.time - start;
    const projectedTime = getProjectedTime(projectedStart, elapsedTime);
    time.datetime = projectedTime.toISO();
    time.innerText = projectedTime.toLocaleString(DateTime.DATETIME_MED);
    hikers.forEach(h => {
      const marker = h.getMarkerAt(projectedTime);
      if (marker) {
        vectorContext.drawFeature(marker, h.style);
      }
    });
    if (projectedInterval.isBefore(projectedTime)) {
      map.un('postcompose', postCompose);
    } else {
      map.render();
    }
  };
  map.on('postcompose', postCompose);
  const start = Date.now();
  map.render();
}

(async function() {
  const { map, lineString } = await createMap('map', './assets/Tracks.kml');
  const amtrak = await getCsvData('./assets/amtrak.csv');
  // const borealis = await getCsvData('./assets/borealis.csv');
  const hikers = [
    new HikerMarker(lineString, amtrak, '#00ff004d'),
    // new HikerMarker(lineString, borealis, '#0000ff4d'),
  ];
  startButton.addEventListener('click', () => animate(map, hikers), false);
})();
