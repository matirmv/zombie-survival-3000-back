const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/user");
const multer = require("multer");
const { sendActivationEmail, sendCancelationEmail, sendResetPasswordEmail } = require('../emails/account')
const router = new express.Router();
const ResourceNotFoundError = require('../shared/ResourceNotFoundError')
const CustomError = require('../shared/CustomError')
const { cookieConfig } = require('../shared/config/cookieConfig')

router.post("/users", async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const activationToken = user.generateActivationToken();
        await sendActivationEmail(user.email, user.name, activationToken)
        res.status(201).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );

        if (!user.activated) {
            throw new CustomError('USER_NOT_ACTIVATED');
        }

        const token = await user.generateAuthToken();

        res.cookie('auth_token', token, cookieConfig)
        res.status(200).send({ user });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post("/users/activate", async (req, res) => {
    try {
        const decodedToken = await User.verifyToken(req.body.token, process.env.JWT_SECRET_EMAIL)
        const user = await User.findById(decodedToken._id)
        const activatedUser = await user.activateUser();
        const token = await user.generateAuthToken();

        res.cookie('auth_token', token, cookieConfig)
        res.status(200).send({ activatedUser });

    } catch (err) {
        res.status(400).send(err)
    }
})

router.post('/users/sendActivationEmail', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })

        if (!user) {
            throw new ResourceNotFoundError("User", "email")
        }

        const activationToken = user.generateActivationToken();
        await sendActivationEmail(user.email, user.name, activationToken)

        res.status(200).send()

    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/users/sendResetPasswordEmail', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })

        if (!user) {
            throw new ResourceNotFoundError('User', 'email')
        }

        const resetPasswordToken = user.generateResetPasswordToken();
        await sendResetPasswordEmail(user.email, user.name, resetPasswordToken)

        res.status(200).send()
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post("/users/resetPassword", async (req, res) => {
    try {
        const decodedToken = await User.verifyToken(req.body.token, process.env.JWT_SECRET_PASSWORD)
        const user = await User.findById(decodedToken._id)
        await user.resetPassword(req.body.password);
        res.status(200).send();
    } catch (err) {
        res.status(400).send(err)
    }
})

router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(
            token => token.token !== req.token
        );
        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
    const updateFields = Object.keys(req.body);

    if (updateFields.length === 0) {
        return res.status(400).send({ error: "Invalid update !" });
    }

    const acceptedFields = ["name", "age", "email", "password"];
    const validOperation = updateFields.every(field =>
        acceptedFields.includes(field)
    );
    console.log(updateFields);


    if (!validOperation) {
        return res.status(400).send({ error: "Invalid update !" });
    }

    try {
        updateFields.forEach(field => (req.user[field] = req.body[field]));

        await req.user.save();

        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove();
        await sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please select an image"));
        }

        cb(null, true);
    }
});

module.exports = router;