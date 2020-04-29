const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')

const userActivatedId = new mongoose.Types.ObjectId();
const userActivated = {
    _id: userActivatedId,
    name: "test",
    email: "test.test@gmail.com",
    password: "Matthias123",
    tokens: [{
        token: jwt.sign({ _id: userActivatedId }, process.env.JWT_SECRET),
    },],
    activated: true
};

const userUnactivatedId = new mongoose.Types.ObjectId();
const userUnactivated = {
    _id: userUnactivatedId,
    name: "test",
    email: "test.unactivated@gmail.com",
    password: "Matthias123",
    tokens: [{
        token: jwt.sign({ _id: userUnactivatedId }, process.env.JWT_SECRET),
    },],
    activated: false
};

const activationTokenForUnactivated=jwt.sign({ _id: userUnactivatedId }, process.env.JWT_SECRET_EMAIL)

const setupDatabase = async () => {
    await User.deleteMany();
    await new User(userActivated).save();
    await new User(userUnactivated).save();
}

module.exports = {
    userActivatedId,
    userActivated,
    userUnactivatedId,
    userUnactivated,
    activationTokenForUnactivated,
    setupDatabase
}