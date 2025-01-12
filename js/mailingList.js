var $form = $('form#email-form');
var url = 'https://script.google.com/macros/s/AKfycbz0p3AaSvvG2muFU1jLUQmaRBK3aSRxcF-_gcGrnIweDdfZc8KS/exec';

$("input[type='button']").on('click', function(e) {
    // Validate email input
    var email = document.forms["email-form"]["email"].value;
    if (!isValidEmail(email)) {
        e.preventDefault();
        modalError(); // Show error modal
        return; // Stop further execution
    }
    
    // Show success modal
    modal();
    
    // Prevent default form submission
    e.preventDefault();
    
    // Send form data to Google Apps Script
    $.ajax({
        url: url,
        method: "GET",
        dataType: "json",
        data: $form.serializeObject(),
        success: function(response) {
            console.log("Form submitted successfully:", response);
        },
        error: function(xhr, status, error) {
            console.error("Error submitting form:", error);
        }
    });
});

// Helper function to validate email
function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
