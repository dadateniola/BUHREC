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
            active: 'select-a-role',
            completed: []
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

    console.log(req.session);

    res.status(200).send({ next, message: 'User information temporarily stored', type: 'success' });
}

module.exports = {
    showSignUpPage, showLoginPage, getForms, handleLogin, handleSignUp
}