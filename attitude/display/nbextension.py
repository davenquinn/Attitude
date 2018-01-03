from os import path
from uuid import uuid4
from json import dumps
from IPython.display import display

__here__ = path.dirname(__file__)
lib = path.join(__here__,'../../js-frontend/lib')

def get_library(fn):
    dn = path.join(lib,fn)
    with open(dn) as f:
        return f.read()

def init_notebook_mode():
    """
    Initialize attitude.js in the browser.

    Based heavily on the `plotly` offline setup function
    (https://github.com/plotly/plotly.py/blob/master/plotly/offline/offline.py)
    """
    global __ATTITUDE_INITIALIZED

    with open(path.join(__here__,'nbextension-inject.html')) as f:
        script = f.read()

    script = script.replace("<<<d3>>>",
                            get_library("d3v4+jetpack.js")+
                            get_library("d3-selection-multi.min.js"))
    script = script.replace("<<<mathjs>>>",
                            get_library("math.min.js"))
    script = script.replace("<<<attitudeUI>>>",
                            get_library("attitude-ui.js"))

    script = script.replace("<<<stylesheet>>>",
                            get_library("ui-styles.css"))

    display_bundle = {
        'text/html': script
    }
    display(display_bundle, raw=True)
    __ATTITUDE_INITIALIZED = True

def plot_interactive(attitudes):
    with open(path.join(__here__,'nbextension-view.html')) as f:
        script = f.read()

    attitudes = [a.to_mapping() if hasattr(a,'to_mapping') else a
                 for a in attitudes]


    script = script.replace("<<<d3>>>",
                            get_library("d3v4+jetpack.js")+
                            get_library("d3-selection-multi.min.js"))
    script = script.replace("<<<mathjs>>>",
                            get_library("math.min.js"))
    script = script.replace("<<<attitudeUI>>>",
                            get_library("attitude-ui.js"))

    script = script.replace("<<<stylesheet>>>",
                            get_library("ui-styles.css"))

    data = dumps(attitudes)
    script = script.replace("<<<data>>>",data)

    classname = "A"+str(uuid4())
    script = script.replace("<<<hash>>>",classname)
    display_bundle = {
        'text/html': script
    }
    display(display_bundle, raw=True)

