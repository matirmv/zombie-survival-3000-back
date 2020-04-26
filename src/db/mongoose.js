const mongoose = require("mongoose");


mongoose.connect(process.env.MONGODB_DATABASE_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});