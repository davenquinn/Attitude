"""
Functions to plot data using the `cartopy` library.
These require the `shapely` and `cartopy` libraries to be installed.
CartoPy is sometimes difficult to install.
"""

import numpy as N
from cartopy import crs, feature
from shapely.geometry import Polygon

def cartopy_girdle(fit, **kw):
    d = sampling_axes(fit,**kw)
    cm = N.diag(d)
    sheets = {i: N.degrees(plane_errors(fit.axes, cm, sheet=i))
        for i in ('upper','lower')}
    geom = Polygon(sheets['upper'], [sheets['lower'][::-1]])
    geometries = [geom]
    return feature.ShapelyFeature(geometries, crs.PlateCarree())

def cartopy_normal(fit, **kw):
    d = sampling_axes(fit,**kw)
    cm = N.diag(d)
    upper = N.degrees(normal_errors(fit.axes, cm))
    geom = Polygon(upper)
    geometries = [geom]
    return feature.ShapelyFeature(geometries, crs.PlateCarree())

