"""
This test module is designed to show the exact relationship between the PCA error lengths
defined from covariance matrices and the hyperbolic and ellipsoidal error bounds
"""

import numpy as N
import pytest

from ..error.axes import noise_axes, sampling_axes
from .conics import Conic, conic
from .util import dot, vector

origin = vector(0, 0)


def test_angular_shadow():
    """
    Make sure we can successfully recover an angular shadow
    from an ellipse offset from the origin, a simple two
    dimensional case of the more general 3d solution.

    BASIS: an ellipse with semiaxes [1,1] centered at
    [0,2] will have a half angular shadow of 30º
    """
    # Create an mean-centered conic with the requisite
    # semiaxial lengths
    _ = N.identity(3)
    _[-1, -1] = -1
    ell0 = conic(_)

    # Translate conic to new center
    ell = ell0.translate(vector(0, 2))

    # Get the polar plane to the origin (plane intersecting
    # the conic at all points of tangency to the origin)
    plane = ell.polar_plane(vector(0, 0))
    assert N.linalg.norm(plane.offset()) == 1.5

    # Get degenerate conic with d-1 dimensionality
    # (in this case, a line) and distance from projection
    # point of tangent
    con, transform, offset = ell.slice(plane)
    # this will be the half-length of the cut of the ellipse
    l = float(con.major_axes())
    dist = N.linalg.norm(offset)

    assert N.allclose(N.degrees(N.arctan2(l, dist)), 30)

    # Same with generalized function
    assert N.allclose(N.degrees(ell.angle_subtended()), 30)


@pytest.mark.xfail(reason="Mathematical basis seems to be incorrect")
def test_ellipse_offset():
    """
    An error ellipse should be offset a set amount off axis
    """
    a, b = 10, 5
    axial_lengths = N.array([a, b])

    c = Conic.from_axes(1 / axial_lengths**2)

    # angular error for hyperbolic representation of this conic
    th = N.arctan2(b, a)

    # This is always true for ellipse offset to the proper position
    gamma = N.pi / 4

    # This is the distance we shift the ellipse
    l = 1 / b * (a**4 + b**4)
    assert l > 0
    assert l > b

    center = vector(0, l)
    c0 = c.translate(center)
    # Check that we have the right center
    assert N.allclose(c0.center(), center)

    origin = vector(0, 0)
    # Plane of tangency
    plane = c0.polar_plane(origin)
    # find offset from origin,
    # it should be within the bottom half of the ellipse
    offs = plane.hessian_normal()[-1]

    # Check with offset computed algebraically
    assert N.allclose(l - b**2 / l, offs)

    assert l - b < offs < l

    # Check geometrically
    # offs2 = a**2*N.cos(gamma)/b
    # assert N.allclose(offs2, offs)

    # Check that the projection of the ellipse from the
    # origin spans the same angle as the hyperbolic angular error

    xv = a * N.sqrt(1 - b**2 / l**2)

    angular_shadow = N.arctan2(xv, offs)
    assert th == angular_shadow
