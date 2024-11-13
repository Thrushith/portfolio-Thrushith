document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript loaded and ready to go!");
    // Smooth scrolling for navigation links
    const links = document.querySelectorAll('a.nav-link');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

function handleSubmit(event) {
    event.preventDefault(); // Prevent the form from submitting the default way

    // Get form values
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Send data to the server
    fetch('https://your-pythonanywhere-username.pythonanywhere.com/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'name': name,
            'email': email,
            'message': message
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Thank you for your message! We will contact you soon.');
            document.getElementById("contactForm").reset(); // Reset the form
        } else {
            alert('There was an error sending your message. Please try again later.');
        }
    })
    . catch(error => {
        console.error('Error:', error);
        alert('There was an error sending your message. Please try again later.');
    });
}