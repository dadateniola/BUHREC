const { Router } = require("express");

const { showSignUpPage, showLoginPage, handleLogin, handleSignUp, getForms, handleRole, handlePayment } = require("../controllers/mainControllers");

const router = Router();

router.get('/', (req, res) => {
    res.send("/landing")
});

router.get("/signup", showSignUpPage);

router.get("/login", showLoginPage);


router.post("/get-form", getForms)

router.post("/login", handleLogin)

router.post("/signup", handleSignUp)

router.post("/select-role", handleRole)

router.post("/finalize-payment", handlePayment)

module.exports = router;