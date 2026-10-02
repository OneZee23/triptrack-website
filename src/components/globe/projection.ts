export type ProjectedPoint = { x: number; y: number; z: number; visible: boolean };

export const RAD = Math.PI / 180;

/** Orthographic coordinates: x right, y down, z facing the camera. */
export function project(lat: number, lng: number, lat0: number, lon0: number): ProjectedPoint {
  const phi = lat * RAD;
  const lam = (lng - lon0) * RAD;
  const p0 = lat0 * RAD;
  const z = Math.sin(p0) * Math.sin(phi) + Math.cos(p0) * Math.cos(phi) * Math.cos(lam);
  return {
    x: Math.cos(phi) * Math.sin(lam),
    y: -(Math.cos(p0) * Math.sin(phi) - Math.sin(p0) * Math.cos(phi) * Math.cos(lam)),
    z,
    visible: z >= 0,
  };
}
