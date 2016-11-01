import numpy as N
from matplotlib.pyplot import subplots
from scipy.stats import chi2

from ....orientation.pca import PCAOrientation
from .regressions import hyperbola, bootstrap_noise
from .misc import augment, ci

def axis_covariance(fit, do_bootstrap=False, **kwargs):
    arr = fit.arr

    deskewed_data = fit.rotated()

    fig, ax = subplots()

    sv = fit.singular_values
    covariance = sv**2/(len(arr)-1) # naive covariance for each axis, taking into account number of samples
    v = N.var(deskewed_data,axis=0)[-1]
    v =sv[2]/(2*(len(arr)-2))
    covariance2 = 4*sv**2*v # taking into account measurement noise
    covariance2 /= covariance2.sum()
    covariance2 *= v

    width = kwargs.pop("width", None)
    if width is None:
        max = deskewed_data.max(axis=0)[1].max()
        width = 2.2*max

    v = width/2
    v_ = (-v,v)
    xvals = N.linspace(*v_,401)

    def func(arr):
        means = arr.mean(axis=0)
        arr -= means
        f = PCAOrientation(arr)
        al = f.axes[1][1:]
        xc = xvals - means[1]
        yc = al[1]/al[0]*xc
        y = yc + means[2]
        return y

    ax.plot(v_,[0,0],color='dodgerblue', label='PCA')


    def hyperbolic_errors(cov, **kwargs):
        # Make into a 95% CI
        #http://stats.stackexchange.com/questions/164741/how-to-find-the-maximum-axis-of-ellipsoid-given-the-covariance-matrix
        # scaling determined by chi2 distribution
        hyp_default = dict(
            n=1,
            level=1)
        hyp_kws = {k: kwargs.pop(k,v) for k,v in hyp_default.items()}
        #cov = N.sqrt(cov)
        cov = cov[1:]
        hyp = hyperbola(cov,N.identity(2),N.array([0,0]),xvals,**hyp_kws)
        ax.fill_between(*hyp,**kwargs)

    ax.plot(*deskewed_data[:,1:].T, '.', color='#aaaaaa', zorder=-5)

    hyperbolic_errors(
        sv,
        color='#aaaaaa',
        alpha=0.15,
        label="Simple variance",
        level=1)
    n = len(arr)
    hyperbolic_errors(
        covariance,
        n=n,
        level=N.sqrt(chi2.ppf(0.95,n-3)),
        color='dodgerblue',
        alpha=0.15,
        label="Sampling-based")
    hyperbolic_errors(
        covariance2,
        n=1,
        level=N.sqrt(chi2.ppf(0.95,3)),
        color='dodgerblue',alpha=0.15,
        label="Noise-based", linestyle="--")

    if do_bootstrap:
        # Bootstrap with noise std greater of 1m or the standard deviation of residuals
        # (in this case about 1m)
        s = deskewed_data[:,2].std()
        if s < 1:
            s = 1
        yhat_boots = bootstrap_noise(deskewed_data, func, std=s)
        err_bands = ci(yhat_boots,axis=0)
        ax.fill_between(xvals, *err_bands, facecolor="none",edgecolor='blue',
                        alpha=.5, label="Noise bootstrap",linestyle='--')

    ax.legend()
    return fig
