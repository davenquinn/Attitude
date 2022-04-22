from os import path
from uuid import uuid4
from json import dumps
from collections.abc import Sequence
from IPython.display import display, Javascript, HTML

__here__ = path.dirname(__file__)
lib = path.join(__here__, "lib")


def get_library(fn):
    dn = path.join(lib, fn)
    with open(dn) as f:
        return f.read()


__ATTITUDE_INITIALIZED = False


def init_notebook_mode():
    """
    Initialize attitude.js in the browser.

    Based heavily on the `plotly` offline setup function
    (https://github.com/plotly/plotly.py/blob/master/plotly/offline/offline.py)

    Also see
    https://github.com/paulgb/nbgraph/blob/master/nbgraph/client/prepare_notebook.html
    """
    global __ATTITUDE_INITIALIZED
    if __ATTITUDE_INITIALIZED:
        return
    display(Javascript(get_library("attitude-ui.js")))
    __ATTITUDE_INITIALIZED = True


__TEMPLATE__ = """
<div id='a__<<<hash>>>'></div>
<script type='text/javascript'>
  var data=JSON.parse('<<<data>>>');
  attitudeUI(document.querySelector('#a__<<<hash>>>'),data);
</script>
"""


def plot_interactive(attitudes):
    if not isinstance(attitudes, Sequence):
        attitudes = [attitudes]
    attitudes = [a.to_mapping() if hasattr(a, "to_mapping") else a for a in attitudes]

    data = dumps(attitudes)
    script = __TEMPLATE__.replace("<<<data>>>", data)

    classname = "A" + str(uuid4())
    script = script.replace("<<<hash>>>", classname)
    display(HTML(script))
