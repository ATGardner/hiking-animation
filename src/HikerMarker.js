import Feature from 'ol/Feature';
import * as utils from './utils';
import Point from 'ol/geom/Point';
import BezierEasing from 'bezier-easing';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Circle from 'ol/style/Circle';
import Stroke from 'ol/style/Stroke';
import { Duration, Interval } from 'luxon';

const easeInOutCubic = BezierEasing(0.445, 0.05, 0.55, 0.95);
const dayOfHiking = Duration.fromObject({ hours: 10 });

function getStyle(radius, fillColor, strokeColor) {
  return new Style({
    image: new Circle({
      radius,
      snapToPixel: false,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({
        color: strokeColor,
        width: 2,
      }),
    }),
  });
}

export default class HikerMarker {
  constructor(lineString, data, color) {
    this.style = getStyle(7, color, 'white');
    this.data = data.map(
      ({ startDate, startLon, startLat, endLon, endLat, endDate }, i) => {
        const section = utils.getSection(
          [startLon, startLat],
          [endLon, endLat],
          lineString,
        );
        const sectionLength = utils.length(section);
        if (!startDate.hour) {
          startDate = startDate.set({ hours: 8 });
        }

        if (!endDate) {
          endDate = startDate.plus(dayOfHiking);
        }

        console.log(
          `section ${i}, ${startDate} - ${(sectionLength / 1000).toFixed(2)}Km`,
        );
        const interval = Interval.fromDateTimes(startDate, endDate);
        return { section, sectionLength, interval };
      },
    );
    this.start = this.data[0].interval.start;
    this.end = this.data[this.data.length - 1].interval.end;
  }

  getMarkerAt(projectedTime) {
    const day = this.data.find(({ interval }) =>
      interval.contains(projectedTime),
    );
    if (day) {
      const { section, sectionLength, interval } = day;
      const diff = projectedTime.diff(interval.start);
      const timeFraction = diff.as('seconds') / interval.length('seconds');
      const easing = easeInOutCubic(timeFraction);
      const distance = easing * sectionLength;
      const currentPoint = utils.along(section, distance);
      const point = new Point(currentPoint.geometry.coordinates);
      this.marker = new Feature(point);
    } else if (this.end < projectedTime) {
      delete this.marker;
    }

    return this.marker;
  }
}
