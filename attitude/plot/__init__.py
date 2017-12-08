import numpy as N

from ..display.hyperbola import HyperbolicErrors
from .error_comparison import error_comparison
from .pca_aligned import plot_aligned
from .stereonet import girdle_error, pole_error, uncertain_plane
from ..stereonet import plane_errors, normal_errors
from ..error.axes import sampling_axes,noise_axes, francq_axes

def cartopy_girdle(fit, **kw):
    from cartopy import crs, feature
    from shapely.geometry import Polygon
    d = sampling_axes(fit,**kw)
    cm = N.diag(d)
    sheets = {i: N.degrees(plane_errors(fit.axes, cm, sheet=i))
        for i in ('upper','lower')}
    geom = Polygon(sheets['upper'], [sheets['lower'][::-1]])
    geometries = [geom]
    return feature.ShapelyFeature(geometries, crs.PlateCarree())

def cartopy_normal(fit, **kw):
    from cartopy import crs, feature
    from shapely.geometry import Polygon
    d = sampling_axes(fit,**kw)
    cm = N.diag(d)
    upper = N.degrees(normal_errors(fit.axes, cm))
    geom = Polygon(upper)
    geometries = [geom]
    return feature.ShapelyFeature(geometries, crs.PlateCarree())
