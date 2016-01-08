#!/usr/bin/env python

from flask import Flask
import logging

logging.basicConfig(level=logging.INFO)

test = Flask(__name__)

from collections import namedtuple
from elevation import app, db
from elevation.models import Attitude, AttitudeGroup
from attitude.display import env, report
from attitude.orientation.tests import test_cases

result = namedtuple('Result',('id'))

@test.route("/")
def list():
    """
    List of test cases
    """
    with app.app_context():
        measurements = [result(i[0]) for i in
                db.session.query(Attitude.id).all()]
        measurements += [result('G'+str(i[0])) for i in
                db.session.query(AttitudeGroup.id).all()]
        measurements += test_cases
        t = env.get_template("list.html")
        return t.render(measurements=measurements)

@test.route("/<id>/")
def measurement(id):
    with app.app_context():
        try:
            if id.startswith('G'):
                id = int(id[1:])
                m = (db.session.query(AttitudeGroup).get(id))
                measurements = [i.centered_array
                        for i in m.measurements]
            else:
                id = int(id)
                m = db.session.query(Attitude).get(id)
                measurements = [m.centered_array]
        except ValueError:
             measurements = [i for i in test_cases if i.id == id]
        kwargs = dict(name=id)
        return report(*measurements, **kwargs)

test.run(debug=True)

