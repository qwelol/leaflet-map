export const metersToPixels = (meters: number, latitude: number, zoom: number): number => {
  const earthCircumference = 40075017; // Earth circumference in meters
  const metersPerPixel = (earthCircumference * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom + 8);
  return meters / metersPerPixel;
};
