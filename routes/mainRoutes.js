const { Router } = require("express");

const { showSignUpPage, showLoginPage, handleLogin, handleSignUp, getForms, handleRole, handlePayment, showDashboard, showTasksPage, handleUpload, getPDF, routeSetup, handleExtra, showLandingPage } = require("../controllers/mainControllers");

const router = Router();

router.use(routeSetup);

router.get('/', showLandingPage);

router.get("/signup", showSignUpPage);

router.get("/login", showLoginPage);

router.get("/dashboard", showDashboard);

router.get("/tasks", showTasksPage);


router.post("/get-form", getForms);

router.post("/login", handleLogin);

router.post("/signup", handleSignUp);

router.post("/select-role", handleRole);

router.post("/extra", handleExtra);

router.post("/finalize-payment", handlePayment);

router.post("/upload", handleUpload);

router.get('/get-pdf/:file/:type?', getPDF);

module.exports = router;