import mplstereonet.stereonet_math as M
import numpy as N

from ..coordinates.rotations import transform
from ..geom import dot
from ..stereonet import normal_errors, plane_errors
from .base import BaseOrientation, hash_array


class ErrorShell(object):
    """
    Object representing a specific error level
    """

    def __init__(self, axes, covariance):
        self.axes = axes
        self.covariance_matrix = covariance

    def cartopy_girdle(self, **kw):
        from cartopy import crs, feature
        from shapely.geometry import Polygon

        cm = self.covariance_matrix

        sheets = {
            i: N.degrees(plane_errors(self.axes, cm, sheet=i, traditional_layout=False))
            for i in ("upper", "lower")
        }
        geom = Polygon(sheets["upper"], [sheets["lower"]])
        geometries = [geom]
        return feature.ShapelyFeature(geometries, crs.PlateCarree())

    def cartopy_normal(self, **kw):
        from cartopy import crs, feature
        from shapely.geometry import Polygon

        cm = self.covariance_matrix
        upper = normal_errors(self.axes, cm, traditional_layout=False, cartesian=True)
        geom = Polygon(upper)
        geometries = [geom]
        return feature.ShapelyFeature(geometries, crs.Geocentric())


class ReconstructedPlane(ErrorShell, BaseOrientation):
    """
    This class represents a plane with errors on two axes.
    This error is presumably the result of some statistical
    process, and is a single confidence interval or shell
    derived from this result.
    """

    def __init__(self, strike, dip, rake, *angular_errors, **kwargs):
        _trans_arr = N.array([-1, -1, 1])

        def vec(latlon):
            lat, lon = latlon
            _ = M.sph2cart(lat, lon)
            val = N.array(_).flatten()
            val = N.roll(val, -1)
            return val * _trans_arr

        normal_error = kwargs.pop("normal_error", 1)

        self.__strike = strike
        self.__dip = dip
        self.__angular_errors = angular_errors
        self.__rake = rake

        errors = N.radians(angular_errors) / 2
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

        # Apply right-hand rule
        # ax[0:],ax[1:]

        # T = N.eye(3)
        # T[:-1,:-1] = rotate_2D(N.radians(rake))

        T = transform(ax[0], max_angle)
        self.axes = ax
        if self.axes[-1, -1] < 0:
            self.axes *= -1

        lengths = normal_error / N.tan(errors[::-1])
        self.hyperbolic_axes = N.array(list(lengths) + [normal_error])
        self.covariance_matrix = N.diag(self.hyperbolic_axes)

    def strike_dip_rake(self):
        return self.__strike, self.__dip, self.__rake

    def angular_errors(self):
        return self.__angular_errors

    @property
    def hash(self):
        return hash_array(self.hyperbolic_axes * self.axes)
