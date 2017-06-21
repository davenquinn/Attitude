import numpy as N
import mplstereonet.stereonet_math as M

from ..geom import dot
from ..coordinates.rotations import transform
from ..stereonet import plane_errors, normal_errors

class ErrorShell(object):
    """
    Object representing a specific error level
    """
    def cartopy_girdle(self, **kw):
        from cartopy import crs, feature
        from shapely.geometry import Polygon
        cm = self.covariance_matrix

        sheets = {i: N.degrees(plane_errors(self.axes, cm,
                        sheet=i, traditional_layout=False))
            for i in ('upper','lower')}
        geom = Polygon(sheets['upper'], [sheets['lower']])
        geometries = [geom]
        return feature.ShapelyFeature(geometries, crs.PlateCarree())

    def cartopy_normal(self, **kw):
        from cartopy import crs, feature
        from shapely.geometry import Polygon

        cm = self.covariance_matrix
        upper = N.degrees(normal_errors(self.axes, cm, traditional_layout=False))
        geom = Polygon(upper)
        geometries = [geom]
        return feature.ShapelyFeature(geometries, crs.PlateCarree())

class ReconstructedPlane(ErrorShell):
    """
    This class represents a plane with errors on two axes.
    This error is presumably the result of some statistical
    process, and is a single confidence interval or shell
    derived from this result.
    """
    def __init__(self, strike, dip, rake, *angular_errors):
        _trans_arr = N.array([-1, -1, 1])
        def vec(latlon):
            lat, lon = latlon
            _ = M.sph2cart(lat, lon)
            val = N.array(_).flatten()
            val = N.roll(val,-1)
            return val * _trans_arr

        errors = N.radians(angular_errors)/2
        pole = M.pole(strike, dip)

        # Uncertain why we have to do this to get a normal vector
        # but it has something to do with the stereonet coordinate
        # system relative to the normal
        self.normal = vec(pole)
        ll = M.rake(strike, dip, rake)
        max_angle = vec(ll)
        min_angle = N.cross(self.normal, max_angle)


        # These axes have the correct length but need to be
        # rotated into the correct reference frame.
        ax = N.vstack((min_angle, max_angle, self.normal))

        #T = N.eye(3)
        #T[:-1,:-1] = rotate_2D(N.radians(rake))

        T = transform(ax[0],max_angle)
        self.axes = ax
        if self.axes[-1,-1] < 0:
            self.axes *= -1

        lengths = 1/N.tan(errors[::-1])**2
        self.covariance_matrix = N.diag(list(lengths)+[1])
