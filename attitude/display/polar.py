import numpy as N
from matplotlib.path import Path
from matplotlib.patches import PathPatch
import mplstereonet.stereonet_math as M

from ..orientation.reconstructed import ReconstructedPlane
from ..stereonet import plane_errors, ellipse, dot, error_ellipse, normal_errors
from ..error.axes import sampling_axes
from ..geom.transform import rotate_2D
from .stereonet import plot_patch

def pole_error(ax, fit, *args, **kwargs):
    axes = fit.axes

    #level = kwargs.pop('level',1)
    traditional_layout = kwargs.pop('traditional_layout',True)
    d = N.diagonal(fit.covariance_matrix)
    ell = ellipse()

    if axes[2,2] < 0:
        axes *= -1

    # Not sure where this factor comes from but it
    # seems to make things work better
    c1 = 2
    axis_lengths = d[:2]
    f = N.linalg.norm(
        ell*axis_lengths,axis=1)

    e0 = -ell.T*d[2]*c1
    e = N.vstack((e0,f))

    _ = dot(e.T,axes).T

    #if traditional_layout:
    #lon,lat = M.cart2sph(_[2],_[0],-_[1])
    #else:
    lon,lat = M.cart2sph(-_[1],_[0],_[2])
    lon,lat = M.cart2sph(-_[0],_[1],_[2])
    lon -= N.pi

    ell = list(zip(lon,lat))

    lonlat = N.array(ell)
    lonlat[:,1] = 90-N.degrees(lonlat[:,1])
    #lonlat[:,0] *= -1
    #lonlat[:,1] = N.degrees(lonlat[:,1])
    #import IPython; IPython.embed(); raise
    n = len(lonlat)
    codes = [Path.MOVETO]
    codes += [Path.LINETO]*(n-1)

    #import IPython; IPython.embed(); raise

    vertices = list(lonlat)
    plot_patch(ax, vertices, codes, **kwargs)

def uncertain_pole(ax, *args, **kwargs):
    fit = ReconstructedPlane(*args)
    return pole_error(ax, fit, **kwargs)
