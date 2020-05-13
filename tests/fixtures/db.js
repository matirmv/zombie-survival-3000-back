const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')

const userActivatedId = new mongoose.Types.ObjectId();
const userActivated = {
    _id: userActivatedId,
    name: "test",
    email: "test.activated@gmail.com",
    password: "Matthias123",
    tokens: [{
        token: jwt.sign({ _id: userActivatedId }, process.env.JWT_SECRET),
    },],
    activated: true
};

const userUnactivatedId = new mongoose.Types.ObjectId();
const userUnactivated = {
    _id: userUnactivatedId,
    name: "test1",
    email: "test.unactivated@gmail.com",
    password: "Matthias123",
    tokens: [{
        token: jwt.sign({ _id: userUnactivatedId }, process.env.JWT_SECRET),
    },],
    activated: false
};
const userActivatedWithMutlipleTokensId = new mongoose.Types.ObjectId();
const userActivatedWithMutlipleTokens = {
    _id: userActivatedWithMutlipleTokensId,
    name: "test2",
    email: "multiple.activated@gmail.com",
    password: "Matthias123",
    tokens: [{
        token: jwt.sign({ _id: userActivatedWithMutlipleTokensId }, process.env.JWT_SECRET),
        token: jwt.sign({ _id: userActivatedWithMutlipleTokensId }, process.env.JWT_SECRET),
        token: jwt.sign({ _id: userActivatedWithMutlipleTokensId }, process.env.JWT_SECRET),
        token: jwt.sign({ _id: userActivatedWithMutlipleTokensId }, process.env.JWT_SECRET),
    },],
    activated: true
}

const activationTokenForUnactivated = jwt.sign({ _id: userUnactivatedId }, process.env.JWT_SECRET_EMAIL)
const expiredActivationTokenForUnactivated = jwt.sign({ _id: userUnactivatedId }, process.env.JWT_SECRET_EMAIL, { expiresIn: '0.1s' })

const resetPasswordToken = jwt.sign({ _id: userActivatedId }, process.env.JWT_SECRET_PASSWORD)
const expiredResetPasswordToken = jwt.sign({ _id: userActivatedId }, process.env.JWT_SECRET_PASSWORD, { expiresIn: '0.1s' })

const setupDatabase = async () => {
    await User.deleteMany();
    await new User(userActivated).save();
    await new User(userUnactivated).save();
    await new User(userActivatedWithMutlipleTokens).save();
}

module.exports = {
    userActivatedId,
    userActivated,
    userUnactivatedId,
    userUnactivated,
    activationTokenForUnactivated,
    expiredActivationTokenForUnactivated,
    resetPasswordToken,
    expiredResetPasswordToken,
    userActivatedWithMutlipleTokens,
    userActivatedWithMutlipleTokensId,
    setupDatabase,
}