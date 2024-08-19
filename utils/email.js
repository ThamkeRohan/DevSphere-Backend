const accountConfirmationEmail = {
  subject: "Activate Your Dev Community Account",
  getBody: function(developerName, activationLink) {
    return `
    <h1>Developer community</h1>
    <p>Hello ${developerName},</p>
    <p>
        Welcome to Dev Community, your go-to platform for insightful articles and discussions on developer-centric topics.
        We're excited that you've chosen to join our developer community. To get started, please confirm your email address 
        by clicking on the activation link below: <br>
        <strong>Activation Link:</strong> <a href=${activationLink}>${activationLink}</a>
        If you have trouble with the link, you can copy and paste it into your browser.
    </p>
    <p>
        If you didn't sign up for Dev Community, please disregard this email.
    </p>
    <p>
        Happy coding, and thank you for becoming a part of our developer community!
    </p>
    <p>
        Best regards,<br>The Dev Community Team
    </p>
  `;
  },
};

const passwordResetEmail = {
  subject: "Password Reset Request for Dev Community Account",
  getBody: function (developerName, resetLink, expirationPeriod) {
    return `
        <h1>Developer community</h1>
        <p>Hello ${developerName},</p>
        <p>
            We received a request to reset your password for your account on Dev Community.
            To reset your password, please click on the link below:<br>
            <strong>Password Reset Link:</strong> <a href=${resetLink}>${resetLink}</a>
        </p>
        <p>
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
        </p>
        <p>
            This password reset link is valid for ${expirationPeriod}. After this period, you'll need to submit another request if needed.
        </p>
        <p>
            Best regards,<br>The Dev Community Team
        </p>
        `;
  },
};

module.exports = {
    accountConfirmationEmail,
    passwordResetEmail
}