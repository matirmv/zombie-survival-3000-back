const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Task = require("../models/task");
const { error } = require('../shared/errors')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw new Error("Password field should not contain password string.");
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid");
            }
        },
        trim: true,
        lowercase: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error("Age must be a positive number");
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    },
    activated: {
        type: Boolean,
        default: false,
        required: true
    }
}, { timestamps: true });

userSchema.virtual("tasks", {
    ref: "Task",
    localField: "_id",
    foreignField: "owner"
});

userSchema.methods.toJSON = function () {
    const user = this;

    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
};

userSchema.methods.generateActivationToken = function () {
    const user = this
    const activationToken = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET_EMAIL)

    return activationToken
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens.push({ token });
    await user.save();

    return token;
};

userSchema.methods.activateUser = async function () {
    const user = this;
    user.activated = true;
    await user.save();
    return user
}

userSchema.statics.verifyActivationToken = function (activationToken) {
    const verifiedToken = jwt.verify(activationToken, process.env.JWT_SECRET_EMAIL);
    return verifiedToken
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    let isMatch = false;
    if (user) {
        isMatch = await bcrypt.compare(password, user.password);
    }

    if (!user || !isMatch) {
        throw new Error(error.USER_INCORRECT_CREDENTIALS);
    }

    return user;
};

userSchema.pre("save", async function (next) {
    const user = this;

    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

userSchema.pre("remove", async function (next) {
    const user = this;

    await Task.deleteMany({ owner: user._id });

    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;