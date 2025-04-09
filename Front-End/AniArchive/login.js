const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('messageDiv'); // For showing messages

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from submitting the default way

    // Collect form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Show loading indicator (optional)
    messageDiv.textContent = 'Aguarde...';

    // Prepare data for the request
    const data = {
        email,
        password
    };

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        localStorage.setItem('authToken', result.token); // Store the JWT token

        if (response.status === 200) {
            // Successfully logged in, store the token in localStorage or sessionStorage
            localStorage.setItem('authToken', result.token); // Store the JWT token
            
            // Provide success feedback to the user
            messageDiv.style.color = 'green';
            messageDiv.textContent = result.msg || "Login realizado com sucesso!";
            
            // Redirect to another page (for example, the user's dashboard or home page)
            window.location.href = 'logada.html';  // Redirect to the dashboard or home page

        } else {
            // Show error message if login fails
            messageDiv.style.color = 'red';
            messageDiv.textContent = result.msg || "Erro ao fazer login. Verifique suas credenciais.";
        }
    } catch (error) {
        // Show error message if there's a network issue or server error
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Erro ao conectar com o servidor!';
    }
});
