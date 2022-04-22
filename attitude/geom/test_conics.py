# -*- coding:utf-8 -*-

# https://en.wikipedia.org/wiki/Quadric

from __future__ import division, print_function

import traceback

import numpy as N
import pytest
from numpy.linalg import norm
from scipy.linalg import lu
from scipy.optimize import fsolve

from attitude.geom.conics import Conic, conic
from attitude.geom.util import angle, augment, column, dot, vector

same = N.allclose


def symmetric(arr):
    return (arr.transpose() == arr).all()


def skew_symmetric(arr):
    return (arr.transpose() == -arr).all()


def test_conic():
    # We consider a sphere with radius 1 offset 2 units on the X axis
    # the half-angle of its shadow will be sin(theta) = 1/2, or theta = 30º
    # Can we recreate this?
    origin = vector(0, 0, 0)

    r = 1
    offs = 2

    # Ellipsoid
    _ = N.identity(4)
    _[3, 3] = -1
    ell0 = conic(_)

    # Center is inside origin
    assert ell0.contains(origin)

    # vector on the edge
    assert ell0.contains(vector(1, 0, 0))

    # Recovery of center?
    assert same(ell0.center(), origin)

    # Translate conic
    ell = ell0.translate(vector(2, 0, 0))

    assert same(ell.center(), [2, 0, 0])

    # Check that translation is reversible
    assert same(ell0, ell.translate(vector(-2, 0, 0)))

    assert symmetric(ell)

    assert ell.is_elliptical()

    ax = ell.major_axes()
    c = ell.center()
    for i in ax:
        v = c + i
        assert ell.contains(v, shell_only=True)

    # Plane of tangency
    # equation of plane polar to origin
    plane = ell.polar_plane(origin)

    # distance from tangent plane to origin
    hn = plane.hessian_normal()
    assert hn[3] == 1.5

    # pole of tangent plane?
    assert same(origin, ell.pole(plane))

    # center is inside ellipsoid
    assert ell.contains(ell.center())
    # origin is outside of ellipsoid
    assert not ell.contains(origin)

    assert ell.contains(vector(2, 1, 0))

    con, m, pt = ell.projection()

    assert same(con.center(), vector(0, 0))

    # vector is on projected conic
    i = 1.5 * N.tan(N.radians(30))
    v = augment(vector(i, 0))
    # doesn't work for some reason
    # assert same(con.solve(v), 0)

    ax = con.major_axes()
    # Computed axes are on conic
    for i in ax:
        assert con.contains(i, shell_only=True)

    # Rotate major axes into 3d space
    axs_ = N.append(ax, N.zeros((2, 1)), axis=1)
    axs = dot(axs_, m[:, :3])

    u = N.linspace(0, 2 * N.pi, 1000)

    # Get a bundle of vectors defining cone
    # which circumscribes ellipsoid
    angles = N.array([N.cos(u), N.sin(u)]).T

    # Turn into vectors
    data = dot(angles, axs) + pt

    for d in data:
        _ = angle(d, vector(1, 0, 0))
        assert same(N.degrees(_), 30)

    assert ell.dual().is_hyperbolic()

    # Cone of tangency
    # equation of elliptic cone
    B = N.sqrt(3) / 2  # cos(30º)
    _ = N.diag([1.5, B, B, 0])
    cone = conic(_)

    assert N.arctan(B / 1.5) == N.radians(30)
    # Test that vector is on ellipse
    # Likely only works on ellipsoids

    assert same(cone.center(), origin)


def test_conic_axes():
    # Create ellipsoid
    # not why this doesn't work with axial lengths
    ell = Conic.from_axes([500, 200, 100])
    assert ell.is_elliptical()
    assert not ell.dual().is_hyperbolic()  # Degenerate case
    assert ell.translate(vector(0, 0, 1)).dual().is_hyperbolic()


def get_offset_center(a, b):
    """
    Get the center of an offset ellipse corresponding
    to the lengths of the hyperbolic axes
    """
    # _ = a**2*b**2 + a**2*b**4 - a**2 + b**2
    # cdist = 1/(a*b)*N.sqrt(_)
    cdist = b * N.sqrt(2)
    return cdist


def test_center_recovery():
    """
    Check that we can recover the same center for ellipses
    for all axes.
    """
    axes = N.array([50, 40, 20])
    inplane = axes[:2]

    b = axes[2]
    # Check that computed distance of offset ellipse
    # is the same for both
    computed_centers = [get_offset_center(a, b) for a in inplane]
    assert N.allclose(*computed_centers)

    # Do the same but for all possible in-plane axes
    u = N.linspace(0, 2 * N.pi, 100)
    # Get a bundle of vectors defining cone
    # which circumscribes ellipsoid
    v = N.array([N.cos(u) ** 2, N.sin(u) ** 2])
    # Axial lengths of in-plane axes
    ell = dot(inplane, v)
    computed_centers = N.array([get_offset_center(a, b) for a in ell])
    # Magnitude of all values should be the same or nearly so
    assert computed_centers.max() - computed_centers.min() < 1e-4


@pytest.mark.xfail(reason="This test is poorly targeted and makes no sense")
def test_angular_shadow():
    """
    Check that we can compute the angular shadow of an
    offset error ellipse.
    """
    axes = N.array([200, 100, 1])
    inplane = axes[:2]
    # Hyperbolic angular errors
    angles = [N.degrees(N.arctan2(axes[2], i)) for i in inplane]
    angles = N.sort(angles)[::-1]

    b = axes[2]

    centers = [get_offset_center(a, b) for a in inplane]

    ax1 = axes[2] ** 2 / axes
    ell0 = Conic.from_semiaxes(ax1)

    def offset_conic(center):
        # See what the angle subtended by the conic is
        ell = ell0.translate(vector(0, 0, center))
        return N.degrees(ell.angle_subtended())

    fn = lambda x: offset_conic(x)[0] - angles[0]
    res = fsolve(fn, 2 * b)
    center = res[0]
    angles2 = offset_conic(center)
    # Test that the relative scaling of angles is correct
    assert N.allclose(angles, angles2)

    # Not sure what this was supposed to do, but it's scary wrong
    assert N.allclose(center, ax1[-1] * N.sqrt(2))
