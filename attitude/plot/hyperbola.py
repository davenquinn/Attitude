from matplotlib.patches import Polygon
import numpy as N
from ..error import hyperbolic_errors

class HyperbolicErrors(object):
    """
    A class to simplify plotting and animation of hyperbolic error
    areas that are orthogonal to the fitted plane.
    `ax.fill_between` cannot be used for these (unless
    the plane is flat), because the coordinate system
    is rotated.
    """
    def __init__(self, *args, **kwargs):
        """Wraps `hyperbolic_errors` function."""
        if len(args):
            self.data = hyperbolic_errors(*args,**kwargs)
        else:
            self.data = None

    def plot(self, ax,**kw):
        #self.n, = ax.plot([],[], '-', **kw)
        patch = Polygon([[0,0]], **kw)
        self.poly = ax.add_patch(patch)
        if self.data is not None:
            self.__set_plot_data(self.data)
        # Support method chaining
        return self

    def update_data(self, *args, **kwargs):
        self.data = hyperbolic_errors(*args,**kwargs)
        self.__set_plot_data(self.data)

    def __set_plot_data(self,n):
        coords = N.concatenate((n[1],n[2][:,::-1]),axis=1).T
        self.poly.set_xy(coords)

