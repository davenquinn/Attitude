"""
The core `orientation` module contains classes implementing different
planar fitting algorithms. These methods generally produce an object describing
a planar fit.

The most useful of these methods, contained within the PCAOrientation
module, defines a principal component regression.

"""

from .linear import LinearOrientation
from .pca import PCAOrientation, random_pca
from .reconstructed import ReconstructedPlane
from .grouped import create_groups

Orientation = PCAOrientation
