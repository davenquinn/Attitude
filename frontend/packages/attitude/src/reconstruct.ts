import { Vector3, Matrix3 } from "./math";
import { RotationMatrix_fromEulerAngles } from "attitude/src/matrix";

export interface Orientation {
  strike: number;
  dip: number;
  rake: number;
  maxError: number;
  minError: number;
}

export function reconstructErrors(orientation: Orientation): {
  hyp: Vector3;
  axes: Matrix3;
} {
  const { strike, dip, rake } = orientation;
  return {
    hyp: [1, 0.2, 0.005],
    axes: RotationMatrix_fromEulerAngles([strike, dip, rake]),
  };
}
