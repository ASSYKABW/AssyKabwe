// CareerBoost Website JavaScript

// DOM Elements
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');

// Navigation Toggle
if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
}

// Close mobile menu when clicking on links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// User Type Selector
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to clicked tab
        btn.classList.add('active');
        
        // Update hero content based on selected user type
        const userType = btn.dataset.type;
        updateHeroContent(userType);
    });
});

// Update hero content based on user type
function updateHeroContent(userType) {
    const heroTitle = document.querySelector('.hero-text h1');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (userType === 'recruiter') {
        heroTitle.innerHTML = 'Find Top Talent with <span class="gradient-text">AI-Powered</span> Recruitment';
        heroSubtitle.textContent = 'Streamline your hiring process with intelligent candidate matching, automated screening, and data-driven insights to build exceptional teams faster.';
    } else {
        heroTitle.innerHTML = 'Supercharge Your Career with <span class="gradient-text">AI-Powered</span> Job Success';
        heroSubtitle.textContent = 'From resume optimization to interview mastery, CareerBoost uses cutting-edge AI to accelerate your career growth and connect you with dream opportunities.';
    }
}

// Pricing Toggle
function togglePricing() {
    const toggle = document.querySelector('.toggle-switch');
    const jobseekerPricing = document.getElementById('jobseeker-pricing');
    const recruiterPricing = document.getElementById('recruiter-pricing');
    
    toggle.classList.toggle('active');
    
    if (toggle.classList.contains('active')) {
        jobseekerPricing.classList.add('hidden');
        recruiterPricing.classList.remove('hidden');
    } else {
        jobseekerPricing.classList.remove('hidden');
        recruiterPricing.classList.add('hidden');
    }
}

// Modal Functions
function openModal(type) {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    switch (type) {
        case 'signup':
            showSignupModal();
            break;
        case 'login':
            showLoginModal();
            break;
        case 'demo':
            showDemoModal();
            break;
        default:
            showSignupModal();
    }
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showSignupModal() {
    modalTitle.textContent = 'Start Your Free Trial';
    modalContent.innerHTML = `
        <form class="signup-form" onsubmit="handleSignup(event)">
            <div class="form-group">
                <label class="form-label">I am a:</label>
                <select class="form-select" name="userType" required>
                    <option value="">Select your role</option>
                    <option value="jobseeker">Job Seeker</option>
                    <option value="recruiter">Recruiter</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" name="fullName" required placeholder="Enter your full name">
            </div>
            
            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" name="email" required placeholder="Enter your email">
            </div>
            
            <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" name="password" required placeholder="Create a password">
            </div>
            
            <div class="form-group">
                <label class="form-label">Company (Optional)</label>
                <input type="text" class="form-input" name="company" placeholder="Your company name">
            </div>
            
            <div class="form-checkbox">
                <input type="checkbox" id="terms" name="terms" required>
                <label for="terms">I agree to the <a href="#" style="color: var(--primary-color);">Terms of Service</a> and <a href="#" style="color: var(--primary-color);">Privacy Policy</a></label>
            </div>
            
            <div class="form-checkbox">
                <input type="checkbox" id="newsletter" name="newsletter">
                <label for="newsletter">Send me updates about new features and career tips</label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-full">
                Start Free Trial
                <i class="fas fa-arrow-right"></i>
            </button>
            
            <p style="text-align: center; margin-top: var(--space-4); color: var(--text-secondary);">
                Already have an account? <a href="#" onclick="showLoginModal()" style="color: var(--primary-color);">Sign in</a>
            </p>
        </form>
    `;
}

function showLoginModal() {
    modalTitle.textContent = 'Welcome Back';
    modalContent.innerHTML = `
        <form class="login-form" onsubmit="handleLogin(event)">
            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" name="email" required placeholder="Enter your email">
            </div>
            
            <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" name="password" required placeholder="Enter your password">
            </div>
            
            <div class="form-checkbox">
                <input type="checkbox" id="remember" name="remember">
                <label for="remember">Remember me</label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-full">
                Sign In
                <i class="fas fa-sign-in-alt"></i>
            </button>
            
            <p style="text-align: center; margin-top: var(--space-4); color: var(--text-secondary);">
                <a href="#" style="color: var(--primary-color);">Forgot your password?</a>
            </p>
            
            <p style="text-align: center; margin-top: var(--space-2); color: var(--text-secondary);">
                Don't have an account? <a href="#" onclick="showSignupModal()" style="color: var(--primary-color);">Sign up</a>
            </p>
        </form>
    `;
}

function showDemoModal() {
    modalTitle.textContent = 'Schedule Your Demo';
    modalContent.innerHTML = `
        <form class="demo-form" onsubmit="handleDemo(event)">
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" name="fullName" required placeholder="Enter your full name">
            </div>
            
            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" name="email" required placeholder="Enter your email">
            </div>
            
            <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" class="form-input" name="phone" placeholder="Enter your phone number">
            </div>
            
            <div class="form-group">
                <label class="form-label">Company</label>
                <input type="text" class="form-input" name="company" required placeholder="Your company name">
            </div>
            
            <div class="form-group">
                <label class="form-label">Company Size</label>
                <select class="form-select" name="companySize" required>
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Preferred Demo Time</label>
                <select class="form-select" name="demoTime" required>
                    <option value="">Select preferred time</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 8 PM)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">What would you like to see? (Optional)</label>
                <textarea class="form-input" name="interests" rows="3" placeholder="Tell us about your specific interests or use cases..."></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary btn-full">
                Schedule Demo
                <i class="fas fa-calendar"></i>
            </button>
        </form>
    `;
}

// Form Handlers
function handleSignup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    showLoadingState(event.target);
    
    setTimeout(() => {
        console.log('Signup data:', data);
        showSuccessMessage('Account created successfully! Check your email to verify your account.');
        closeModal();
    }, 2000);
}

