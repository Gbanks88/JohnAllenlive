// Initialize Stripe
const stripe = Stripe('pk_test_xxxxxxxxxxxxxxxxxxxxxxxx');
const elements = stripe.elements();

// Create card element
const cardElement = elements.create('card', {
    style: {
        base: {
            color: '#ffffff',
            fontFamily: '"Space Grotesk", sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4'
            },
            backgroundColor: 'transparent'
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
        }
    }
});

// Mount the card element
cardElement.mount('#card-element');

// Handle form submission
const paymentForm = document.getElementById('payment-form');
if (paymentForm) {
    paymentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const submitButton = document.querySelector('#submit-payment');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        try {
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                handleError(error);
                return;
            }

            // Get the user's Firebase ID token
            const user = firebase.auth().currentUser;
            if (!user) {
                handleError({ message: 'Please sign in to complete your payment' });
                return;
            }

            const idToken = await user.getIdToken();

            // Send payment info to your server
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    paymentMethodId: paymentMethod.id,
                    amount: 10000, // $100 in cents
                })
            });

            const result = await response.json();

            if (result.error) {
                handleError(result.error);
                return;
            }

            // Handle successful payment
            handlePaymentSuccess(result);

        } catch (error) {
            handleError(error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Pay Now';
        }
    });
}

function handleError(error) {
    const errorElement = document.getElementById('payment-error');
    errorElement.textContent = error.message;
    errorElement.style.display = 'block';
    
    // Show error with SweetAlert2
    Swal.fire({
        icon: 'error',
        title: 'Payment Error',
        text: error.message,
        background: '#1a1a2e',
        color: '#ffffff',
        confirmButtonColor: '#4a90e2'
    });
}

function handlePaymentSuccess(result) {
    // Show success message
    Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        text: 'Welcome to the AI Academy! You can now start earning while learning.',
        background: '#1a1a2e',
        color: '#ffffff',
        confirmButtonColor: '#4a90e2'
    }).then(() => {
        // Redirect to the learning dashboard
        window.location.href = '/learn-ai.html';
    });
}
