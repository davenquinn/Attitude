import numpy as N

from ..display.hyperbola import HyperbolicErrors
from .error_comparison import error_comparison
from .pca_aligned import plot_aligned
from .stereonet import girdle_error, pole_error, uncertain_plane
from ..stereonet import plane_errors, normal_errors

def cartopy_girdle(fit):
    from cartopy import crs, feature
    from shapely.geometry import Polygon

    sheets = {i: N.degrees(plane_errors(fit.axes, fit.covariance_matrix, sheet=i))
        for i in ('upper','lower')}
    geom = Polygon(sheets['upper'], [sheets['lower'][::-1]])
    geometries = [geom]
    return feature.ShapelyFeature(geometries, crs.PlateCarree())

def cartopy_normal(fit):
    from cartopy import crs, feature
    from shapely.geometry import Polygon

    upper = N.degrees(normal_errors(fit.axes, fit.covariance_matrix))
    geom = Polygon(upper)
    geometries = [geom]
    return feature.ShapelyFeature(geometries, crs.PlateCarree())
