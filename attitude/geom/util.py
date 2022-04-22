from __future__ import division
from functools import reduce
import numpy as N
from numpy.linalg import norm


def dot(*matrices):
    return reduce(N.dot, matrices)


def augment_tensor(matrix, ndim=None):
    """
    Increase the dimensionality of a tensor,
    splicing it into an identity matrix of a higher
    dimension. Useful for generalizing
    transformation matrices.
    """
    s = matrix.shape
    if ndim is None:
        ndim = s[0] + 1
    arr = N.identity(ndim)
    arr[: s[0], : s[1]] = matrix
    return arr


def vector(*args):
    """
    A single vector in any coordinate basis,
    as a numpy array.
    """
    return N.array(args)


def unit_vector(*args):
    v = vector(*args)
    return v / norm(v)


def augment(vec):
    """
    Augment a vector in any orthonormal basis
    with a trailing 1 to form a homogeneous
    coordinate vector in that coordinate system.
    """
    return N.append(vec, [1])


def unit_vector(vec):
    """
    Return a normalized version of the vector
    """
    return vec / N.linalg.norm(vec)


def column(vec):
    """
    Return a vector with a new trailing axis
    (of singular dimension) added.
    """
    return vec[:, N.newaxis]


def angle(v1, v2, cos=False):
    """
    Find the angle between two vectors.

    :param cos: If True, the cosine of the
    angle will be returned. False by default.
    """
    n = norm(v1) * norm(v2)
    _ = dot(v1, v2) / n
    return _ if cos else N.arccos(_)


class Plane(N.ndarray):
    def hessian_normal(plane):
        """
        Return the Hessian Normal form of a plane
        (ax + by + cz + d = 0) where [a,b,c] forms
        the unit normal vector and d is the distance
        to the origin."""
        return plane / N.linalg.norm(plane[:-1])

    def offset(plane):
        """
        Returns the offset of the plane from the
        origin or an arbitrary point.
        """
        v = plane.hessian_normal()
        return -N.array(v[:-1] * v[-1])

    def normal(plane):
        v = plane.hessian_normal()
        return v[:-1]


def plane(normal, offset=0):
    # This only works in Hessian-Normal form
    return N.append(normal, offset).view(Plane)


def perpendicular_vector(n):
    """
    Get a random vector perpendicular
    to the given vector
    """
    dim = len(n)
    if dim == 2:
        return n[::-1]
    # More complex in 3d
    for ix in range(dim):
        _ = N.zeros(dim)
        # Try to keep axes near the global projection
        # by finding vectors perpendicular to higher-
        # index axes first. This may or may not be worth
        # doing.
        _[dim - ix - 1] = 1
        v1 = N.cross(n, _)
        if N.linalg.norm(v1) != 0:
            return v1
    raise ValueError("Cannot find perpendicular vector")
