const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const { userActivated, userActivatedId, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should create task for user', async() => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userActivated.tokens[0].token}`)
        .send({
            description: 'From my test'
        })
        .expect(201)
})