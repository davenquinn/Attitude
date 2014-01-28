import numpy as N
from ..orientation import Orientation
import json
from ..plot import setup_figure, 

def fit_planes(features):
    for i,feature in enumerate(features):
        coords = N.array(shape(feature["geometry"]))

        l1 = len(coords)
        coords = coords[~N.isnan(coords).any(axis=1)] # remove NaN values
        l2 = len(coords)
        msg = "{0} coordinates".format(l2)
        if l2 < l1:
            msg += " ({0} removed as invalid)".format(l1-l2)
        print msg

        fit = Orientation(coords)

        yield fit

def process_file(filename, plot=True):
    with open(filename) as f:
        collection = json.load(f)["features"]
        results = fit_planes(collection)
        if plot:
            ax = setup_axis()

