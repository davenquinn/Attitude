**Attitude** is for fitting the orientation of planes! Its core mission is to compute
planar fits and transform them (*along with meaningful error distributions*) into
a form that can be used for geology. It is designed to support the collection of structural
measurements from remote sensing data.

# Usage

The module accepts input in the form of a *n*-by-3 matrix with columns corresponding
to X, Y, and Z coordinates. These data are commonly extracted from linear or polygonal
features on a digital elevation model.

A planar fit can be constructed as such:

```python
from attitude import Orientation
measurement = Orientation(array)
```

The `Regression` object underlying this result can be accessed as `measurement.fit`.

# Installation

Attitude is packaged as a standard Python module. The latest version
is available on PyPI and can be installed using PIP:
```
pip install Attitude
```

If you want to use the development version (which may be more up-to-date), you can instead run
```
pip install git+git://github.com/davenquinn/Attitude.git
```

## Dependencies

Attitude currently depends on several python modules:

- Numpy
- SciPy
- matplotlib
- mplstereonet

Only the first two are needed for the core functionality (fitting planes). The
other two are for plotting (`matplotlib` and `mplstereonet`).

# Future Plans

This module is in development, and there are several things I hope to enhance:

- Python 3 support (it should be mostly fine, but is currently only tested on 2.7)
- Shapely integration
- Linking to a separate library to extract data from elevation models
