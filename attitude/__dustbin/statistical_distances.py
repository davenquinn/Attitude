"""
Functions to test implementations of the statistical distance between two
orientation measurements. This will lead us to a quantification of the distance
between two uncertain orientation measurements.
"""
from __future__ import division

import numpy as N
import pytest

from ..geom.util import dot
from .test_pca import random_pca


def bhattacharyya_distance(pca1, pca2):
    """
    A measure of the distance between two probability distributions
    """
    u1 = pca1.coefficients
    s1 = pca1.covariance_matrix
    u2 = pca2.coefficients
    s2 = pca2.covariance_matrix

    sigma = (s1 + s2) / 2

    assert all(u1 > 0)
    assert all(u2 > 0)
    assert all(s1.sum(axis=1) > 0)
    assert all(s2.sum(axis=1) > 0)

    _ = 1 / 8 * dot((u1 - u2).T, N.linalg.inv(sigma), u1 - u2)
    _ += 1 / 2 * N.log(N.linalg.det(sigma) / (N.linalg.det(s1) * N.linalg.det(s2)))
    return _


@pytest.mark.xfail
def test_bhattacharyya_distance():
    """
    Not sure what is going on currently with implementation of Bhattacharyya Distance
    """
    distance = bhattacharyya_distance(random_pca(), random_pca())
    assert distance > 0
