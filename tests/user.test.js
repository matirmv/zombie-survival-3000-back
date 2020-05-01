const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userActivatedId, userActivated, activationTokenForUnactivated, setupDatabase } = require("./fixtures/db");
const { error } = require("../src/shared/errors")

beforeEach(setupDatabase);

test("Should signup a new user", async () => {
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

    expect(response.body.error).toEqual(error.USER_INCORRECT_CREDENTIALS)
});

test("Should not login activated user if bad credentials provided (good", async () => {
    let response;
    response = await request(app)
        .post("/users/login")
        .send({
            email: "test.activated@gmail.com",
            password: "Matthias12",
        })
        .expect(400);

    expect(response.body.error).toEqual(error.USER_INCORRECT_CREDENTIALS)

    response = await request(app)
        .post("/users/login")
        .send({
            email: "test.activat@gmail.com",
            password: "Matthias123",
        })
        .expect(400);

    expect(response.body.error).toEqual(error.USER_INCORRECT_CREDENTIALS)

    response = await request(app)
        .post("/users/login")
        .send({
            email: "",
            password: "",
        })
        .expect(400);

    expect(response.body.error).toEqual(error.USER_INCORRECT_CREDENTIALS)

    response = await request(app)
        .post("/users/login")
        .send({
            email: "test.activat@gmail.com",
            password: "",
        })
        .expect(400);

    expect(response.body.error).toEqual(error.USER_INCORRECT_CREDENTIALS)

    response = await request(app)
        .post("/users/login")
        .send({
            email: "test.activat@gmail.com",
            password: "",
        })
        .expect(400);

    expect(response.body.error).toEqual(error.USER_INCORRECT_CREDENTIALS)
});

test("Should not login unactivated user", async () => {
    const response = await request(app)
        .post("/users/login")
        .send({
            email: "test.unactivated@gmail.com",
            password: "Matthias123",
        }).expect(400)

    expect(response.body.error).toEqual(error.USER_NOT_ACTIVATED)
});

test("should login unactivated user after activation", async () => {
    await request(app).post('/users/activate').send({
        token: activationTokenForUnactivated
    }).expect(200)

    await request(app).post('/users/login').send({
        email: "test.unactivated@gmail.com",
        password: "Matthias123",
    }).expect(200)
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

test("Should not upload avatar image", async () => {
    await request(app)
        .post("/users/me/avatar")
        .set("Authorization", `Bearer ${userActivated.tokens[0].token}`)
        .attach("upload", "./tests/fixtures/coree-du-sud-ville.jpg")
        .expect(400);
});

test("Should upload avatar image", async () => {
    await request(app)
        .post("/users/me/avatar")
        .set("Authorization", `Bearer ${userActivated.tokens[0].token}`)
        .attach(
            "upload",
            "./tests/fixtures/Why-is-the-world-obsessed-with-all-things-Korean.jpg"
        )
        .expect(200);

    const user = await User.findById(userActivatedId);
    expect(user.avatar).toEqual(expect.any(Buffer));
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