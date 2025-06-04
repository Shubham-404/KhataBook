const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const debug = require("debug")("khaata:app");
const userModel = require("./utils/models/user");
require("./utils/mongo"); // Assuming this connects to MongoDB
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(expressLayouts);

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Centralized locals configuration
const getLocals = (title, header, extra = {}) => ({
    title: `Khaata | ${title}`,
    description: "This is a small khata book clone built with Tailwind and EJS.",
    header,
    ...extra,
});

// Middleware for input validation
const validateUserInput = (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        debug("Missing username or password.");
        return res.redirect(`${req.path === "/save" ? "/signup" : "/login"}?error=missing`);
    }
    next();
};

// Middleware to check if user exists (for signup)
const checkUserExists = async (req, res, next) => {
    try {
        const { username } = req.body;
        const existingUser = await userModel.findOne({ username });
        if (existingUser) {
            debug("User already exists:", username);
            return res.redirect("/signup?error=exists");
        }
        next();
    } catch (err) {
        next(err);
    }
};

// Middleware to verify user credentials (for login)
const verifyUserCredentials = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await userModel.findOne({ username, password });
        if (!user) {
            debug("Invalid username or password.");
            return res.redirect("/login?error=invalid");
        }
        req.user = user; // Attach user to request for downstream use
        next();
    } catch (err) {
        next(err);
    }
};

// Error handling middleware
app.use((err, req, res, next) => {
    debug("Error occurred:", err.message);
    res.status(500).render("pages/error", {
        ...getLocals("Error", "Error"),
        message: "Something went wrong. Please try again later.",
    });
});

// Routes
// Home
app.get("/", (req, res) => {
    res.render("pages/home", getLocals("Home Page", "Home Page"));
});

// Signup
app.get("/signup", (req, res) => {
    res.render("pages/signup", getLocals("Sign Up", "Sign Up", {
        query: req.query
    }));
});

// Save User
app.post("/save", [validateUserInput, checkUserExists], async (req, res, next) => {
    try {
        const { username, password, name, image = "" } = req.body;
        await userModel.create({ username, password, name, image });
        debug("New user created:", username);
        res.redirect("/login?success=created");
    } catch (err) {
        next(err);
    }
});

// Login
app.get("/login", (req, res) => {
    res.render("pages/login", getLocals("Login",
        "Login",
        {
            query: req.query
        }
    ));
});

// Login Verification
app.post("/verify", [validateUserInput, verifyUserCredentials], (req, res) => {
    const { username } = req.body;
    debug("User logged in:", username);
    res.redirect(`/${username}/hisaab`);
});

// My Hisaab (unchanged from previous response)
app.get("/:username/hisaab", async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await userModel.findOne({ username });
        if (!user) {
            debug("User not found:", username);
            return res.redirect("/login?error=invalid");
        }
        const hisaabs = user.hisaabs || ["No Hisaab Found"];
        const name = user.name || "User";
        // console.log("Hisaabs found:", hisaabs);
        res.render("pages/myHisaab", getLocals("My Hisaab", "Hisaab Page", { username, name, hisaabs }));
    } catch (err) {
        next(err);
    }
});

// -----------------------------------------------------------------add Hisaab page
app.get("/:username/addHisaab", async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await userModel.findOne({ username });
        const date = new Date();
        let month = date.getMonth() + 1;
        month = month < 10 ? `0${month}` : month; // Ensure two-digit month
        const today = `${date.getFullYear()}-${month}-${date.getDate()}`;
        if (!user) {
            debug("User not found:", username);
            return res.redirect("/login?error=invalid");
        }

        res.render("pages/addHisaab", getLocals("Add Hisaab", "Hisaab Page", { username, today }));
    } catch (err) {
        next(err);
    }
});

// Add Hisaab (unchanged for brevity, but can also use middleware for user validation)
app.post("/saveHisaab", async (req, res, next) => {
    try {
        const { username, date, amount, description, encrypt, passcode } = req.body;
        console.log("Received data:", { date, username, amount, description, encrypt, passcode });
        if (!amount) {
            console.log("Missing description.");
            return res.redirect(`/${username}/hisaab?error=missing`);
        }

        const hisaabData = {
            date: date || Date.now(),
            amount,
            description : description || "No description provided",
            encrypt: encrypt === "on" ? true : false,
            passcode: passcode || 'none',
            createdAt: Date.now(),
            updatedAt: Date.now(),

        };
        // Find the user
        const user = await userModel.findOne({ username });
        if (!user) {
            console.log("User not found.");
            res.redirect("/signup?error=notfound");
        }
        user.hisaabs.push(hisaabData);
        await user.save();
        console.log("New hisaab added successfully");
        res.redirect(`/${username}/hisaab?success=added`)

    } catch (err) {
        console.log("Cannot add to database.")
        next(err);
    }
});

// Edit Hisaab (unchanged for brevity)
app.get("/:username/edit/:id", async (req, res, next) => {
    try {
        const { username, id } = req.params;
        const user = await userModel.findOne({ username });
        const today = new Date();
        if (!user) {
            debug("User not found:", username);
            return res.redirect("/login?error=invalid");
        }
        const hisaab = user.hisaabs.id(id);
        if (!hisaab) {
            debug("Hisaab not found:", id);
            return res.redirect(`/${username}/hisaab?error=notfound`);
        }
        res.render("pages/editHisaab", getLocals("Edit Hisaab", "Edit Hisaab Page", {
            today,
            username,
            hisaab: {
                id,
                date: hisaab.date,
                amount: hisaab.amount,
                description: hisaab.description,
                encrypt: hisaab.encrypt,
                passcode: hisaab.passcode
            }
        }));
    } catch (err) {
        next(err);
    }
});


// Testing Routes (unchanged for brevity)
app.get("/readall", async (req, res, next) => {
    try {
        const users = await userModel.find();
        if (!users.length) {
            debug("No users found.");
            return res.status(404).send("No users found.");
        }
        res.json(users);
    } catch (err) {
        next(err);
    }
});

app.get("/readallhisaab", async (req, res, next) => {
    try {
        const hisaab = await userModel.find();
        if (!hisaab.length) {
            debug("No hisaab found.");
            return res.status(404).send("No hisaab found.");
        }
        res.json(hisaab);
    } catch (err) {
        next(err);
    }
});

app.get("/eraseall", async (req, res, next) => {
    try {
        await userModel.deleteMany({});
        debug("All users erased.");
        res.redirect("/");
    } catch (err) {
        next(err);
    }
});

// About Page
app.get("/about", (req, res) => {
    res.render("pages/about", getLocals("About", "About Page", {
        message: "This is the about page of the khata book clone. It is a simple application built with EJS and Tailwind CSS.",
    }));
});
app.get("/contact", (req, res) => {
    res.render("pages/contact", getLocals("About", "About Page", {
        message: "This is the about page of the khata book clone. It is a simple application built with EJS and Tailwind CSS.",
    }));
});

// 404 Handler
app.get(/.*/, (req, res) => {
    debug("Page not found:", req.originalUrl);
    res.status(404).render("pages/notFound", getLocals("404", "404 Page", { message: "Page not found." }));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server live at http://localhost:${PORT}`);
});