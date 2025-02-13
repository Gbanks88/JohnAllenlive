document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('email-signup');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            try {
                submitButton.textContent = 'Processing...';
                submitButton.disabled = true;
                
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });
                
                if (!response.ok) {
                    throw new Error('Signup failed');
                }
                
                const data = await response.json();
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <p>Thank you for signing up! Please check your email to confirm your subscription.</p>
                `;
                
                form.replaceWith(successMessage);
                
            } catch (error) {
                console.error('Signup error:', error);
                
                // Show error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Sorry, there was an error. Please try again later.</p>
                `;
                
                form.insertAdjacentElement('beforebegin', errorMessage);
                setTimeout(() => errorMessage.remove(), 5000);
                
            } finally {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }
});
