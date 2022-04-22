from __future__ import division

import numpy as N

from .util import dot, vector, augment, Plane, angle, perpendicular_vector


def angle_subtended(ell, **kwargs):
    """
    Compute the half angle subtended (or min and max angles)
    for an offset elliptical conic
    from the origin or an arbitrary viewpoint.

    kwargs:
        tangent  Return tangent instead of angle (default false)
        viewpoint   Defaults to origin
    """
    return_tangent = kwargs.pop("tangent", False)

    con, transform, offset = ell.projection(**kwargs)
    v = N.linalg.norm(N.array(con.major_axes()), axis=1)
    A = N.sort(v)[::-1]  # Sort highest values first
    A = N.squeeze(A)
    B = N.linalg.norm(offset)
    if return_tangent:
        return A / B
    return N.arctan2(A, B)


class Conic(N.ndarray):
    @classmethod
    def from_axes(cls, axes):
        """
        Get axis-aligned elliptical conic from axis lenths
        This can be converted into a hyperbola by getting the dual conic
        """
        ax = list(axes)
        # ax[-1] *= -1  # Not sure what is going on here...
        arr = N.diag(ax + [-1])
        return arr.view(cls)

    @classmethod
    def from_semiaxes(cls, axes):
        """
        Get axis-aligned elliptical conic from axis lenths
        This can be converted into a hyperbola by getting the dual conic
        """
        ax = list(1 / N.array(axes) ** 2)
        # ax[-1] *= -1  # Not sure what is going on here...
        arr = N.diag(ax + [-1])
        return arr.view(cls)

    def center(conic):
        # (https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections#Center)
        ec = N.linalg.inv(conic[:-1, :-1])
        eo = -conic[:-1, -1]
        return dot(ec, eo.T)

    def contains(ell, p, shell_only=False):
        """
        Check to see whether point is inside
        conic.

        :param exact: Only solutions exactly on conic
          are considered (default: False).
        """
        v = augment(p)
        _ = ell.solve(v)
        return N.allclose(_, 0) if shell_only else _ <= 0

    def semiaxes(self):
        """
        Semiaxial lengths for ellipsoid and hyperboloid
        (need to be aligned with coordinate system for
        now, could integrate with major_axes method below
        for added clarity.
        """

        d = N.abs(N.diagonal(self)[:-1])
        return d**-1

    def major_axes(ell):
        """
        Gets major axes of ellipsoids
        """
        _ = ell[:-1, :-1]
        U, s, V = N.linalg.svd(_)
        scalar = -(ell.sum() - _.sum())
        return N.sqrt(s * scalar) * V

    def __type(self):
        return N.linalg.det(self[:-1, :-1])

    def is_elliptical(self):
        """
        Check that geometry is an ellipse,
        ellipsoid, or n-dimensional equivalent.
        """
        return self.__type() > 0

    def is_hyperbolic(self):
        return self.__type() < 0

    def is_parabolic(self):
        return self.__type() == 0

    def solve(conic, v):
        """
        Solves a conic for a particular vector.
        Similar to `Conic.transform`, but returns
        a regular array
        """
        return dot(v.T, conic, v)

    def transform(conic, T):
        """
        Transforms a conic or quadric by a transformation
        matrix.
        """
        return conic.solve(T).view(Conic)

    def translate(conic, vector):
        """
        Translates a conic by a vector
        """
        # Translation matrix
        T = N.identity(len(conic))
        T[:-1, -1] = -vector
        return conic.transform(T)

    def polar_plane(conic, vector):
        """
        Calculates the polar plane to a vector (a 'pole')
        for a given conic section. For poles
        outside the conic, the polar plane
        contains all vectors of tangency to the pole.
        """
        pole = augment(vector)
        return dot(conic, pole).view(Plane)

    def pole(conic, plane):
        """
        Calculates the pole of a polar plane for
        a given conic section.
        """
        v = dot(N.linalg.inv(conic), plane)
        return v[:-1] / v[-1]

    def slice(self, plane, **kwargs):
        axes = kwargs.pop("axes", None)
        dim = len(plane) - 1

        if axes is None:
            n = plane.normal()
            v1 = perpendicular_vector(n)
            if dim == 3:
                v2 = N.cross(v1, n)
                axes = (v1, v2)
            elif dim == 2:
                axes = (v1,)
        pt = plane.offset()

        last_col = N.zeros(dim)
        last_col[-1] = 1

        m = N.append(N.column_stack(list(axes) + [pt]), last_col[N.newaxis, :], axis=0)

        # Lower-dimensional or degenerate conic
        # section representing the slice of the
        # ellipsoid or ellipse
        conic = self.transform(m)
        # Transformation matrix to move back to
        # degenerate conic in higher dimension
        # e.g. from a projected ellipse to an
        # inscribing cone
        transform = m.T
        # Vector describing offset of conic center
        offset = pt
        return conic, transform, offset

    def projection(self, **kwargs):
        """
        The elliptical cut of an ellipsoidal
        conic describing all points of tangency
        to the conic as viewed from the origin.
        """
        viewpoint = kwargs.pop("viewpoint", None)
        if viewpoint is None:
            ndim = self.shape[0] - 1
            viewpoint = N.zeros(ndim)
        plane = self.polar_plane(viewpoint)
        return self.slice(plane, **kwargs)

    def dual(self):
        """
        The inverse conic that represents the bundle
        of lines tangent to this conic.

        Conics and their duals, p 159
        """
        return N.linalg.inv(self)

    angle_subtended = angle_subtended


def conic(x):
    return N.array(x).view(Conic)
