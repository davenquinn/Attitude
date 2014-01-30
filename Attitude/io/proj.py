import fiona
from pyproj import Proj, transform
from shapely.geometry import mapping, shape
import logging as log
from functools import partial
from fiona.crs import from_string

def transform_coords(func, records):
    """
    Transform record geometry coordinates using the provided function.
    .. http://sgillies.net/blog/1125/fiona-pyproj-shapely-in-a-functional-style/
    """
    for rec in records:
        try:
            assert rec['geometry']['type'] == "LineString"
            coords = func(*zip(*rec["geometry"]["coordinates"]))
            rec['geometry']['coordinates'] = zip(*coords)
        except Exception, e:
            # Writing untransformed features to a different shapefile
            # is another option.
            log.exception("Error transforming record %s:", rec['id'])
        yield rec

class Transformation(object):
    def __init__(self, source, sink):
        self.source = Proj(source)
        self.sink = Proj(sink)

    def transform(self, records):
        func = partial(transform, self.source, self.sink)
        return transform_coords(func, records)

    def reversed(self, records):
        func = partial(transform, self.sink, self.source)
        return transform_coords(func, records)

def get_crs(argument):
    try:
        with open(argument, "r") as f:
            argument = f.read()
    except IOError, err:
        pass
    if argument[0] != "+":
        spatial_ref = osr.SpatialReference()
        spatial_ref.ImportFromWkt(argument)
        argument = spatial_ref.ExportToProj4()
    return from_string(argument)
