const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

const fs = require('fs').promises;
const Methods = require("../Models/Methods");
const Model = require("../Models/Model");
const User = require("../Models/User");
const Task = require("../Models/Task");
const Activity = require("../Models/Activity");
const { log } = require('console');

const DEFAULT_USER_ID = '2';

const error_alert = {
    message: 'Internal Server Error',
    type: 'error'
}

const unauthorized_alert = {
    message: 'Cannot access the requested page',
    type: 'warning'
}

const courses = [
    'Software_Engineering',
    'Computer_Science',
    'Information_Technology',
    'Civil_Engineering',
    'Mechanical_Engineering',
    'Electrical_Engineering'
];

const tempFolder = path.resolve(__dirname, '..', 'temp');
const uploadsFolder = path.resolve(__dirname, '..', 'uploads', 'resources');
const certificatesFolder = path.resolve(__dirname, '..', 'uploads', 'certificates');

function isObject(value) {
    return (typeof value === 'object' && value !== null && !Array.isArray(value));
}

async function get_dashboard_info(params = {}) {
    const { uid, user } = params;
    const tasks = [];

    if (!uid) return [];

    const recentTasks = await Task.find(['user_id', uid]);
    const currentTasks = await Task.find(['reviewer_id', uid]);
    const openTasks = await Task.customSql(`SELECT * FROM tasks WHERE status = 'pending' AND user_id != ${uid}`);

    if (user.role != 'reviewer') tasks.push({ title: 'recent proposals', data: Methods.formatAllDates(recentTasks) })

    if (user.role != "student") tasks.push({ title: 'current proposals', data: Methods.formatAllDates(currentTasks) });
    if (user.role != "student") tasks.push({ title: 'open proposals', data: Methods.formatAllDates(openTasks) });

    return tasks;
}

async function get_tasks_info(params = {}) {
    const { uid, user } = params;
    const tasks = [];

    if (!uid) return [];

    const recentTasks = await Task.find(['user_id', uid]);
    const currentTasks = await Task.find(['reviewer_id', uid]);
    const allTasks = [...recentTasks, ...currentTasks]

    tasks.push({ title: 'all proposals', data: Methods.formatAllDates(allTasks) });

    return tasks;
}

async function generate_certificate(data, options = {}) {
    const filePath = path.resolve(__dirname, '..', 'pages', 'partials', 'template.ejs');
    const certificate = await fs.readFile(filePath, 'utf-8');

    const filename = Methods.uniqueID() + ".pdf";
    const compiledTemplate = ejs.render(certificate, data);
    const outputPath = path.resolve(certificatesFolder, filename);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the content of the page to the HTML content
    await page.setContent(compiledTemplate);

    // Generate PDF
    await page.pdf({ path: outputPath, format: options?.format || 'Ledger' });

    await browser.close();

    return filename;
}

const routeSetup = async (req, res, next) => {
    // req.session.uid = DEFAULT_USER_ID;
    const { alert, uid } = req.session;

    if (!uid) {
        req.session.alert = {
            message: "User login is required",
            type: 'warning',
        }
        return res.redirect("/");
    }

    try {
        const [user] = await User.find(['id', uid]);
        const allUsers = await User.find();

        // if(!user) {
        //     return res.redirect("/logout");
        // }

        const filename = Methods.tempFilename(user.id);
        const filePath = path.join(tempFolder, filename);
        const previewRoute = (await Methods.checkFileExistence({ filePath })) ? `/get-pdf/${filename}/preview` : null;

        res.locals.data = {
            user,
            allUsers,
            courses,
            previewRoute,
        }

        if (alert) {
            res.locals.data.alert = alert;
            delete req.session.alert;
        }

        next();
    } catch (error) {
        console.error('Error in routeSetup:', error);
        res.status(500).render('500', { error_alert });
    }
}

const showLandingPage = async (req, res) => {
    const { alert, uid } = req.session;
    const user_id = uid || 0;

    const user = await User.find(['id', user_id]);
    const isLoggedIn = user.length;

    delete req.session.alert;

    res.render("landing", { alert, isLoggedIn });
}

