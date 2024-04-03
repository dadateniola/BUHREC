const fs = require('fs').promises;
const path = require('path');
const Methods = require("../Models/Methods");
const User = require("../Models/User");
const UserRole = require("../Models/UserRole");

const DEFAULT_USER_ID = '1';

const tempFolder = path.resolve(__dirname, '..', 'temp');
const uploadsFolder = path.resolve(__dirname, '..', 'uploads', 'resources');

function isObject(value) {
    return (typeof value === 'object' && value !== null && !Array.isArray(value));
}

const routeSetup = async (req, res, next) => {
    req.session.uid = DEFAULT_USER_ID;
    const { alert, uid } = req.session;

    // if (!uid) {
    //     req.session.alert = {
    //         message: "User login is required",
    //         type: 'warning',
    //     }
    //     return res.redirect("/");
    // }

    try {
        const [user] = await User.find(['id', uid]);

        // if(!user) {
        //     return res.redirect("/logout");
        // }

        const filename = Methods.tempFilename(uid);
        const filePath = path.join(tempFolder, filename);
        const previewRoute = (await Methods.checkFileExistence({ filePath })) ? `/get-pdf/${filename}/preview` : null;

        res.locals.data = {
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

const showSignUpPage = (req, res) => {
    if (!isObject(req.session?.signup)) {
        req.session.signup = {
            active: 'create-an-account',
            completed: []
        }
        // req.session.signup = {
        //     active: 'select-a-role',
        //     completed: ['create-an-account']
        // }
        // req.session.info = {
        //     email: 'emmatenny2004@gmail.com',
        //     password: 'pass',
        //     fullname: 'dada teniola',
        //     // roles: ['researcher', 'reviewer']
        // }
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

const showDashboard = (req, res) => {
    res.render("dashboard");
}

const showTasksPage = (req, res) => {
    res.render("tasks");
}

const getForms = async (req, res) => {
    const { form } = req.body;
    const filePath = path.resolve(__dirname, '..', 'pages', 'forms', `${form}.ejs`);

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        res.status(200).send({ html: fileContent });
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

        const user = await User.find(['email', email]);

        if (user.length) {
            const next = 'verification-&-validation';

            req.session.login.completed.push(req.session.login.active);
            req.session.login.active = next;
            console.log(req.session);
            res.status(200).send({
                next,
                completed: req.session.login.completed,
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
        const { degree } = req.body;
        delete req.body.degree;

        //Validate user information
        const methods = new Methods({ degree });
        const { invalidKeys } = methods.validateData();

        //Check if there is invalid data to send back to user
        if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

        const roles = [];
        for (const key in req.body) {
            roles.push(key);
        }

        if (!roles.length) return res.status(400).send({ message: 'Please select at least one role', type: 'warning' });

        const next = 'add-a-credit-card';

        if (req.session.info) req.session.info.roles = roles;
        else {
            req.session.info = {};
            req.session.info.roles = roles;
        }

        req.session.info.degree = degree;

        req.session.signup.completed.push(req.session.signup.active);
        req.session.signup.active = next;

        res.status(200).send({
            next,
            completed: req.session.signup.completed,
            alert: { message: 'User role(s) temporarily stored', type: 'success' },
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const handlePayment = async (req, res) => {
    //Validate user information
    const methods = new Methods(req.body);
    const { invalidKeys } = methods.validateData();

    //Check if there is invalid data to send back to user
    if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

    if (!req.session?.info?.roles) return res.status(500).send({ message: 'Something went wrong', type: 'error' });

    try {
        const roles = req.session.info.roles;
        delete req.session.info.roles;

        const user = new User(req.session.info);
        await user.add();

        const columns = ['user_id', 'role'];
        const values = roles.map(role => [
            user.id,
            role,
        ]);

        const user_role = new UserRole({ columns, values });
        await user_role.multiAdd();

        const next = 'verification-&-validation';

        req.session.signup.completed.push(req.session.signup.active);
        req.session.signup.active = next;

        res.status(200).send({
            next,
            completed: req.session.signup.completed,
            alert: { message: 'Credit card added successfully, please wait as we clean up', type: 'success' },
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const handleUpload = async (req, res) => {
    if (!req?.files) return (req.aborted) ? console.log('Request aborted but still received') : console.log('Files not received');
    
    //Remove this
    //------------------------------
    req.session.uid = '1';
    //------------------------------

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

const getPDF = async (req, res) => {
    try {
        const { file, type } = req.params;

        if (!file) return res.status(400).send('File not found');

        const halfPath = (type == 'preview') ?
            path.resolve('temp', file) :
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

module.exports = {
    routeSetup,
    showSignUpPage, showLoginPage, getForms, handleLogin,
    handleSignUp, handleRole, handlePayment, showDashboard,
    showTasksPage, handleUpload, getPDF
}