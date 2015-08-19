from __future__ import division, print_function
import numpy as N
from .pca import PCAOrientation
from ..coordinates import centered, spherical, cartesian

class SphericalOrientation(PCAOrientation):
    def __init__(self,array):
        # center dataset
        # Convert to spherical coordinates
        arr = spherical(centered(array))
        PCAOrientation.__init__(self,arr)

        self.fit = self.axes[1]

    @property
    def azimuth(self):
        return self.fit[1]

    @property
    def slope(self):
        return self.fit[2]

    @property
    def rotated_covariance(self):
        return self.covariance_matrix


