#!/usr/bin/env python

from flask import Flask

test = Flask(__name__)

from collections import namedtuple
from syrtis.core import app, db
from syrtis.models import Attitude, AttitudeGroup
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
    acc = lambda m: m.array
    with app.app_context():
        try:
            if id.startswith('G'):
                id = int(id[1:])
                model = AttitudeGroup
                acc = lambda m: m.centered_array
            else:
                id = int(id)
                model = Attitude
            measurement = db.session.query(model).get(id)
        except Exception:
             _ = [i for i in test_cases if i.id == id]
             measurement = _[0]
        return report(acc(measurement),name=id)

test.run(debug=True)

