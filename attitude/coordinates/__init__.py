import numpy as N

from .rotations import transform


def spherical(coordinates):
    """No error is propagated"""
    c = coordinates
    r = N.linalg.norm(c, axis=0)
    theta = N.arccos(c[2] / r)
    phi = N.arctan2(c[1], c[0])
    return N.column_stack((r, theta, phi))


def cartesian(spherical):
    r, theta, phi = spherical
    z = r * N.cos(theta)
    zc = r * N.sin(theta)
    x = zc * N.sin(phi)
    y = zc * N.cos(phi)
    return x, y, z


def centered(coordinates):
    """
    Centers coordinate distribution with respect to its
    mean on all three axes. This is used as the input to
    the regression model, so it can be converted easily
    into radial coordinates.
    """
    coordinates = N.array(coordinates)
    means = N.mean(coordinates, axis=0)
    return coordinates - means
