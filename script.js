// Get DOM elements
const lookupForm = document.getElementById('lookupForm');
const phoneInput = document.getElementById('PhNum');
const submitBtn = document.getElementById('sbmtbtn');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const resultCard = document.getElementById('resultCard');
const resultNumber = document.getElementById('resultNumber');
const resultContent = document.getElementById('resultContent');
const errorMessage = document.getElementById('errorMessage');
const newSearchBtn = document.getElementById('newSearchBtn');
const btnText = document.querySelector('.btn-text');
const btnSpinner = document.querySelector('.btn-spinner');

// API endpoints
const corsProxy = "https://api.codetabs.com/v1/proxy?quest=";
const apiUrl = "https://truecaller.underthedesk.blog/api?q=+91";

// Character formatting for phone input
phoneInput.addEventListener('input', (e) => {
    // Remove all non-digit characters
    let value = e.target.value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    
    // Update the input value
    e.target.value = value;
});

// Handle form submission
lookupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phoneNumber = phoneInput.value.trim();
    
    // Reset UI state
    hideResults();
    hideError();
    
    // Validation
    if (!phoneNumber) {
        showError('Please enter a phone number.');
        phoneInput.focus();
        return;
    }
    
    if (phoneNumber.length !== 10 || isNaN(phoneNumber)) {
        showError('Please enter a valid 10-digit number.');
        phoneInput.focus();
        return;
    }
    
    // Check if it starts with a valid Indian mobile number prefix
    const firstDigit = phoneNumber.charAt(0);
    const validFirstDigits = ['6', '7', '8', '9'];
    
    if (!validFirstDigits.includes(firstDigit)) {
        showError('Indian mobile numbers must start with 6, 7, 8, or 9');
        phoneInput.focus();
        return;
    }
    
    // Start lookup process
    await lookupPhoneNumber(phoneNumber);
});

// Phone number lookup function
async function lookupPhoneNumber(phoneNumber) {
    setLoadingState(true);
    
    try {
        const response = await fetch(corsProxy + encodeURIComponent(apiUrl + phoneNumber));
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        displayResults(data, phoneNumber);
        
    } catch (error) {
        console.error('Lookup error:', error);
        
        let errorMsg = 'Failed to lookup phone number. ';
        if (error.message.includes('fetch')) {
            errorMsg += 'Please check your internet connection.';
        } else if (error.message.includes('404')) {
            errorMsg += 'Phone number not found.';
        } else if (error.message.includes('500')) {
            errorMsg += 'Service temporarily unavailable.';
        } else {
            errorMsg += 'Please try again later.';
        }
        
        showError(errorMsg);
    } finally {
        setLoadingState(false);
    }
}

// Display loading state
function setLoadingState(loading) {
    submitBtn.disabled = loading;
    
    if (loading) {
        btnText.style.display = 'none';
        btnSpinner.style.display = 'flex';
        lookupForm.classList.add('form-loading');
        phoneInput.style.opacity = '0.7';
        phoneInput.style.pointerEvents = 'none';
    } else {
        btnText.style.display = 'block';
        btnSpinner.style.display = 'none';
        lookupForm.classList.remove('form-loading');
        phoneInput.style.opacity = '1';
        phoneInput.style.pointerEvents = 'auto';
    }
}

