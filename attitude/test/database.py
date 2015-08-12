from dataset import connect

db = connect('sqlite:///:memory:')

table = db['test_cases']

table.insert(dict(name='test-1'))