const showSignUpPage = (req, res) => {
    if (!isObject(req.session?.signup)) {
        req.session.signup = {
            active: 'create-an-account',
            completed: []
        }
    }

    const active = req.session.signup.active;
    const completed = req.session.signup.completed;
    const sidebar = [
        {
            head: 'Create an account',
            para: 'Enhance your experience by creating an account'
        },
        {
            head: 'Select a role',
            para: 'Choose a role to access relevant system features'
        },
        {
            head: 'Additional Information',
            para: 'Share more about yourself to tailor your experience'
        },
        {
            head: 'Add a credit card',
            para: 'Submit payment details to complete registration'
        },
        {
            head: 'Verification & Validation',
            para: 'Ensuring data accuracy and reliability'
        }
    ]

    res.render("signup", { sidebar, active, completed })
}

const showLoginPage = (req, res) => {
    if (!isObject(req.session?.login)) {
        req.session.login = {
            active: 'login-to-your-account',
            completed: []
        }
    }

    const active = req.session.login.active;
    const completed = req.session.login.completed;
    const sidebar = [
        {
            head: 'Login to your account',
            para: 'Enter your credentials to access your account'
        },
        {
            head: 'Verification & Validation',
            para: 'Trying to ensure data accuracy and reliability '
        }
    ]

    res.render("login", { sidebar, active, completed })
}

const showDashboard = async (req, res) => {
    const uid = req.session.uid;
    const [user] = await User.find(['id', uid]);

    const allTasks = await get_dashboard_info({ uid, user });

    res.render("dashboard", { allTasks });
}

const showTasksPage = async (req, res) => {
    const uid = req.session.uid;
    const [user] = await User.find(['id', uid]);

    const allTasks = await get_tasks_info({ uid, user });

    res.render("tasks", { allTasks });
}

const getForms = async (req, res) => {
    const { form } = req.body;
    const filePath = path.resolve(__dirname, '..', 'pages', 'forms', `${form}.ejs`);
    const data = {
        courses: courses
    };

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const form = ejs.render(fileContent, data);
        res.status(200).send({ html: form });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).send({ message: 'Internal Server Error', type: 'error' });
    }
}

