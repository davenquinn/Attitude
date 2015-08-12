#!/usr/bin/env python

from flask import Flask

test = Flask(__name__)

from syrtis.core import app, db
from syrtis.models import Attitude
from attitude.display import env, report

@test.route("/")
def list():
    """
    List of test cases
    """
    with app.app_context():
        measurements = db.session.query(Attitude.id).all()
        t = env.get_template("list.html")
        return t.render(measurements=measurements)

@test.route("/<id>/")
def measurement(id):
    with app.app_context():
        measurement = db.session.query(Attitude).get(id)
        return report(measurement.array,name=id)

test.run(debug=True)

