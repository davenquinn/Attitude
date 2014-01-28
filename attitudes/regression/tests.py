from . import Regression
from ..tests import random_plane

def test_coordinates():
    """Tests to make sure we don't lose coordinates in the process"""
    plane = random_plane()
    fit = Regression(plane)
    assert len(plane) == len(fit.C)

