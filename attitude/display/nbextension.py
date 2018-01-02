
def get_attitudeUI():
    return ""

def init_notebook_mode(connected=False):
    """
    Initialize attitude.js in the browser.

    Based heavily on the `plotly` offline setup function
    (https://github.com/plotly/plotly.py/blob/master/plotly/offline/offline.py)
    """
    if not ipython:
        raise ImportError('`iplot` can only run inside an IPython Notebook.')

    global __ATTITUDE_INITIALIZED

    # Inject plotly.js into the output cell
    script_inject = (
        ''
        '<script type=\'text/javascript\'>'
        'if(!window.Plotly){{'
        'define(\'plotly\', function(require, exports, module) {{'
        '{script}'
        '}});'
        'require([\'plotly\'], function(Plotly) {{'
        'window.Plotly = Plotly;'
        '}});'
        '}}'
        '</script>'
        '').format(script=get_attitudeUI())

    display_bundle = {
        'text/html': script_inject,
        'text/vnd.plotly.v1+html': script_inject
    }
    ipython_display.display(display_bundle, raw=True)
    __ATTITUDE_INITIALIZED = True
