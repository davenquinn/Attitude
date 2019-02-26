import numpy as N
from functools import partial

import rasterio
import rasterio.env
from rasterio.features import rasterize, geometry_mask
from affine import Affine

from shapely.geometry import shape, mapping, asShape
from shapely.ops import transform

from .interpolation import bilinear

def clean_coordinates(coords, silent=False):
    """
    Removes invalid coordinates (this is generally caused
    by importing coordinates outside of the DEM)
    """
    l1 = len(coords)
    coords = coords[~N.isnan(coords).any(axis=1)] # remove NaN values
    l2 = len(coords)
    if not silent:
        msg = "{0} coordinates".format(l2)
        if l2 < l1:
            msg += " ({0} removed as invalid)".format(l1-l2)
        print(msg)
    return coords

def offset_mask(mask):
    """ Returns a mask shrunk to the 'minimum bounding rectangle' of the
        nonzero portion of the previous mask, and its offset from the original.
        Useful to find the smallest rectangular section of the image that can be
        extracted to include the entire geometry. Conforms to the y-first
        expectations of numpy arrays rather than x-first (geodata).
    """
    def axis_data(axis):
        """Gets the bounds of a masked area along a certain axis"""
        x = mask.sum(axis)
        trimmed_front = N.trim_zeros(x,"f")
        offset = len(x)-len(trimmed_front)
        size = len(N.trim_zeros(trimmed_front,"b"))
        return offset,size

    xo,xs = axis_data(0)
    yo,ys = axis_data(1)

    array = mask[yo:yo+ys,xo:xo+xs]
    offset = (yo,xo)
    return offset, array

def coords_array(geometry):
    try:
        coords_in = N.array(geometry.coords)
    except NotImplementedError:
        coords_in = N.vstack([g.coords for g in geometry.geoms])
    return coords_in

def extract_line(geom, dem, **kwargs):
    """
    Extract a linear feature from a `rasterio` geospatial dataset.
    """
    kwargs.setdefault('masked', True)

    coords_in = coords_array(geom)

    # Transform geometry into pixels
    f = lambda *x: ~dem.transform * x
    px = transform(f,geom)

    # Subdivide geometry segments
    # at 1-pixel intervals
    #px = subdivide(px, interval=1)

    # Transform pixels back to geometry
    # to capture subdivisions
    f = lambda *x: dem.transform * (x[0],x[1])
    geom = transform(f,px)

    # Get min and max coords for windowing
    # Does not deal with edge cases where points
    # are outside of footprint of DEM

    coords_px = coords_array(px)
    mins = N.floor(coords_px.min(axis=0))
    maxs = N.ceil(coords_px.max(axis=0))

    window = tuple((int(mn),int(mx))
        for mn,mx in zip(mins[::-1],maxs[::-1]))

    aff = Affine.translation(*(-mins))

    f = lambda *x: aff * x
    px_to_extract = transform(f,px)

    band = dem.read(1, window=window, **kwargs)
    extracted = bilinear(band, px_to_extract)
    coords = coords_array(extracted)

    coords[:,:2] = coords_array(geom)
    return coords

def extract_area(geom, dem, **kwargs):
    # RasterIO's image-reading algorithm uses the location
    # of polygon centers to determine the extent of polygons
    msk = geometry_mask(
        (mapping(geom),),
        dem.shape,
        dem.transform,
        invert=True)

    # shrink mask to the minimal area for efficient extraction
    offset, msk = offset_mask(msk)

    window = tuple((o,o+s)
        for o,s in zip(offset,msk.shape))

    # Currently just for a single band
    # We could generalize to multiple
    # bands if desired
    z = dem.read(1,
        window=window,
        masked=True)

    # mask out unused area
    z[msk == False] = N.ma.masked

    # Make vectors of rows and columns
    rows, cols = (N.arange(first,last,1)
            for first,last in window)
    # 2d arrays of x,y,z
    z = z.flatten()
    xyz = [i.flatten()
            for i in N.meshgrid(cols,rows)] + [z]
    x,y,z = tuple(i[z.mask == False] for i in xyz)

    # Transform into 3xn matrix of
    # flattened coordinate values
    coords = N.vstack((x,y,N.ones(z.shape)))

    # Get affine transform for pixel centers
    affine = dem.transform * Affine.translation(0.5, 0.5)
    # Transform coordinates to DEM's reference
    _ = N.array(affine).reshape((3,3))
    coords = N.dot(_,coords)
    coords[2] = z
    return coords.transpose()

def extract_shape(geom, dem):
    if geom.area == 0:
        coords = extract_line(geom,dem)
    else:
        coords = extract_area(geom,dem)

    coords = clean_coordinates(coords, silent=True)
    assert len(coords) > 0
    return coords


