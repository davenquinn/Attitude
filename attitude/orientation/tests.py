import functools

import numpy as N

from ..test import random_plane, scattered_plane
from . import Orientation

simple_cases = [
    ([(1, 0, 1), (0, 0, 1), (0, 1, 0)], [-90, 45], "North-dipping"),
    ([(5, 0, -5), (0, 5, 0), (0, 0, 0)], [0, 45], "East-dipping"),
    ([(1, 0, 0), (1, 1, 1), (2, 1, 1)], [90, 45], "South-dipping"),
    ([(0, 2, 0), (1, 1, 1), (0, 0, 0)], [180, 45], "West-dipping"),
    ([(0, 2, 1), (1, 1, 0), (0, 0, 1)], [0, 45], "East-dipping (sloping up)"),
    (
        [(0, 0, 1), (1, 0, 0), (0, 1, 0)],
        [-45, N.degrees(N.arctan(N.sqrt(2)))],
        "Northeast-dipping",
    ),
]


class TestCase(object):
    def __init__(self, array, strike_dip, id):
        self.id = id
        self.array = N.array(array)


test_cases = [TestCase(*i) for i in simple_cases]

edge_cases = [
    ([(0, 0, 0), (1, 1, 0), (0, 2, 0), (4, 2, 0)], [0, 0], "Flat"),
    ([(1, 0, 0), (1, 1, -1), (1, 2, 1)], [0, 90], "Vertical, facing east"),
]


def check_orientation(a):
    coords, sol, name = a
    sol = tuple(sol)
    res = Orientation(coords).strike_dip()
    assert res[0] == sol[0] and res[1] == sol[1]


def test_directions():
    """
    Tests cardinal directions for simple cases, to make sure everything conforms to right-hand rule.
    Does not test the standard deviation of these methods.
    """
    for a in simple_cases:
        yield check_orientation, a


def test_coordinates():
    """Tests to make sure we don't lose coordinates in the Orientation object"""
    plane, coordinates = random_plane()
    orient = Orientation(plane)
    assert len(plane[0]) == len(orient.fit.C)


def test_covariance():
    """Make sure we don't get empty covariance matrices in the Orientation object"""
    plane, coefficients = scattered_plane()
    fit = Orientation(plane)
    for i in fit.covariance_matrix().flatten():
        assert i != 0


def test_rotation_matrix():
    """Check that we have properly rotated our matrix to bring the along-strike direction into a coordinate plane."""
    plane, coefficients = scattered_plane()
    fit = Orientation(plane)
    assert N.allclose(fit.coefficients[1], 0)
