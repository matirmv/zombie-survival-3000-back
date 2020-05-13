const request = require("supertest");
const app = require("../src/app");
const setCookieParser = require('set-cookie-parser')
const User = require("../src/models/user");
const {
    userActivated,
    userActivatedId,
    userActivatedWithMutlipleTokens,
    userActivatedWithMutlipleTokensId,
    activationTokenForUnactivated,
    expiredActivationTokenForUnactivated,
    resetPasswordToken,
    expiredResetPasswordToken,
    setupDatabase,
} = require("./fixtures/db");
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

    const cookie = parseCookie(response)
    expect(cookie.auth_token).toBeUndefined()

    expect(response.body).toMatchObject({

        name: "Matthias",
        email: "ferraina.matthias@gmail.com"

    });

    expect(user.password).not.toBe("Matthias123");
});




it('Signup user unactivated should not retrieve information', async () => {
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

it('Try to signup with no information should throw an error', async () => {
    await request(app).post('/users').send().expect(400)
})


it("Should login activated user", async () => {
    const response = await request(app)
        .post("/users/login")
        .send({
            email: "test.activated@gmail.com",
            password: "Matthias123",
        })
        .expect(200);

    const cookie = parseCookie(response)

    const user = await User.findById(response.body.user._id);
    expect(cookie.auth_token.value).toEqual(user.tokens[1].token)
});


it("Should not login activated user if bad credentials provided", async () => {
    const response = await request(app)
        .post("/users/login")
        .send({
            email: "test.activated@gmail.com",
            password: "Matthias12",
        })
        .expect(400);

    expect(response.body.type).toEqual('USER_INCORRECT_CREDENTIALS')

    const cookie = parseCookie(response)
    expect(cookie.auth_token).toBeUndefined()
});


it("Should not login activated user if bad credentials provided", async () => {
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


it("Should not login unactivated user", async () => {
    const response = await request(app)
        .post("/users/login")
        .send({
            email: "test.unactivated@gmail.com",
            password: "Matthias123",
        }).expect(400)

    expect(response.body.type).toEqual('USER_NOT_ACTIVATED')
});


it('should not activate user clicking on activation link 24 hours after sending', async () => {

    const response = await request(app).post('/users/activate').send({ token: expiredActivationTokenForUnactivated })
        .expect(400)

    expect(response.body.type).toEqual('USER_ACTIVATION_TOKEN_EXPIRED')

})

it('should not activate user clicking with an invalid activation token', async () => {

    const response = await request(app).post('/users/activate').send({ token: "eyJhbGciOiJIUzIInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZWFlYjM0MDEwZjRmNTQ5OTRiZWU5NWIiLCJpYXQiOjE1ODg1MDc0NTYsImV4cCI6MTU4ODUwNzQ2Nn0.iUVrNrDiKMQ_LDUQHaU0wcdlbCGj4JmleKwmTGg1i-0" })
        .expect(400)

    expect(response.body.type).toEqual('USER_TOKEN_ERROR')

})


it("should login unactivated user after activation", async () => {
    await request(app).post('/users/activate').send({
        token: activationTokenForUnactivated
    }).expect(200)

    await request(app).post('/users/login').send({
        email: "test.unactivated@gmail.com",
        password: "Matthias123",
    }).expect(200)
})

it("should send an activation for valid email existing in db", async () => {
    await request(app).post('/users/sendActivationEmail').send({ email: 'test.unactivated@gmail.com' }).expect(200)
})

it("should not send an activation for valid email not existing in db", async () => {
    const response = await request(app).post('/users/sendActivationEmail').send({ email: 'test.unctivated@gmail.com' }).expect(400)
    expect(response.body.name).toEqual('ResourceNotFoundError')
})

it("should not send an activation for invalid email", async () => {
    await request(app).post('/users/sendActivationEmail').send({ email: 'test.unactivatedgmail.com' }).expect(400)
})


it("Should get profile for user", async () => {
    await request(app)
        .get("/users/me")
        .set('Cookie', `auth_token=${userActivated.tokens[0].token}`)
        .send()
        .expect(200);
});


it("Should not get profile for user not connected", async () => {
    await request(app).get("/users/me").send().expect(401);
});


it("should delete account for user", async () => {
    const response = await request(app)
        .delete("/users/me")
        .set('Cookie', `auth_token=${userActivated.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(response.body._id);
    expect(user).toBeNull();
});


it("should not delete account for user", async () => {
    await request(app).delete("/users/me").send().expect(401);
});

it("Should update username", async () => {
    const response = await request(app)
        .patch("/users/me")
        .set('Cookie', `auth_token=${userActivated.tokens[0].token}`)
        .send({
            name: "matthias",
        })
        .expect(200);

    expect(response.body.name).toBe("matthias");
});


it("Should not update username", async () => {
    const response = await request(app)
        .patch("/users/me")
        .send({
            names: "fezfe",
        })
        .expect(401);
});

it("Should not update username with void body", async () => {
    const response = await request(app)
        .patch("/users/me")
        .set('Cookie', `auth_token=${userActivated.tokens[0].token}`)
        .send()
        .expect(400);
});

it("Should not update username with bad patch fields", async () => {
    const response = await request(app)
        .patch("/users/me")
        .set('Cookie', `auth_token=${userActivated.tokens[0].token}`)
        .send({ password: "rest" })
        .expect(400);

    expect(response.body.error).toEqual('Invalid update !')
});

it("Should send email to reset the password for activated account", async () => {
    const response = await request(app)
        .post("/users/sendResetPasswordEmail")
        .send({ email: "test.activated@gmail.com" })
        .expect(200)
})

it("Should send email to reset the password for unactivated account", async () => {
    const response = await request(app)
        .post("/users/sendResetPasswordEmail")
        .send({ email: "test.unactivated@gmail.com" })
        .expect(200)
})

it("Should not send email for unknown account", async () => {
    const response = await request(app)
        .post("/users/sendResetPasswordEmail")
        .send({ email: "zozo.zozo@gmail.com" })
        .expect(400)
})

it("Should reset password for user with good token", async () => {
    await request(app)
        .post("/users/resetPassword")
        .send({ password: "ezevyuvguzq", token: resetPasswordToken })
        .expect(200)

})


it("Should not reset password for user with expired token", async () => {
    const response = await request(app)
        .post("/users/resetPassword")
        .send({ password: "ezevyuvguzq", token: expiredResetPasswordToken })
        .expect(400)

    expect(response.body.type).toEqual('USER_ACTIVATION_TOKEN_EXPIRED')
})

it("Should logout user by removing the token from its tokens array", async () => {

    await request(app)
        .post('/users/me/logout')
        .set('Cookie', `auth_token=${userActivated.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(userActivatedId);
    expect(user.tokens.length).toEqual(0)
})


it("Should logout user by removing all the token from its tokens array", async () => {

    await request(app)
        .post('/users/me/logoutAll')
        .set('Cookie', `auth_token=${userActivatedWithMutlipleTokens.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(userActivatedWithMutlipleTokensId);
    expect(user.tokens.length).toEqual(0)
})


// Functions to help redundant testing
async function userLoginShouldFail(email, password) {
    const response = await request(app)
        .post("/users/login")
        .send({
            email,
            password
        })
        .expect(400);

    const cookie = parseCookie(response)
    expect(cookie.auth_token).toBeUndefined()

    return response
}




function parseCookie(res) {
    return setCookieParser(res, {
        map: true
    });
}
