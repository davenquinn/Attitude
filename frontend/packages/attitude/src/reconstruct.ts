import { Vector3, Matrix3 } from "./math";
import {
  RotationMatrix_fromAxisAngle,
  versor_toRotationMatrix,
} from "attitude/src/matrix";
import { versor_fromAxisAngle, versor_multiply } from "attitude/src/versor";
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

  const v = versor_fromAxisAngle([0, 90], strike);
  const v1 = versor_fromAxisAngle([0, 0], dip);
  const v3 = versor_fromAxisAngle([0, 90], 90 - rake);

  const v4 = versor_multiply(versor_multiply(v, v1), v3);

  return {
    hyp: [1, 0.2, 0.005],
    axes: versor_toRotationMatrix(v4),
  };
}
