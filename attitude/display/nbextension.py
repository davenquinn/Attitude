from os import path

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
    from IPython.display import display

    global __ATTITUDE_INITIALIZED

    with open(path.join(__here__,'nbextension-inject.html')) as f:
        script = f.read()

    script = script.replace("<<<d3>>>",
                            get_library("d3v4+jetpack.js")+
                            get_library("d3-selection-multi.min.js"))
    script = script.replace("<<<math>>>",
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
