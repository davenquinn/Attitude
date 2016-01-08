from __future__ import division, print_function
import numpy as N
from ..geom.util import dot
from ..error.ellipse import ellipse

def rotation(angle):
    """Rotation about the Z axis (in the XY plane)"""
    return N.array([[N.cos(angle),-N.sin(angle),0],
        [N.sin(angle), N.cos(angle),0],
        [0           , 0           ,1]])

def ellipse(center,covariance_matrix,level=1, n=1000):
    """Returns error ellipse in slope-azimuth space"""
    # singular value decomposition
    U, s, rotation_matrix = N.linalg.svd(covariance_matrix)
    # semi-axes (largest first)

    saxes = N.sqrt(s)*level ## If the _area_ of a 2s ellipse is twice that of a 1s ellipse
    # If the _axes_ are supposed to be twice as long, then it should be N.sqrt(s)*width

    u = N.linspace(0, 2*N.pi, n)
    data = N.column_stack((saxes[0]*N.cos(u), saxes[1]*N.sin(u)))
    # rotate data
    return N.dot(data, rotation_matrix)+ center

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

    @property
    def rotated_covariance(self):
        r = rotation(self.azimuth)
        return dot(r.T,self.covariance_matrix,r)

    def standard_errors(self):
        return N.sqrt(N.diagonal(self.rotated_covariance))

    def _ellipse(self,level):
        return ellipse(
                tuple(self.coefficients[:2]),
                self.covariance_matrix[:2,:2],
                level=level)

    def error_ellipse(self, spherical=True, vector=False, level=1):
        e = self._ellipse(level)
        if spherical:
            slope = N.arctan(-e[:,0])
            azimuth = self.azimuth + N.arctan2(-e[:,1],-e[:,0])
            if vector:
                azimuth = azimuth + N.pi/2
            return (N.pi+azimuth,N.pi/2-slope)
        return (e[:,1],e[:,0])
