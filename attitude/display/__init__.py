"""
Functions for displaying data using `matplotlib`, `cartopy`,
and interactive javascript, both for static plotting
and the IPython notebook.

Deprecated code for generating HTML reports is also included
in this module.
"""

from ..error.axes import noise_axes, sampling_axes

# These aren't particularly well-organized
from ..stereonet import normal_errors, plane_errors
from .error_comparison import error_comparison
from .hyperbola import HyperbolicErrors
from .nbextension import init_notebook_mode, plot_interactive
from .pca_aligned import plot_aligned
from .plot import (
    error_asymptotes,
    error_ellipse,
    normal,
    plane_confidence,
    setup_figure,
    strike_dip,
    strike_dip_montecarlo,
    trend_plunge,
)
from .stereonet import girdle_error, pole_error, uncertain_plane
