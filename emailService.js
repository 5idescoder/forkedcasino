class EmailService {
    constructor() {
        this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    }

    validateEmail(email) {
        return this.emailRegex.test(email);
    }

    async sendVerificationEmail(email, code) {
        try {
            // In a real app, this would use nodemailer or a service like SendGrid
            console.log(`Sending verification code ${code} to ${email}`);
            
            // Simulate email sending
            return new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Failed to send verification email:', error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email, token) {
        try {
            // In a real app, this would send a real email with a reset link
            console.log(`Sending password reset link to ${email}`);
            
            // Simulate email sending
            return new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            throw error;
        }
    }

    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}

// Create and export email service instance
window.emailService = new EmailService();