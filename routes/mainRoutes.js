const { Router } = require("express");

const { showSignUpPage, showLoginPage, handleLogin, handleSignUp, getForms } = require("../controllers/mainControllers");

const router = Router();

router.get('/', (req, res) => {
    res.send("Insert landing page here")
});

router.get("/signup", showSignUpPage);

router.get("/login", showLoginPage);


router.post("/get-form", getForms)

router.post("/login", handleLogin)

router.post("/signup", handleSignUp)

module.exports = router;