const handleLogin = async (req, res) => {
    try {
        //Validate user information
        const methods = new Methods(req.body);
        const { invalidKeys } = methods.validateData();

        //Check if there is invalid data to send back to user
        if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

        const { email, password } = req.body;

        const [user] = await User.find(['email', email]);

        if (user) {
            const next = 'verification-&-validation';

            req.session.login.completed.push(req.session.login.active);
            req.session.login.active = next;

            const completed = req.session.login.completed;

            // Set user session ID
            req.session.uid = user.id;

            // Clear session data
            delete req.session.login;

            res.status(200).send({
                next,
                completed,
                alert: { message: 'Authentication successful, please wait as we clean up', type: 'success' },
            });
        } else {
            res.status(404).send({ message: 'Incorrect login credentials', type: 'warning' })
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const handleSignUp = async (req, res) => {
    try {
        //Validate user information
        const methods = new Methods(req.body);
        const { invalidKeys } = methods.validateData();

        //Check if there is invalid data to send back to user
        if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

        const next = 'select-a-role';

        const mailExists = await User.find(['email', req.body?.email]);

        if (mailExists.length) {
            res.status(400).send({ message: 'Email is already in use', type: 'warning' })
            return;
        }

        req.session.info = req.body;
        req.session.signup.completed.push(req.session.signup.active);
        req.session.signup.active = next;

        res.status(200).send({
            next,
            completed: req.session.signup.completed,
            alert: { message: 'User information has been stored temporarily', type: 'success' },
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const handleRole = (req, res) => {
    try {
        const { role } = req.body;

        if (!role) return res.status(400).send({ message: 'Please select at least one role', type: 'warning' });

        const next = 'additional-information';

        if (req.session.info) req.session.info.role = role;
        else {
            req.session.info = {};
            req.session.info.role = role;
        }

        req.session.signup.completed.push(req.session.signup.active);
        req.session.signup.active = next;

        res.status(200).send({
            next,
            completed: req.session.signup.completed,
            alert: { message: 'User role temporarily stored', type: 'success' },
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const handleExtra = async (req, res) => {
    try {
        //Validate user information
        const methods = new Methods(req.body);
        const { invalidKeys } = methods.validateData();

        //Check if there is invalid data to send back to user
        if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

        const next = 'add-a-credit-card';

        if (!req.session.info) req.session.info = {};
        for (const key in req.body) {
            req.session.info[key] = req.body[key];
        }

        req.session.signup.completed.push(req.session.signup.active);
        req.session.signup.active = next;

        res.status(200).send({
            next,
            completed: req.session.signup.completed,
            alert: { message: 'Additional information temporarily stored', type: 'success' },
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const handlePayment = async (req, res) => {
    // Validate user information
    const methods = new Methods(req.body);
    const { invalidKeys } = methods.validateData();

    // Check if there is invalid data to send back to user
    if (Object.keys(invalidKeys).length > 0) {
        return res.send({ invalidKeys });
    }

    try {
        // Create user account
        req.session.info.pfp = await Methods.getPFP();
        const user = new User(req.session.info);
        const result = await user.add();

        if (!result) {
            // Handle user creation failure
            return res.status(500).send({
                message: "Couldn't create user account, please reload the page and try again.",
                type: "error",
            });
        }

        // Update session information
        const next = 'verification-&-validation';

        req.session.signup.completed.push(req.session.signup.active);
        req.session.signup.active = next;

        const completed = req.session.signup.completed;

        // Set user session ID
        req.session.uid = user.id;

        // Clear session data
        delete req.session.info;
        delete req.session.signup;

        // Send response
        res.status(200).send({
            next,
            completed,
            alert: { message: 'Credit card added successfully, please wait as we clean up', type: 'success' },
        });
    } catch (error) {
        console.log(error); // Log error for debugging
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const handleUpload = async (req, res) => {
    if (!req?.files) return (req.aborted) ? console.log('Request aborted but still received') : console.log('Files not received');

    const { pdfFile } = req.files;
    const userId = req.session?.uid;

    if (!pdfFile || pdfFile.mimetype !== 'application/pdf') {
        return res.status(400).send({ message: 'You can only upload a valid PDF file', type: 'error' });
    }

    if (!userId) return res.status(401).send({ message: 'User authentication required, please login', type: 'warning' });

    const filename = Methods.tempFilename(userId);

    try {
        // Create the "temp" folder if it doesn't exist
        await fs.mkdir(tempFolder, { recursive: true });

        await pdfFile.mv(path.join(tempFolder, filename));

        return res.status(200).send({ filename });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).send({ message: 'Internal Server Error', type: 'error' });
    }
}

const handleChatUpload = async (req, res) => {
    try {
        const { task_id } = req.body;
        const { pdfFile } = req.files;
        const userId = req.session?.uid;

        if (!pdfFile || pdfFile.mimetype !== 'application/pdf') {
            return res.status(400).send({ message: 'You can only upload a valid PDF file', type: 'error' });
        }

        if (!userId) return res.status(401).send({ message: 'User authentication required, please login', type: 'warning' });

        const filename = Methods.uniqueID() + ".pdf";
        const activity_data = {
            task_id,
            user_id: userId,
            type: "file",
            title: "Attached a document",
            content: filename,
        }

        const activity = new Activity(activity_data);
        const activity_result = await activity.add();

        if (!activity_result) return res.status(500).send({ message: "Activity couldn't be added", type: "error" });

        // Create the "temp" folder if it doesn't exist
        await fs.mkdir(uploadsFolder, { recursive: true });

        await pdfFile.mv(path.join(uploadsFolder, filename));

        res.status(200).send({
            message: "Activity successfully added",
            type: "success",
        });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).send({ message: 'Internal Server Error', type: 'error' });
    }
}

const handleChatMessage = async (req, res) => {
    try {
        const { task_id, message } = req.body;
        const userId = req.session?.uid;

        if (!userId) return res.status(401).send({ message: 'User authentication required, please login', type: 'warning' });

        const activity_data = {
            task_id,
            user_id: userId,
            type: "text",
            title: "Made a comment",
            content: message,
        }

        const activity = new Activity(activity_data);
        const activity_result = await activity.add();

        if (!activity_result) return res.status(500).send({ message: "Activity couldn't be added", type: "error" });

        res.status(200).send({
            message: "Activity successfully added",
            type: "success",
            clean_up: 'message',
            task_id
        });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).send({ message: 'Internal Server Error', type: 'error' });
    }
}

const handleAddingTasks = async (req, res) => {
    try {
        const data = req.body;
        // Validate user information
        const methods = new Methods(data);
        const { invalidKeys } = methods.validateData();

        // Check if there is invalid data to send back to the user
        if (Object.keys(invalidKeys).length > 0) {
            return res.send({ invalidKeys });
        }

        //Check if user exists
        const userId = req.session.uid;

        if (!userId) return res.status(401).send({ message: 'User authentication required, please login', type: 'warning' });

        //Check if users file exists
        const filePath = path.join(tempFolder, Methods.tempFilename(userId));

        if (!(await Methods.checkFileExistence({ filePath }))) {
            return res.status(400).send({
                message: "No file found. Please upload a file before submitting the form",
                type: 'warning'
            });
        }

        const filename = Methods.uniqueID() + ".pdf";
        const destinationPath = path.join(uploadsFolder, filename);

        //Add the task to database
        data.user_id = userId;
        data.course = data.course.split("_").join(" ");

        const task = new Task(data);
        const task_result = await task.add();

        if (!task_result) return res.status(500).send({ message: "Unable to process request", type: "error" });

        //Create activity data
        const activity_data = {
            task_id: task.id,
            user_id: userId,
            type: 'file',
            title: 'Attached a document',
            content: filename
        }

        const activity = new Activity(activity_data);
        const activity_result = await activity.add();

        if (!activity_result) return res.status(500).send({ message: "Activity couldn't be added", type: "error" });

        //Move file to permanent spot
        await fs.rename(filePath, destinationPath);

        res.status(200).send({
            message: "Proposal successfully added",
            type: "success",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const handleAcceptingTasks = async (req, res) => {
    try {
        const { id } = req.body;
        const { uid } = req.session;
        const data = {
            id,
            reviewer_id: uid,
            status: 'in progress'
        }

        const task = new Task(data);
        await task.update();

        res.status(200).send({
            message: "Proposal accepted successfully",
            type: "success",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const handleCertifyingTasks = async (req, res) => {
    try {
        const { id } = req.body;

        const [task] = await Task.find(['id', id]);
        const [owner] = await User.find(['id', task?.user_id]);
        const [reviewer] = await User.find(['id', task?.reviewer_id]);

        const certificate_data = {
            owner: owner.fullname,
            reviewer: reviewer.fullname,
            task: task.task_name
        }

        const certificate = await generate_certificate(certificate_data);

        const data = {
            id,
            status: 'complete',
            certificate
        }

        const update_task = new Task(data);
        await update_task.update();

        res.status(200).send({
            message: "Proposal certified successfully",
            type: "success",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const getItems = async (req, res) => {
    const { table, custom, columns, userId } = req.body;

    if (userId) {
        req.body.id = req.session.uid;
        delete req.body.userId;
    }

    if (custom) {
        const items = await Model.customSql(custom);

        res.json(Methods.formatAllDates(items));
    } else {
        delete req.body.table;
        delete req.body.columns;

        const conditions = Object.entries(req.body);

        const items = await Model.find(conditions, table, columns);

        res.json(Methods.formatAllDates(items));
    }
}

const getPDF = async (req, res) => {
    try {
        const { file, type } = req.params;

        if (!file) return res.status(400).send('File not found');

        const halfPath = (type == 'preview') ?
            path.resolve('temp', file) :
            (type == 'certificate') ?
                path.resolve('uploads', 'certificates', file) :
                path.resolve('uploads', 'resources', file);

        const filePath = path.resolve(__dirname, '..', halfPath);

        try {
            await fs.stat(filePath);
        } catch (error) {
            console.log(error);
            return res.status(404).send('File not found');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${file}"`);

        const fileContent = await fs.readFile(filePath);
        res.send(fileContent);
    } catch (error) {
        console.error('Error in getPDF:', error);
        res.status(500).send('Internal Server Error');
    }
}

const logout = (req, res) => {
    // Destroy the user's session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Error logging out');
        } else {
            // Redirect the user to the login page or any other appropriate page
            // req.session.alert = {
            //     message: 'Logout successful',
            //     type: 'success'
            // }
            return res.redirect("/");
        }
    });
}

module.exports = {
    routeSetup,
    showLandingPage, handleAddingTasks, getItems,
    showSignUpPage, showLoginPage, getForms, handleLogin,
    handleSignUp, handleRole, handlePayment, showDashboard,
    showTasksPage, handleUpload, getPDF, handleExtra,
    handleAcceptingTasks, handleChatUpload, handleChatMessage,
    handleCertifyingTasks, logout
}

// generate_certificate({
//     owner: 'dada teniola',
//     reviewer: 'ezenagu divine',
//     task: 'OLMS'
// }, {
//     format: 'Ledger'
// })