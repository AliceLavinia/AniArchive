form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmpassword = document.getElementById('confirmpassword').value;
    const messageDiv = document.getElementById('message'); // Get the messageDiv element

    // Log the captured data
    console.log({ name, email, password, confirmpassword });

    // Basic validation
    if (password !== confirmpassword) {
        messageDiv.textContent = "As senhas não conferem!";
        return;
    }

    
    
    // Prepare data for the API request
    const data = { name, email, password, confirmpassword };
    
    try {

        console.log(JSON.stringify(data)); // Log the JSON data you're sending

        const response = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',  // Ensure this is set
            },
            body: JSON.stringify(data),
        });
        

        const result = await response.json();

        if (response.status === 201) {
            window.location.href = "./logada.html"; // Redirect to login page
        }

        if (response.status === 201) {
            // Success
            messageDiv.style.color = "green";
            messageDiv.textContent = result.msg || "Usuário cadastrado com sucesso!";
        } else {
            // Error
            messageDiv.style.color = "red";
            messageDiv.textContent = result.msg || "Erro ao cadastrar usuário!";
        }
    } catch (error) {
        messageDiv.style.color = "red";
        messageDiv.textContent = "Erro ao conectar com o servidor!";
        msg = error.message;
        console.log(msg);
    }
});