function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    showLoadingState(event.target);
    
    setTimeout(() => {
        console.log('Login data:', data);
        showSuccessMessage('Welcome back! Redirecting to your dashboard...');
        closeModal();
    }, 1500);
}

function handleDemo(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    showLoadingState(event.target);
    
    setTimeout(() => {
        console.log('Demo request:', data);
        showSuccessMessage('Demo scheduled! We\'ll send you a calendar invite within 24 hours.');
        closeModal();
    }, 2000);
}

function showLoadingState(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    // Store original text for restoration
    submitBtn.dataset.originalText = originalText;
}

function showSuccessMessage(message) {
    // Create and show a toast notification
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Add toast styles if not already present
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
        
        // Add toast styles
        const toastStyles = `
            <style>
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 3000;
                }
                
                .toast {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    padding: var(--space-4);
                    margin-bottom: var(--space-2);
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    min-width: 300px;
                    animation: slideInRight 0.3s ease-out;
                }
                
                .toast.success {
                    background: var(--success);
                    color: white;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', toastStyles);
    }
    
    document.querySelector('.toast-container').appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Plan Selection
function selectPlan(planName) {
    console.log('Selected plan:', planName);
    
    // Simulate plan selection logic
    if (planName === 'starter') {
        openModal('signup');
    } else if (planName === 'enterprise') {
        openModal('demo');
    } else {
        openModal('signup');
    }
}

// Smooth Scrolling
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = 'var(--shadow-md)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll(
        '.feature-card, .step, .pricing-card, .testimonial-card'
    );
    
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    // Close modal on Escape key
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
    
    // Toggle mobile menu on Enter when nav toggle is focused
    if (e.key === 'Enter' && document.activeElement === navToggle) {
        navToggle.click();
    }
});

// Form Validation Enhancement
function enhanceFormValidation() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Remove existing error styling
    field.classList.remove('error');
    
    // Basic validation
    if (field.required && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }
    
    // Password validation
    if (field.type === 'password' && value) {
        if (value.length < 8) {
            showFieldError(field, 'Password must be at least 8 characters long');
            return false;
        }
    }
    
    return true;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
    
    // Add error styles if not present
    if (!document.querySelector('.field-error-styles')) {
        const errorStyles = `
            <style class="field-error-styles">
                .form-input.error {
                    border-color: var(--error);
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }
                
                .field-error {
                    color: var(--error);
                    font-size: var(--font-size-sm);
                    margin-top: var(--space-1);
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', errorStyles);
    }
}

function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('error');
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// Analytics Tracking (Placeholder)
function trackEvent(eventName, eventData = {}) {
    console.log('Analytics Event:', eventName, eventData);
    
    // Integration points for analytics services:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics API
    
    // Example: gtag('event', eventName, eventData);
}

// Track important user interactions
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-track]');
    if (target) {
        const eventName = target.dataset.track;
        const eventData = {
            element: target.tagName.toLowerCase(),
            text: target.textContent.trim(),
            href: target.href || null
        };
        trackEvent(eventName, eventData);
    }
});

// Performance Monitoring
function initPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            
            trackEvent('page_load_complete', {
                load_time: loadTime,
                dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart
            });
        }, 0);
    });
}

// Initialize performance monitoring
initPerformanceMonitoring();

// Error Handling
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
    
    // Track errors for monitoring
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize form validation when modals are opened
const originalOpenModal = openModal;
openModal = function(type) {
    originalOpenModal(type);
    
    // Wait for modal content to be rendered
    setTimeout(() => {
        enhanceFormValidation();
    }, 100);
};

// Lazy Loading for Images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', initLazyLoading);

// Dark Mode Toggle (Optional Feature)
function initDarkMode() {
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
        
        // Load saved dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', initDarkMode);

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openModal,
        closeModal,
        togglePricing,
        selectPlan,
        scrollToSection,
        trackEvent
    };
}