"""
Interpolation strategies for image pixel extraction.

Possible options are:

- `nearest`
- `bilinear`
- `cubic`

"""
from __future__ import division
from shapely.geometry import LineString, MultiLineString, Point


def __factory__(order):
    def interpolate(array, geometry):
        """Interpolates geometries to the specified order"""
        import numpy as N
        from scipy.ndimage import map_coordinates
        from shapely.geometry import shape, mapping, asLineString

        if hasattr(array, "mask"):
            array = array.astype(float).filled(N.nan)

        def point_handler(coords):
            return line_handler([coords])[0]

        def line_handler(coords):
            coordinates = N.array(coords)
            aligned = (coordinates - 0.5)[:, 0:2].T[
                ::-1
            ]  # align fractional pixel coordinates to array
            z = map_coordinates(array, aligned, mode="nearest", order=order)
            try:
                coordinates[:, 2] = z
            except IndexError:
                coordinates = N.hstack((coordinates, z.reshape(len(z), 1)))
            return list(map(tuple, coordinates))

        if geometry.geom_type == "Point":
            return Point(*point_handler(geometry.coords))
        elif geometry.geom_type == "MultiLineString":
            return MultiLineString([line_handler(g.coords) for g in geometry])
        else:
            return LineString(line_handler(geometry.coords))

    return interpolate


nearest = __factory__(0)
bilinear = __factory__(1)
cubic = __factory__(2)
