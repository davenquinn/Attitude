import numpy as N
from matplotlib.path import Path
from matplotlib.patches import PathPatch
import mplstereonet.stereonet_math as M

from ..stereonet import plane_errors, ellipse, dot, error_ellipse, normal_errors
from ..error.axes import sampling_axes
from ..geom.transform import rotate_2D
from ..coordinates.rotations import transform

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
        err = plane_errors(fit.axes, fit.covariance_matrix, sheet=sheet)
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
    lonlat = -N.array(ell)
    n = len(lonlat)
    codes = [Path.MOVETO]
    codes += [Path.LINETO]*(n-1)
    vertices = list(lonlat)

    plot_patch(ax, vertices, codes, **kwargs)

class UncertainPlane(object):
    """
    This class represents a plane with errors on two axes.
    This error is presumably the result of some statistical
    process, and is a single confidence interval or shell
    derived from this result.
    """
    def __init__(self, strike, dip, rake, *angular_errors):
        _trans_arr = N.array([-1, -1, 1])
        def vec(latlon):
            _ = M.sph2cart(*latlon)
            val = N.array(_).flatten()
            val = N.roll(val,-1)
            return val * _trans_arr

        errors = N.radians(angular_errors)/2
        pole = M.pole(strike, dip)

        # Uncertain why we have to do this to get a normal vector
        # but it has something to do with the stereonet coordinate
        # system relative to the normal
        self.normal = vec(pole)
        max_angle = vec(M.rake(strike, dip, rake))
        min_angle = N.cross(self.normal, max_angle)


        # These axes have the correct length but need to be
        # rotated into the correct reference frame.
        ax = N.vstack((min_angle, max_angle, self.normal))

        #T = N.eye(3)
        #T[:-1,:-1] = rotate_2D(N.radians(rake))

        T = transform(ax[0],max_angle)
        self.axes = dot(T,ax)
        if self.axes[-1,-1] < 0:
            self.axes *= -1

        lengths = 1/N.tan(errors[::-1])
        self.covariance_matrix = N.diag(list(lengths)+[1])

def uncertain_plane(ax, *args, **kwargs):
    fit = UncertainPlane(*args)
    return girdle_error(ax, fit, **kwargs)
