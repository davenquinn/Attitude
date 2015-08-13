from __future__ import division, print_function
import numpy as N
from scipy.linalg import eig

from ...coordinates import centered
from ..base import BaseOrientation
from .regression import Regression

def axes(matrix):
    """
    Computes the ellipse axes lengths for a covariance matrix
    """
    return N.sqrt(eig(matrix[0:2,0:2])[0])

def rotation(angle):
    """Rotation about the Z axis (in the XY plane)"""
    return N.array([[N.cos(angle),-N.sin(angle),0],
        [N.sin(angle), N.cos(angle),0],
        [0           , 0           ,1]])

class LinearOrientation(BaseOrientation):
    def __init__(self,coordinates):
        self.fit = Regression(coordinates)

        values = self.fit.coefficients()
        val = values[0]**2+values[1]**2
        self.azimuth = -N.arctan2(-values[1], -values[0])
        self.rotation = rotation(self.azimuth)
        self.coefficients = N.dot(self.rotation,values)
        self.slope = N.arctan(-self.coefficients[0])

    @property
    def covariance_matrix(self):
        return N.dot(self.fit.covariance_matrix,self.rotation)

    def strike_dip(self, uncertainties=False):
        c = tuple(N.degrees(i) for i in (self.azimuth,self.slope))
        if uncertainties:
            return c,self.errors()
        return c


