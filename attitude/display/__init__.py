"""
Functions for displaying data using `matplotlib`, `cartopy`,
and interactive javascript, both for static plotting
and the IPython notebook.

Deprecated code for generating HTML reports is also included
in this module.
"""

from .hyperbola import HyperbolicErrors
from .nbextension import init_notebook_mode, plot_interactive
from .plot import (
    setup_figure,
    strike_dip,
    normal,
    trend_plunge,
    error_ellipse,
    strike_dip_montecarlo,
    plane_confidence,
    error_asymptotes,
)

from .error_comparison import error_comparison
from .pca_aligned import plot_aligned
from .stereonet import girdle_error, pole_error, uncertain_plane

# These aren't particularly well-organized
from ..stereonet import plane_errors, normal_errors
from ..error.axes import sampling_axes, noise_axes
