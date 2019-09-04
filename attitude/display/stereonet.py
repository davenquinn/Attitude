import numpy as N
from matplotlib.path import Path
from matplotlib.patches import PathPatch
import mplstereonet.stereonet_math as M

from ..orientation.reconstructed import ReconstructedPlane
from ..stereonet import plane_errors, ellipse, dot, error_ellipse, normal_errors
from ..error.axes import sampling_axes
from ..geom.transform import rotate_2D

def plot_patch(ax, vertices, codes, **kwargs):
    # Make path plot in order with lines
    # https://matplotlib.org/examples/pylab_examples/zorder_demo.html
    defaults = dict(zorder=2)
    defaults.update(kwargs)

    path = Path(vertices, codes)
    patch = PathPatch(path, **defaults)
    ax.add_patch(patch)

def girdle_error(ax, fit, **kwargs):
    """
    Plot an attitude measurement on an `mplstereonet` axes object.
    """
    vertices = []
    codes = []
    for sheet in ('upper','lower'):
        err = plane_errors(fit.axes, fit.covariance_matrix,
                sheet=sheet)
        lonlat = N.array(err)
        lonlat *= -1
        n = len(lonlat)
        if sheet == 'lower':
            lonlat = lonlat[::-1]
        vertices += list(lonlat)
        codes.append(Path.MOVETO)
        codes += [Path.LINETO]*(n-1)

    plot_patch(ax, vertices, codes, **kwargs)

def pole_error(ax, fit, **kwargs):
    """
    Plot the error to the pole to a plane on a `mplstereonet`
    axis object.
    """
    ell = normal_errors(fit.axes, fit.covariance_matrix)
    lonlat = N.array(ell)
    lonlat[:,0] *= -1
    n = len(lonlat)
    codes = [Path.MOVETO]
    codes += [Path.LINETO]*(n-1)
    vertices = list(lonlat)
    plot_patch(ax, vertices, codes, **kwargs)

def uncertain_pole(ax, *args, **kwargs):
    """
    Min and max angular errors are symmetrical and
    thus should be doubled.
    """
    fit = ReconstructedPlane(*args)
    return pole_error(ax, fit, **kwargs)

def uncertain_plane(ax, *args, **kwargs):
    fit = ReconstructedPlane(*args)
    return girdle_error(ax, fit, **kwargs)

def polar_uncertain_pole(ax, *args, **kwargs):
    fit = ReconstructedPlane(*args)
    #err = pole_error(ax, fit, **kwargs)
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
