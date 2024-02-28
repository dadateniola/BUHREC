

const showSignUpPage = async (req, res) => {
    res.render("signup")
}

const showLoginPage = async (req, res) => {
    res.render("login")
}

module.exports = {
    showSignUpPage, showLoginPage
}