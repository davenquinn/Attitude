from .hyperbola import HyperbolicErrors

from os import path
from io import BytesIO
from base64 import b64encode
from jinja2 import FileSystemLoader, Environment
import numpy as N
import json
from .nbextension import init_notebook_mode

# For python 3 compatibility
try:
    from urllib.parse import quote
except ImportError:
    from urllib import quote

from .plot import setup_figure, strike_dip, normal,\
        trend_plunge, error_ellipse,\
        strike_dip_montecarlo,\
        plane_confidence, error_asymptotes
from ..orientation import PCAOrientation, LinearOrientation
from ..geom.util import unit_vector

def encode(fig):
    b = BytesIO()
    fig.savefig(b, format='png',bbox_inches='tight')
    b.seek(0)
    return '<img src ="{},{}"/>'.format(
            'data:image/png;base64',
            quote(b64encode(b.read())))

def to_json(value):
    """A filter that outputs Python objects as JSON"""
    return json.dumps(value)

_ = path.join(path.dirname(__file__),'templates')
# Load templates
loader = FileSystemLoader(_)
env = Environment(loader=loader)
env.filters['figure'] = encode
env.filters['json'] = to_json

def distance_from_group(components, pca):
    for fit in components:
        vec = N.dot(fit.axes[2], pca.axes[2])
        mean = N.arccos(N.abs(vec))

        # In-plane vector aligned with axis of variation, for both planes
        inplane = N.cross(fit.axes[2], pca.axes[2])
        fv = N.cross(inplane,fit.axes[2])
        v1 = unit_vector(fv)
        l = N.dot(v1, fit.axes[0])*fit.singular_values[0]
        e1 = fit.angular_error(l)

        mainv = N.cross(inplane,pca.axes[2])
        v = unit_vector(mainv)
        l = N.dot(v, pca.axes[0])*pca.singular_values[0]
        e2 = pca.angular_error(l)
        std = e1+e2
        yield N.degrees(mean), N.degrees(std), mean/std


def report(*arrays, **kwargs):
    """
    Outputs a standalone HTML 'report card' for a
    measurement (or several grouped measurements),
    including relevant statistical information.
    """
    name = kwargs.pop("name",None)

    grouped = len(arrays) > 1
    if grouped:
        arr = N.concatenate(arrays)
        components = [PCAOrientation(a)
            for a in arrays]
    else:
        arr = arrays[0]
        components = []

    r = LinearOrientation(arr)
    pca = PCAOrientation(arr)

    distances = list(distance_from_group(components,pca))

    kwargs = dict(
            levels=[1,2,3],
            alpha=[0.8,0.5,0.2],
            linewidth=2)

    ellipse=error_ellipse(pca)

    kwargs = dict(n=500,levels=[1,2], ellipse=True)
    stereonet_data = dict(
        main=pca.error_coords(**kwargs),
        components=[i.error_coords(**kwargs)
            for i in components])

    t = env.get_template("report.html")

    return t.render(
        name=name,
        regression=r,
        pca=pca,
        stereonet_data=stereonet_data,
        angular_errors=tuple(N.degrees(i)
            for i in pca.angular_errors()[::-1]),
        linear_error=error_ellipse(r),
        aligned=plot_aligned(pca),
        pca_ellipse=ellipse,
        distances=distances)
