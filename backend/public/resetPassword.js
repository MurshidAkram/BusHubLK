document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        document.getElementById('message').innerHTML = 
            '<div class="message error">Invalid reset link.</div>';
        document.getElementById('resetForm').style.display = 'none';
        return;
    }
    
    // Set the token in the hidden input
    document.getElementById('tokenInput').value = token;
    
    document.getElementById('resetForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.getElementById('submitBtn');
        
        // Clear previous messages
        document.getElementById('message').innerHTML = '';
        
        // Validate password requirements
        if (newPassword.length < 6) {
            document.getElementById('message').innerHTML = 
                '<div class="message error">Password must be at least 6 characters long.</div>';
            return;
        }
        
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            document.getElementById('message').innerHTML = 
                '<div class="message error">Password must contain at least one uppercase letter, one lowercase letter, and one number.</div>';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            document.getElementById('message').innerHTML = 
                '<div class="message error">Passwords do not match.</div>';
            return;
        }
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting...';
        
        try {
            // Use the same protocol as the current page
            const protocol = window.location.protocol;
            const host = window.location.host;
            const apiUrl = `${protocol}//${host}/api/password-reset/reset`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('message').innerHTML = 
                    '<div class="message success">Password reset successfully! You can now login with your new password.</div>';
                document.getElementById('resetForm').style.display = 'none';
                
                // Optional: Redirect to login page after 3 seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                document.getElementById('message').innerHTML = 
                    '<div class="message error">' + (data.error || 'Failed to reset password.') + '</div>';
            }
        } catch (error) {
            console.error('Reset error:', error);
            document.getElementById('message').innerHTML = 
                '<div class="message error">Network error. Please try again.</div>';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    });
});
