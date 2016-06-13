"""
Functions to test implementations of the statistical distance between two
orientation measurements. This will lead us to a quantification of the distance
between two uncertain orientation measurements.
"""
from __future__ import division

import numpy as N
from .test_pca import random_pca
from ..geom.util import dot

def bhattacharyya_distance(pca1,pca2):
    """
    A measure of the distance between two probability distributions
    """
    u1 = pca1.coefficients
    s1 = pca1.covariance_matrix
    u2 = pca2.coefficients
    s2 = pca2.covariance_matrix

    sigma = (s1+s2)/2


    _ = 1/8*dot((u1-u2).T, N.linalg.inv(sigma),u1-u2)
    _ += 1/2*N.log(N.linalg.det(sigma)/(N.linalg.det(s1)*N.linalg.det(s2)))
    return _

def test_bhattacharyya_distance():
    distance = bhattacharyya_distance(random_pca(),random_pca())
    assert distance > 0
