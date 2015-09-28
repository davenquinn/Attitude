#!/usr/bin/env python

from flask import Flask

test = Flask(__name__)

from syrtis.core import app, db
from syrtis.models import Attitude
from attitude.display import env, report
from attitude.orientation.tests import test_cases

@test.route("/")
def list():
    """
    List of test cases
    """
    with app.app_context():
        measurements = db.session.query(Attitude.id).all()
        measurements += test_cases
        t = env.get_template("list.html")
        return t.render(measurements=measurements)

@test.route("/<id>/")
def measurement(id):
    with app.app_context():
        try:
            measurement = db.session.query(Attitude).get(id)
        except Exception:
            _ = [i for i in test_cases if i.id == id]
            measurement = _[0]
        return report(measurement.array,name=id)

test.run(debug=True)

