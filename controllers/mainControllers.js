const fs = require('fs').promises;
const path = require('path');
const Methods = require("../Models/Methods");

function isObject(value) {
    return (typeof value === 'object' && value !== null && !Array.isArray(value));
}

const showSignUpPage = (req, res) => {
    if (!isObject(req.session?.signup)) {
        req.session.signup = {
            // active: 'create-an-account',
            // completed: []
            active: 'finalize-payment',
            completed: ['create-an-account', 'select-a-role']
        }
    }

    const active = req.session.signup.active;
    const completed = req.session.signup.completed;
    const sidebar = [
        {
            head: 'Create an account',
            para: 'Make an account with us to provide better experience'
        },
        {
            head: 'Select a role',
            para: 'Choose a role to access relevant features in the system'
        },
        {
            head: 'Finalize payment',
            para: 'Securely confirm your payment to complete registration'
        }
    ]

    res.render("signup", { sidebar, active, completed })
}

const showLoginPage = (req, res) => {
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

    res.render("login", { sidebar })
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

const handleLogin = (req, res) => {

}

const handleSignUp = (req, res) => {
    //Validate user information
    const methods = new Methods(req.body);
    const { invalidKeys } = methods.validateData();

    //Check if there is invalid data to send back to user
    if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

    const next = 'select-a-role';

    req.session.info = req.body;
    req.session.signup.completed.push(req.session.signup.active);
    req.session.signup.active = next;

    res.status(200).send({ next, message: 'User information has been stored temporarily', type: 'success' });
}

const handleRole = (req, res) => {
    const roles = [];
    for (const key in req.body) {
        roles.push(key);
    }

    if (!roles.length) return res.status(400).send({ message: 'Please select at least one role', type: 'warning' });

    const next = 'finalize-payment';

    if (req.session.info) req.session.info.roles = roles;
    else {
        req.session.info = {};
        req.session.info.roles = roles;
    }
    req.session.signup.completed.push(req.session.signup.active);
    req.session.signup.active = next;

    res.status(200).send({ next, message: 'User role(s) temporarily stored', type: 'success' });
}

const handlePayment = (req, res) => {
    //Validate user information
    const methods = new Methods(req.body);
    const { invalidKeys } = methods.validateData();

    //Check if there is invalid data to send back to user
    if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

    // const next = 'select-a-role';
    res.status(500).send({ message: 'Couldnt finalize payment', type: 'error' });
}

module.exports = {
    showSignUpPage, showLoginPage, getForms, handleLogin, handleSignUp,
    handleRole, handlePayment
}