from os import path
from io import BytesIO
from urllib import quote
from base64 import b64encode
from jinja2 import FileSystemLoader, Environment

from ..orientation import Orientation
from ..plot import setup_figure, strike_dip, normal, trend_plunge

def encode(fig):
    b = BytesIO()
    fig.savefig(b, format='png')
    b.seek(0)
    return '<img src ="{},{}"/>'.format(
            'data:image/png;base64',
            quote(b64encode(b.read())))

_ = path.join(path.dirname(__file__),'templates')
# Load templates
loader = FileSystemLoader(_)
env = Environment(loader=loader)
env.filters['figure'] = encode

def report(*arrays, **kwargs):
    """
    Outputs a standalone HTML 'report card' for a
    measurement (or several grouped measurements),
    including relevant statistical information.
    """
    name = kwargs.pop("name",None)

    arr = arrays[0]

    o = Orientation.from_coordinates(arr)

    fig,ax = setup_figure()
    trend_plunge(o,
            ax=ax,
            levels=[1,2,3],
            alpha=[0.8,0.5,0.2])

    t = env.get_template("report.html")
    return t.render(
        name=name,
        orientation=o,
        strike_dip=fig)
