const { Router } = require("express");

const { showSignUpPage, showLoginPage, handleLogin, handleSignUp, getForms, handleRole, handlePayment, showDashboard, showTasksPage, handleUpload, getPDF, routeSetup, handleExtra, showLandingPage, handleAddingTasks, getItems, handleAcceptingTasks, handleChatUpload, handleChatMessage, handleCertifyingTasks, logout } = require("../controllers/mainControllers");

const router = Router();


router.post("/get-form", getForms);

router.post("/login", handleLogin);

router.post("/signup", handleSignUp);

router.post("/select-role", handleRole);

router.post("/extra", handleExtra);

router.post("/finalize-payment", handlePayment);

router.post("/upload", handleUpload);

router.post("/chat-upload", handleChatUpload)

router.post("/chat-message", handleChatMessage)

router.post("/add-task", handleAddingTasks);

router.post("/accept-task", handleAcceptingTasks);

router.post("/certify-task", handleCertifyingTasks)

router.get('/get-pdf/:file/:type?', getPDF);

router.post('/get-items', getItems);

router.get('/', showLandingPage);

router.get("/signup", showSignUpPage);

router.get("/login", showLoginPage);

router.get("/logout", logout);

router.get("/test", (req, res) => {
    const data = {
        owner: 'dada teniola',
        task: 'online library managament system',
        reviewer: 'ezenagu divine'
    }

    res.render('partials/template', data)
})

router.use(routeSetup);


router.get("/dashboard", showDashboard);

router.get("/tasks", showTasksPage);


module.exports = router;