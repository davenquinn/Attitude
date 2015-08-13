from __future__ import division, print_function
import numpy as N

from ..error.ellipse import ellipse

class BaseOrientation(object):

    def dip_direction(self, uncertainties=False):
        s,d = self.strike_dip()
        s+=90
        if uncertainties:
            return (s,d),self.errors()
        return (s,d)

    def gradient(self, uncertainties=False):
        return self.azimuth,self.slope

    def errors(self):
        return tuple(N.degrees(i) for i in self.standard_errors()[:2])

    def standard_errors(self):
        return N.sqrt(N.diagonal(self.covariance_matrix))

    def error_ellipse(self, spherical=True, vector=False, level=1):
        e = ellipse(tuple(self.coefficients[:2]), self.covariance_matrix[:2,:2], level=level)
        if spherical:
            slope = N.arctan(-e[:,0])
            azimuth = self.azimuth + N.arctan2(-e[:,1],-e[:,0])
            if vector:
                azimuth = azimuth + N.pi/2
            return (azimuth,slope)
        return (e[:,1],e[:,0])
