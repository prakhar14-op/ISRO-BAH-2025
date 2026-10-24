class SolarCMEApp {
    constructor() {
        this.video = document.getElementById('solarVideo');
        this.formOverlay = document.getElementById('formOverlay');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.form = document.getElementById('cmeForm');
        this.replayBtn = document.getElementById('replayBtn');
        
        this.formData = {
            date: '',
            time: '',
            initialSpeed: '',
            angularWidth: '',
            sourceLocation: '',
            predictedArrival: ''
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startProgressAnimation();
    }
    
    setupEventListeners() {
        // Video ended event
        this.video.addEventListener('ended', () => {
            this.showForm();
        });
        
        // Form submission
        this.form.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });
        
        // Replay button
        this.replayBtn.addEventListener('click', () => {
            this.resetVideo();
        });
        
        // Form input changes
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleInputChange(e.target.name, e.target.value);
            });
        });
        
        // Video error handling
        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            // Show form immediately if video fails to load
            setTimeout(() => {
                this.showForm();
            }, 2000);
        });
        
        // Video can play event
        this.video.addEventListener('canplay', () => {
            console.log('Video can play');
        });
    }
    
    startProgressAnimation() {
        // Animate progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.animation = 'fillProgress 10s linear forwards';
        }
    }
    
    showForm() {
        // Hide loading indicator
        this.loadingIndicator.classList.add('hidden');
        
        // Show form overlay with animation
        this.formOverlay.classList.remove('hidden');
        setTimeout(() => {
            this.formOverlay.classList.add('show');
        }, 100);
        
        // Add staggered animation to form groups
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach((group, index) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            setTimeout(() => {
                group.style.transition = 'all 0.5s ease';
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, 100 * (index + 1));
        });
    }
    
    hideForm() {
        this.formOverlay.classList.remove('show');
        setTimeout(() => {
            this.formOverlay.classList.add('hidden');
        }, 800);
        
        // Show loading indicator
        this.loadingIndicator.classList.remove('hidden');
    }
    
    handleInputChange(field, value) {
        this.formData[field] = value;
        console.log('Form data updated:', this.formData);
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        // Collect all form data
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        console.log('CME Data Submitted:', data);
        
        // Show success message
        this.showSuccessMessage(data);
        
        // Here you would typically send the data to a server
        // fetch('/api/cme-data', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(data)
        // });
    }
    
    showSuccessMessage(data) {
        // Create success overlay
        const successOverlay = document.createElement('div');
        successOverlay.className = 'success-overlay';
        successOverlay.innerHTML = `
            <div class="success-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>CME Data Submitted Successfully!</h2>
                <p>Your solar event data has been recorded.</p>
                <div class="success-data">
                    <p><strong>Date:</strong> ${data.date}</p>
                    <p><strong>Time:</strong> ${data.time} UTC</p>
                    <p><strong>Speed:</strong> ${data.speed} km/s</p>
                    <p><strong>Angular Width:</strong> ${data.width}°</p>
                    <p><strong>Source:</strong> ${data.location}</p>
                    ${data.arrival ? `<p><strong>Predicted Arrival:</strong> ${data.arrival}</p>` : ''}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="btn-close">
                    Close
                </button>
            </div>
        `;
        
        // Add success styles
        const style = document.createElement('style');
        style.textContent = `
            .success-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease;
            }
            .success-content {
                background: linear-gradient(135deg, #065f46, #047857);
                padding: 2rem;
                border-radius: 1rem;
                text-align: center;
                color: white;
                max-width: 500px;
                margin: 1rem;
            }
            .success-icon {
                font-size: 3rem;
                color: #10b981;
                margin-bottom: 1rem;
            }
            .success-data {
                background: rgba(0, 0, 0, 0.2);
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
                text-align: left;
            }
            .success-data p {
                margin: 0.5rem 0;
            }
            .btn-close {
                background: #10b981;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 1rem;
                margin-top: 1rem;
            }
            .btn-close:hover {
                background: #059669;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(successOverlay);
    }
    
    resetVideo() {
        // Hide form
        this.hideForm();
        
        // Reset and play video
        this.video.currentTime = 0;
        this.video.play();
        
        // Reset progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.animation = 'none';
            progressFill.offsetHeight; // Trigger reflow
            progressFill.style.animation = 'fillProgress 10s linear forwards';
        }
        
        // Clear form
        this.form.reset();
        this.formData = {
            date: '',
            time: '',
            initialSpeed: '',
            angularWidth: '',
            sourceLocation: '',
            predictedArrival: ''
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SolarCMEApp();
});

// Add some utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function formatTime(time) {
    return time + ' UTC';
}

// Handle video loading errors gracefully
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'VIDEO') {
        console.warn('Video failed to load, showing form immediately');
        setTimeout(() => {
            document.getElementById('loadingIndicator').classList.add('hidden');
            document.getElementById('formOverlay').classList.remove('hidden');
            document.getElementById('formOverlay').classList.add('show');
        }, 2000);
    }
});