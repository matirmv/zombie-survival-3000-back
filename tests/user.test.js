const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userActivatedId, userActivated, activationTokenForUnactivated, setupDatabase, expiredActivationTokenForUnactivated } = require("./fixtures/db");
beforeEach(setupDatabase);


it("Should signup a new user", async () => {
    const response = await request(app)
        .post("/users")
        .send({
            name: "Matthias",
            email: "ferraina.matthias@gmail.com",
            password: "Matthias123",
        })
        .expect(201);

    const user = await User.findById(response.body._id);
    expect(user).not.toBeNull();

    expect(user.activated).toEqual(false);

    expect(response.body).toMatchObject({

        name: "Matthias",
        email: "ferraina.matthias@gmail.com"

    });

    expect(user.password).not.toBe("Matthias123");
});


test('Signup user unactivated should not retrieve information', async () => {
    await request(app)
        .post("/users")
        .send({
            name: "Matthias",
            email: "ferraina.matthias@gmail.com",
            password: "Matthias123",
        })
        .expect(201);

    await request(app).get('/users/me').send().expect(401);

})


test("Should login activated user", async () => {
    const response = await request(app)
        .post("/users/login")
        .send({
            email: "test.activated@gmail.com",
            password: "Matthias123",
        })
        .expect(200);

    const user = await User.findById(response.body.user._id);
    expect(response.body.token).toBe(user.tokens[1].token);
});


test("Should not login activated user if bad credentials provided", async () => {
    const response = await request(app)
        .post("/users/login")
        .send({
            email: "test.activated@gmail.com",
            password: "Matthias12",
        })
        .expect(400);

    expect(response.body.type).toEqual('USER_INCORRECT_CREDENTIALS')
});


test("Should not login activated user if bad credentials provided (good", async () => {
    let response;

    response = await userLoginShouldFail('test.activat@gmail.com', "Matthias12")
    expect(response.body.type).toEqual('USER_INCORRECT_CREDENTIALS')

    response = await userLoginShouldFail('test.activat@gmail.com', "Matthias123")
    expect(response.body.type).toEqual('USER_INCORRECT_CREDENTIALS')


    response = await userLoginShouldFail("", "")
    expect(response.body.type).toEqual('USER_INCORRECT_CREDENTIALS')


    response = await userLoginShouldFail("test.activat@gmail.com", "")
    expect(response.body.type).toEqual('USER_INCORRECT_CREDENTIALS')


    response = await userLoginShouldFail("test.activat@gmail.com", "")
    expect(response.body.type).toEqual('USER_INCORRECT_CREDENTIALS')


});


test("Should not login unactivated user", async () => {
    const response = await request(app)
        .post("/users/login")
        .send({
            email: "test.unactivated@gmail.com",
            password: "Matthias123",
        }).expect(400)

    expect(response.body.type).toEqual('USER_NOT_ACTIVATED')
});


test('should not activate user clicking on activation link 24 hours after sending', async () => {

    const response = await request(app).post('/users/activate').send({ token: expiredActivationTokenForUnactivated })
        .expect(400)

    expect(response.body.type).toEqual('USER_ACTIVATION_TOKEN_EXPIRED')

})

test('should not activate user clicking with an invalid activation token', async () => {

    const response = await request(app).post('/users/activate').send({ token: "eyJhbGciOiJIUzIInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZWFlYjM0MDEwZjRmNTQ5OTRiZWU5NWIiLCJpYXQiOjE1ODg1MDc0NTYsImV4cCI6MTU4ODUwNzQ2Nn0.iUVrNrDiKMQ_LDUQHaU0wcdlbCGj4JmleKwmTGg1i-0" })
        .expect(400)

    expect(response.body.type).toEqual('USER_TOKEN_ERROR')

})


test("should login unactivated user after activation", async () => {
    await request(app).post('/users/activate').send({
        token: activationTokenForUnactivated
    }).expect(200)

    await request(app).post('/users/login').send({
        email: "test.unactivated@gmail.com",
        password: "Matthias123",
    }).expect(200)
})

test("should send an activation for valid email existing in db", async () => {
    await request(app).post('/users/sendActivationEmail').send({ email: 'test.unactivated@gmail.com' }).expect(200)
})

test("should not send an activation for valid email not existing in db", async () => {
    const response = await request(app).post('/users/sendActivationEmail').send({ email: 'test.unctivated@gmail.com' }).expect(400)
    expect(response.body.name).toEqual('ResourceNotFoundError')
})

test("should not send an activation for invalid email", async () => {
    await request(app).post('/users/sendActivationEmail').send({ email: 'test.unactivatedgmail.com' }).expect(400)
})


test("Should get profile for user", async () => {
    await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userActivated.tokens[0].token}`)
        .send()
        .expect(200);
});


test("Should not get profile for user not connected", async () => {
    await request(app).get("/users/me").send().expect(401);
});


test("should delete account for user", async () => {
    const response = await request(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${userActivated.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(response.body._id);
    expect(user).toBeNull();
});


test("should not delete account for user", async () => {
    await request(app).delete("/users/me").send().expect(401);
});

test("Should update username", async () => {
    const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${userActivated.tokens[0].token}`)
        .send({
            name: "matthias",
        })
        .expect(200);

    expect(response.body.name).toBe("matthias");
});


test("Should not update username", async () => {
    const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${userActivated.tokens[0].token}`)
        .send({
            names: "fezfe",
        })
        .expect(400);
});

// Functions to help redundant testing
async function userLoginShouldFail(email, password) {
    return await request(app)
        .post("/users/login")
        .send({
            email,
            password
        })
        .expect(400);
}
