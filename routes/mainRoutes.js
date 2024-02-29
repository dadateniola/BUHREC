const { Router } = require("express");

const { showSignUpPage, showLoginPage } = require("../controllers/mainControllers");

const router = Router();

router.get('/', (req, res) => {
    res.send("/landing")
});

router.get("/signup", showSignUpPage);

router.get("/login", showLoginPage);

module.exports = router;