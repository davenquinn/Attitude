#!/usr/bin/env python

import click
from IPython import embed

from syrtis.core import app, db
from syrtis.models import Attitude

@click.command()
@click.argument('id',type=int)
def run_shell(id):
    with app.app_context():
        meas = db.session.query(Attitude).get(id)
        pca = meas.pca()
        embed()

if __name__ == '__main__':
    run_shell()