// Display search results
function displayResults(data, phoneNumber) {
    // Hide form and show results
    lookupForm.style.display = 'none';
    resultsSection.style.display = 'block';
    
    // Set the phone number in results
    resultNumber.textContent = phoneNumber;
    
    // Clear previous content
    resultContent.innerHTML = '';
    
    if (data.success && data.data) {
        // Process names (split by hyphen and filter out "Not Found")
        const names = data.data.name.split('-')
            .map(name => name.trim())
            .filter(name => name && name !== 'Not Found');
        
        if (names.length > 0) {
            const namesContainer = createResultItem('Names', '');
            const namesList = document.createElement('div');
            namesList.className = 'names-list';
            
            names.forEach(name => {
                const nameElement = document.createElement('div');
                nameElement.className = 'name-item';
                nameElement.textContent = name;
                namesList.appendChild(nameElement);
            });
            
            namesContainer.querySelector('.result-value').appendChild(namesList);
            resultContent.appendChild(namesContainer);
        }
        
        // Add address information
        if (data.data.address) {
            resultContent.appendChild(
                createResultItem('Address', data.data.address)
            );
        }
        
        // Add phone number information
        if (data.data.number) {
            resultContent.appendChild(
                createResultItem('Number', data.data.number)
            );
        }
        
        // Add carrier information if available
        if (data.data.carrier) {
            resultContent.appendChild(
                createResultItem('Carrier', data.data.carrier)
            );
        }
        
        // Add location information if available
        if (data.data.location) {
            resultContent.appendChild(
                createResultItem('Location', data.data.location)
            );
        }
        
    } else {
        // No data found
        const noDataItem = createResultItem('Status', 'No information found for this number');
        const statusValue = noDataItem.querySelector('.result-value');
        statusValue.style.color = '#e53e3e';
        statusValue.style.fontStyle = 'italic';
        resultContent.appendChild(noDataItem);
    }
    
    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
}

// Create a result item element
function createResultItem(label, value) {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    const labelElement = document.createElement('div');
    labelElement.className = 'result-label';
    labelElement.textContent = label + ':';
    
    const valueElement = document.createElement('div');
    valueElement.className = 'result-value';
    valueElement.textContent = value;
    
    item.appendChild(labelElement);
    item.appendChild(valueElement);
    
    return item;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    
    // Auto-hide after 10 seconds for network errors
    if (message.includes('internet') || message.includes('connection')) {
        setTimeout(() => {
            hideError();
        }, 10000);
    }
    
    // Scroll to error
    setTimeout(() => {
        errorSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
}

// Hide error message
function hideError() {
    errorSection.style.display = 'none';
}

// Hide results and show form
function hideResults() {
    resultsSection.style.display = 'none';
}

// Show form and hide results
function showForm() {
    lookupForm.style.display = 'block';
    resultsSection.style.display = 'none';
    hideError();
    
    // Clear form
    phoneInput.value = '';
    phoneInput.focus();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// New search button
newSearchBtn.addEventListener('click', showForm);

// Keyboard shortcuts
phoneInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitBtn.click();
    }
});

// Additional input validation
phoneInput.addEventListener('input', (e) => {
    const value = e.target.value;
    
    // Remove any non-digit characters
    e.target.value = value.replace(/\D/g, '');
    
    // Check if it starts with a valid Indian mobile number prefix
    if (value.length >= 1) {
        const firstDigit = value.charAt(0);
        const validFirstDigits = ['6', '7', '8', '9'];
        
        if (!validFirstDigits.includes(firstDigit)) {
            // Don't clear immediately, but show a subtle warning
            e.target.style.borderColor = '#d69e2e';
        } else {
            e.target.style.borderColor = '';
        }
    } else {
        e.target.style.borderColor = '';
    }
});

// Format phone number for display
function formatPhoneNumber(number) {
    return number.replace(/(\d{5})(\d{5})/, '$1 $2');
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Focus on phone input
    setTimeout(() => {
        phoneInput.focus();
    }, 100);
    
    // Add entrance animation to card
    const appCard = document.querySelector('.app-card');
    appCard.style.opacity = '0';
    appCard.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        appCard.style.transition = 'all 0.4s ease';
        appCard.style.opacity = '1';
        appCard.style.transform = 'translateY(0)';
    }, 50);
});

// Touch feedback for mobile
if ('ontouchstart' in window) {
    [submitBtn, newSearchBtn].forEach(btn => {
        btn.addEventListener('touchstart', () => {
            btn.style.transform = 'scale(0.98)';
        });
        
        btn.addEventListener('touchend', () => {
            btn.style.transform = '';
        });
    });
}

// Prevent double submission
let isSubmitting = false;

submitBtn.addEventListener('click', () => {
    if (isSubmitting) return;
    isSubmitting = true;
    
    setTimeout(() => {
        isSubmitting = false;
    }, 2000);
});

