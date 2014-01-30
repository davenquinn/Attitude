import numpy as N
from ..orientation import Orientation
import json
from shapely.geometry import shape
from ..coordinates import centered


def fit_planes(features):
    for i,feature in enumerate(features):
        coords = N.array(shape(feature["geometry"]))
        fit = Orientation(centered(coords))
        yield fit

