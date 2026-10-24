class AdityaL1Simulation {
    constructor() {
        this.currentPhase = 'input';
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalDuration = 100;
        this.isDarkMode = true;
        this.cmeData = {};
        this.animationId = null;
        this.charts = {};
        this.graphData = [];
        this.isAnalysisComplete = false; // Add flag to track completion
        
        this.init();
    }
    

    
    init() {
        this.setupEventListeners();
        this.initializeSpaceBackground();
        this.setupCharts();
    }
    
    setupEventListeners() {
        // Form submission
        document.getElementById('cmeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startSimulation();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Fullscreen toggle
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Playback controls
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSimulation();
        });
        
        // Timeline scrubber
        document.getElementById('timelineScrubber').addEventListener('input', (e) => {
            this.setCurrentTime(parseInt(e.target.value));
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    initializeSpaceBackground() {
        const canvas = document.getElementById('spaceCanvas');
        const ctx = canvas.getContext('2d');
        
        this.resizeCanvas();
        
        // Create stars
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2,
                opacity: Math.random(),
                twinkle: Math.random() * 0.02
            });
        }
        
        this.animateBackground();
    }
    
    resizeCanvas() {
        const canvas = document.getElementById('spaceCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    animateBackground() {
        const canvas = document.getElementById('spaceCanvas');
        const ctx = canvas.getContext('2d');
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Galaxy background gradient
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width
            );
            
            if (this.isDarkMode) {
                gradient.addColorStop(0, 'rgba(25, 25, 112, 0.3)');
                gradient.addColorStop(0.5, 'rgba(72, 61, 139, 0.2)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            } else {
                gradient.addColorStop(0, 'rgba(135, 206, 235, 0.3)');
                gradient.addColorStop(0.5, 'rgba(176, 196, 222, 0.2)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Animate stars
            this.stars.forEach(star => {
                star.opacity += star.twinkle;
                if (star.opacity > 1 || star.opacity < 0) {
                    star.twinkle = -star.twinkle;
                }
                
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.opacity)})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    setupCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // Disable chart animations for better performance
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            plugins: {
                legend: { display: false }
            },
            elements: {
                point: { radius: 0 }
            }
        };
        
        // Proton Density Chart
        this.charts.density = new Chart(document.getElementById('densityChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: chartOptions
        });
        
        // Proton Velocity Chart
        this.charts.velocity = new Chart(document.getElementById('velocityChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: chartOptions
        });
        
        // Proton Flux Chart
        this.charts.flux = new Chart(document.getElementById('fluxChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: chartOptions
        });
    }
    
    startSimulation() {
        // Collect form data
        this.cmeData = {
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            speed: parseInt(document.getElementById('speed').value),
            angularWidth: parseInt(document.getElementById('angularWidth').value),
            sourceLocation: document.getElementById('sourceLocation').value,
            predictedArrival: document.getElementById('predictedArrival').value
        };
        
        // Validate required fields
        if (!this.cmeData.date || !this.cmeData.time || !this.cmeData.speed || !this.cmeData.angularWidth || !this.cmeData.sourceLocation) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Reset completion flag
        this.isAnalysisComplete = false;
        
        // Generate graph data
        this.generateGraphData();
        
        // Hide input panel
        document.getElementById('inputPanel').classList.add('hidden');
        
        // Show controls
        document.getElementById('bottomControls').classList.remove('hidden');
        document.getElementById('phaseIndicator').classList.remove('hidden');
        
        // Start simulation sequence
        this.setPhase('cme-launch');
        this.isPlaying = true;
        this.currentTime = 0;
        this.startAnimation();
        
        // Phase transitions
        setTimeout(() => this.setPhase('cme-travel'), 2000);
        setTimeout(() => this.setPhase('l1-impact'), 5000);
        setTimeout(() => this.setPhase('analysis'), 8000);
    }
    
    generateGraphData() {
        this.graphData = [];
        const baseTime = new Date(`${this.cmeData.date}T${this.cmeData.time}`).getTime();
        
        for (let i = 0; i < 100; i++) {
            const time = new Date(baseTime + i * 60000); // Every minute
            const impactPoint = 60; // CME impact at 60% through timeline
            
            // Normal solar wind values
            let protonDensity = 5 + Math.random() * 2;
            let protonVelocity = 400 + Math.random() * 50;
            let protonFlux = 1e6 + Math.random() * 5e5;
            
            // CME impact spike
            if (i >= impactPoint && i <= impactPoint + 20) {
                const spikeIntensity = Math.exp(-Math.pow(i - impactPoint - 10, 2) / 50);
                protonDensity += (this.cmeData.speed / 50) * spikeIntensity;
                protonVelocity += this.cmeData.speed * 0.8 * spikeIntensity;
                protonFlux += this.cmeData.speed * 1000 * spikeIntensity;
            }
            
            this.graphData.push({
                time: time.toLocaleTimeString(),
                timestamp: time,
                protonDensity: Math.max(0, protonDensity),
                protonVelocity: Math.max(0, protonVelocity),
                protonFlux: Math.max(0, protonFlux),
                index: i
            });
        }
    }
    
    setPhase(phase) {
        this.currentPhase = phase;
        
        // Update phase indicator
        document.getElementById('currentPhase').textContent = phase.replace('-', ' ').toUpperCase();
        
        // Update status dot
        const statusDot = document.getElementById('phaseStatusDot');
        const statusText = document.getElementById('phaseStatusText');
        
        statusDot.className = 'status-dot';
        
        switch (phase) {
            case 'cme-launch':
                statusDot.classList.add('launch');
                statusText.textContent = 'CME Launch Detected';
                this.showStatusMessage('🌋 CME DETECTED', 
                    `Coronal Mass Ejection launched from ${this.cmeData.sourceLocation}`,
                    `Speed: ${this.cmeData.speed} km/s | Width: ${this.cmeData.angularWidth}°`);
                this.animateCMELaunch();
                break;
                
            case 'cme-travel':
                statusDot.classList.add('travel');
                statusText.textContent = 'CME Traveling to L1';
                this.showStatusMessage('🚀 CME EN ROUTE',
                    'Plasma cloud traveling toward L1 Lagrange Point',
                    `ETA: ${Math.round((100 - this.currentTime) / 10)} minutes`);
                break;
                
            case 'l1-impact':
                statusDot.classList.add('impact');
                statusText.textContent = 'Impact at L1 Point';
                this.showStatusMessage('⚡ L1 IMPACT DETECTED',
                    'Aditya-L1 recording solar wind parameters',
                    '📡 Live Analysis in Progress...');
                this.animateL1Impact();
                break;
                
            case 'analysis':
                statusDot.classList.add('analysis');
                statusText.textContent = 'Data Analysis Complete';
                this.hideStatusMessage();
                this.showGraphsPanel();
                break;
        }
    }
    
    showStatusMessage(title, text, details) {
        document.getElementById('statusTitle').textContent = title;
        document.getElementById('statusText').textContent = text;
        document.getElementById('statusDetails').textContent = details;
        document.getElementById('statusMessage').classList.remove('hidden');
    }
    
    hideStatusMessage() {
        document.getElementById('statusMessage').classList.add('hidden');
    }
    
    animateCMELaunch() {
        // Show and animate shockwave
        const shockwave = document.getElementById('cmeShockwave');
        shockwave.classList.remove('hidden');
        shockwave.classList.add('animate');
        
        // Show and animate plasma stream
        setTimeout(() => {
            const plasma = document.getElementById('cmePlasma');
            plasma.classList.remove('hidden');
            plasma.classList.add('animate');
        }, 500);
    }
    
    animateL1Impact() {
        const l1Point = document.getElementById('l1Point');
        l1Point.classList.add('impact');
        
        setTimeout(() => {
            l1Point.classList.remove('impact');
        }, 3000);
    }
    
    showGraphsPanel() {
        document.getElementById('graphsPanel').classList.remove('hidden');
        // Initial graph update when panel is shown
        this.updateGraphs();
        this.updateSummaryStats();
    }
    
    
    updateGraphs() {
        // Only update if analysis is not complete
        if (this.isAnalysisComplete) {
            return;
        }
        
        const visibleData = this.graphData.slice(0, Math.floor(this.currentTime));
        
        // Update chart data
        const labels = visibleData.map(d => d.time);
        
        this.charts.density.data.labels = labels;
        this.charts.density.data.datasets[0].data = visibleData.map(d => d.protonDensity);
        this.charts.density.update('none');
        
        this.charts.velocity.data.labels = labels;
        this.charts.velocity.data.datasets[0].data = visibleData.map(d => d.protonVelocity);
        this.charts.velocity.update('none');
        
        this.charts.flux.data.labels = labels;
        this.charts.flux.data.datasets[0].data = visibleData.map(d => d.protonFlux);
        this.charts.flux.update('none');
    }
    
    updateSummaryStats() {
        // Event Summary
        document.getElementById('eventSummary').innerHTML = `
            <div>CME Speed: <span style="color: white">${this.cmeData.speed} km/s</span></div>
            <div>Angular Width: <span style="color: white">${this.cmeData.angularWidth}°</span></div>
            <div>Source: <span style="color: white">${this.cmeData.sourceLocation}</span></div>
        `;
        
        // Impact Analysis
        const visibleData = this.graphData.slice(0, Math.floor(this.currentTime));
        if (visibleData.length > 0) {
            const maxDensity = Math.max(...visibleData.map(d => d.protonDensity));
            const maxVelocity = Math.max(...visibleData.map(d => d.protonVelocity));
            
            document.getElementById('impactAnalysis').innerHTML = `
                <div>Peak Density: <span style="color: white">${maxDensity.toFixed(1)} p/cm³</span></div>
                <div>Peak Velocity: <span style="color: white">${maxVelocity.toFixed(0)} km/s</span></div>
                <div>Duration: <span style="color: white">~2 hours</span></div>
            `;
        }
    }
    
    startAnimation() {
        const animate = () => {
            if (this.isPlaying && this.currentTime < this.totalDuration) {
                this.currentTime += 0.5;
                this.updateTimeline();
                
                // Only update graphs if in analysis phase and not complete
                if (this.currentPhase === 'analysis' && !this.isAnalysisComplete) {
                    this.updateGraphs();
                    this.updateSummaryStats();
                }
            }
            
            // Check if simulation is complete
            if (this.currentTime >= this.totalDuration) {
                this.isPlaying = false;
                this.isAnalysisComplete = true; // Mark analysis as complete
                document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i>';
                
                // Final update of graphs with all data
                if (this.currentPhase === 'analysis') {
                    this.finalizeGraphs();
                }
                
                // Stop the animation loop
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
                return;
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    finalizeGraphs() {
        // Show complete graph data when analysis is finished
        const labels = this.graphData.map(d => d.time);
        
        this.charts.density.data.labels = labels;
        this.charts.density.data.datasets[0].data = this.graphData.map(d => d.protonDensity);
        this.charts.density.update();
        
        this.charts.velocity.data.labels = labels;
        this.charts.velocity.data.datasets[0].data = this.graphData.map(d => d.protonVelocity);
        this.charts.velocity.update();
        
        this.charts.flux.data.labels = labels;
        this.charts.flux.data.datasets[0].data = this.graphData.map(d => d.protonFlux);
        this.charts.flux.update();
        
        // Update final summary stats
        const maxDensity = Math.max(...this.graphData.map(d => d.protonDensity));
        const maxVelocity = Math.max(...this.graphData.map(d => d.protonVelocity));
        
        document.getElementById('impactAnalysis').innerHTML = `
            <div>Peak Density: <span style="color: white">${maxDensity.toFixed(1)} p/cm³</span></div>
            <div>Peak Velocity: <span style="color: white">${maxVelocity.toFixed(0)} km/s</span></div>
            <div>Duration: <span style="color: white">~2 hours</span></div>
        `;
    }
    
    updateTimeline() {
        const progress = (this.currentTime / this.totalDuration) * 100;
        
        // Update progress bar
        document.getElementById('timelineProgress').style.width = `${progress}%`;
        
        // Update progress percentage
        document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
        
        // Update timeline indicator
        document.getElementById('timelineIndicator').style.left = `${progress}%`;
        
        // Update scrubber
        document.getElementById('timelineScrubber').value = this.currentTime;
        
        // Update phase markers
        const markers = document.querySelectorAll('.marker-dot');
        const phases = [0, 25, 60, 80];
        
        markers.forEach((marker, index) => {
            if (this.currentTime >= phases[index]) {
                marker.classList.add('active');
            } else {
                marker.classList.remove('active');
            }
        });
    }
    
    togglePlayPause() {
        // Don't allow play if analysis is complete
        if (this.isAnalysisComplete && this.currentTime >= this.totalDuration) {
            return;
        }
        
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('playPauseBtn');
        btn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        
        if (this.isPlaying && !this.animationId) {
            this.startAnimation();
        }
    }
    
    setCurrentTime(time) {
        this.currentTime = time;
        this.updateTimeline();
        
        // Reset completion flag if scrubbing backwards
        if (time < this.totalDuration) {
            this.isAnalysisComplete = false;
        }
        
        // Update graphs only if in analysis phase and not manually scrubbing to end
        if (this.currentPhase === 'analysis') {
            if (time >= this.totalDuration) {
                this.isAnalysisComplete = true;
                this.finalizeGraphs();
            } else {
                this.isAnalysisComplete = false;
                this.updateGraphs();
                this.updateSummaryStats();
            }
        }
    }
    
    resetSimulation() {
        // Stop animation
        this.isPlaying = false;
        this.isAnalysisComplete = false; // Reset completion flag
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Reset state
        this.currentTime = 0;
        this.currentPhase = 'input';
        
        // Hide all panels
        document.getElementById('inputPanel').classList.remove('hidden');
        document.getElementById('bottomControls').classList.add('hidden');
        document.getElementById('phaseIndicator').classList.add('hidden');
        document.getElementById('statusMessage').classList.add('hidden');
        document.getElementById('graphsPanel').classList.add('hidden');
        
        // Reset animations
        document.getElementById('cmeShockwave').classList.add('hidden');
        document.getElementById('cmeShockwave').classList.remove('animate');
        document.getElementById('cmePlasma').classList.add('hidden');
        document.getElementById('cmePlasma').classList.remove('animate');
        document.getElementById('l1Point').classList.remove('impact');
        
        // Reset form
        document.getElementById('cmeForm').reset();
        
        // Reset timeline
        this.updateTimeline();
        
        // Clear charts
        Object.values(this.charts).forEach(chart => {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.update();
        });
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        const app = document.getElementById('app');
        const themeBtn = document.getElementById('themeToggle');
        
        if (this.isDarkMode) {
            app.classList.remove('light-mode');
            app.classList.add('dark-mode');
            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            app.classList.remove('dark-mode');
            app.classList.add('light-mode');
            themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// Initialize the simulation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdityaL1Simulation();
});

// Handle fullscreen changes
document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement) {
        btn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        btn.innerHTML = '<i class="fas fa-expand"></i>';
    }
});





// class AdityaL1Simulation {
//     constructor() {
//         this.currentPhase = 'input';
//         this.isPlaying = false;
//         this.currentTime = 0;
//         this.totalDuration = 100;
//         this.isDarkMode = true;
//         this.cmeData = {};
//         this.animationId = null;
//         this.charts = {};
//         this.graphData = [];
//         this.isAnalysisComplete = false; // Add flag to track completion
//         this.simulationComplete = false; // Add flag for complete simulation
        
//         this.init();
//     }
    
//     init() {
//         this.setupEventListeners();
//         this.initializeSpaceBackground();
//         this.setupCharts();
//     }
    
//     setupEventListeners() {
//         // Form submission
//         document.getElementById('cmeForm').addEventListener('submit', (e) => {
//             e.preventDefault();
//             this.startSimulation();
//         });
        
//         // Theme toggle
//         document.getElementById('themeToggle').addEventListener('click', () => {
//             this.toggleTheme();
//         });
        
//         // Fullscreen toggle
//         document.getElementById('fullscreenBtn').addEventListener('click', () => {
//             this.toggleFullscreen();
//         });
        
//         // Playback controls
//         document.getElementById('playPauseBtn').addEventListener('click', () => {
//             this.togglePlayPause();
//         });
        
//         document.getElementById('resetBtn').addEventListener('click', () => {
//             this.resetSimulation();
//         });
        
//         // Timeline scrubber
//         document.getElementById('timelineScrubber').addEventListener('input', (e) => {
//             this.setCurrentTime(parseInt(e.target.value));
//         });
        
//         // Window resize
//         window.addEventListener('resize', () => {
//             this.resizeCanvas();
//         });
//     }
    
//     initializeSpaceBackground() {
//         const canvas = document.getElementById('spaceCanvas');
//         const ctx = canvas.getContext('2d');
        
//         this.resizeCanvas();
        
//         // Create stars
//         this.stars = [];
//         for (let i = 0; i < 200; i++) {
//             this.stars.push({
//                 x: Math.random() * canvas.width,
//                 y: Math.random() * canvas.height,
//                 size: Math.random() * 2,
//                 opacity: Math.random(),
//                 twinkle: Math.random() * 0.02
//             });
//         }
        
//         this.animateBackground();
//     }
    
//     resizeCanvas() {
//         const canvas = document.getElementById('spaceCanvas');
//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;
//     }
    
//     animateBackground() {
//         const canvas = document.getElementById('spaceCanvas');
//         const ctx = canvas.getContext('2d');
        
//         const animate = () => {
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
            
//             // Galaxy background gradient
//             const gradient = ctx.createRadialGradient(
//                 canvas.width / 2, canvas.height / 2, 0,
//                 canvas.width / 2, canvas.height / 2, canvas.width
//             );
            
//             if (this.isDarkMode) {
//                 gradient.addColorStop(0, 'rgba(25, 25, 112, 0.3)');
//                 gradient.addColorStop(0.5, 'rgba(72, 61, 139, 0.2)');
//                 gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
//             } else {
//                 gradient.addColorStop(0, 'rgba(135, 206, 235, 0.3)');
//                 gradient.addColorStop(0.5, 'rgba(176, 196, 222, 0.2)');
//                 gradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
//             }
            
//             ctx.fillStyle = gradient;
//             ctx.fillRect(0, 0, canvas.width, canvas.height);
            
//             // Animate stars
//             this.stars.forEach(star => {
//                 star.opacity += star.twinkle;
//                 if (star.opacity > 1 || star.opacity < 0) {
//                     star.twinkle = -star.twinkle;
//                 }
                
//                 ctx.beginPath();
//                 ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
//                 ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.opacity)})`;
//                 ctx.fill();
//             });
            
//             requestAnimationFrame(animate);
//         };
        
//         animate();
//     }
    
//     setupCharts() {
//         const chartOptions = {
//             responsive: true,
//             maintainAspectRatio: false,
//             animation: {
//                 duration: 0 // Disable chart animations for better performance
//             },
//             scales: {
//                 x: {
//                     grid: { color: 'rgba(255, 255, 255, 0.1)' },
//                     ticks: { color: 'rgba(255, 255, 255, 0.7)' }
//                 },
//                 y: {
//                     grid: { color: 'rgba(255, 255, 255, 0.1)' },
//                     ticks: { color: 'rgba(255, 255, 255, 0.7)' }
//                 }
//             },
//             plugins: {
//                 legend: { display: false }
//             },
//             elements: {
//                 point: { radius: 0 }
//             }
//         };
        
//         // Proton Density Chart
//         this.charts.density = new Chart(document.getElementById('densityChart'), {
//             type: 'line',
//             data: {
//                 labels: [],
//                 datasets: [{
//                     data: [],
//                     borderColor: '#60a5fa',
//                     backgroundColor: 'rgba(96, 165, 250, 0.1)',
//                     borderWidth: 2,
//                     fill: true
//                 }]
//             },
//             options: chartOptions
//         });
        
//         // Proton Velocity Chart
//         this.charts.velocity = new Chart(document.getElementById('velocityChart'), {
//             type: 'line',
//             data: {
//                 labels: [],
//                 datasets: [{
//                     data: [],
//                     borderColor: '#22c55e',
//                     backgroundColor: 'rgba(34, 197, 94, 0.1)',
//                     borderWidth: 2,
//                     fill: true
//                 }]
//             },
//             options: chartOptions
//         });
        
//         // Proton Flux Chart
//         this.charts.flux = new Chart(document.getElementById('fluxChart'), {
//             type: 'line',
//             data: {
//                 labels: [],
//                 datasets: [{
//                     data: [],
//                     borderColor: '#a855f7',
//                     backgroundColor: 'rgba(168, 85, 247, 0.1)',
//                     borderWidth: 2,
//                     fill: true
//                 }]
//             },
//             options: chartOptions
//         });
//     }
    
//     startSimulation() {
//         // Collect form data
//         this.cmeData = {
//             date: document.getElementById('date').value,
//             time: document.getElementById('time').value,
//             speed: parseInt(document.getElementById('speed').value),
//             angularWidth: parseInt(document.getElementById('angularWidth').value),
//             sourceLocation: document.getElementById('sourceLocation').value,
//             predictedArrival: document.getElementById('predictedArrival').value
//         };
        
//         // Validate required fields
//         if (!this.cmeData.date || !this.cmeData.time || !this.cmeData.speed || !this.cmeData.angularWidth || !this.cmeData.sourceLocation) {
//             alert('Please fill in all required fields');
//             return;
//         }
        
//         // Reset flags
//         this.isAnalysisComplete = false;
//         this.simulationComplete = false;
        
//         // Generate graph data
//         this.generateGraphData();
        
//         // Hide input panel
//         document.getElementById('inputPanel').classList.add('hidden');
        
//         // Show controls
//         document.getElementById('bottomControls').classList.remove('hidden');
//         document.getElementById('phaseIndicator').classList.remove('hidden');
        
//         // Start simulation sequence
//         this.setPhase('cme-launch');
//         this.isPlaying = true;
//         this.currentTime = 0;
//         this.startAnimation();
        
//         // Phase transitions
//         setTimeout(() => this.setPhase('cme-travel'), 2000);
//         setTimeout(() => this.setPhase('l1-impact'), 5000);
//         setTimeout(() => this.setPhase('analysis'), 8000);
//     }
    
//     generateGraphData() {
//         this.graphData = [];
//         const baseTime = new Date(`${this.cmeData.date}T${this.cmeData.time}`).getTime();
        
//         for (let i = 0; i < 100; i++) {
//             const time = new Date(baseTime + i * 60000); // Every minute
//             const impactPoint = 60; // CME impact at 60% through timeline
            
//             // Normal solar wind values
//             let protonDensity = 5 + Math.random() * 2;
//             let protonVelocity = 400 + Math.random() * 50;
//             let protonFlux = 1e6 + Math.random() * 5e5;
            
//             // CME impact spike
//             if (i >= impactPoint && i <= impactPoint + 20) {
//                 const spikeIntensity = Math.exp(-Math.pow(i - impactPoint - 10, 2) / 50);
//                 protonDensity += (this.cmeData.speed / 50) * spikeIntensity;
//                 protonVelocity += this.cmeData.speed * 0.8 * spikeIntensity;
//                 protonFlux += this.cmeData.speed * 1000 * spikeIntensity;
//             }
            
//             this.graphData.push({
//                 time: time.toLocaleTimeString(),
//                 timestamp: time,
//                 protonDensity: Math.max(0, protonDensity),
//                 protonVelocity: Math.max(0, protonVelocity),
//                 protonFlux: Math.max(0, protonFlux),
//                 index: i
//             });
//         }
//     }
    
//     setPhase(phase) {
//         this.currentPhase = phase;
        
//         // Update phase indicator
//         document.getElementById('currentPhase').textContent = phase.replace('-', ' ').toUpperCase();
        
//         // Update status dot
//         const statusDot = document.getElementById('phaseStatusDot');
//         const statusText = document.getElementById('phaseStatusText');
        
//         statusDot.className = 'status-dot';
        
//         switch (phase) {
//             case 'cme-launch':
//                 statusDot.classList.add('launch');
//                 statusText.textContent = 'CME Launch Detected';
//                 this.showStatusMessage('🌋 CME DETECTED', 
//                     `Coronal Mass Ejection launched from ${this.cmeData.sourceLocation}`,
//                     `Speed: ${this.cmeData.speed} km/s | Width: ${this.cmeData.angularWidth}°`);
//                 this.animateCMELaunch();
//                 break;
                
//             case 'cme-travel':
//                 statusDot.classList.add('travel');
//                 statusText.textContent = 'CME Traveling to L1';
//                 this.showStatusMessage('🚀 CME EN ROUTE',
//                     'Plasma cloud traveling toward L1 Lagrange Point',
//                     `ETA: ${Math.round((100 - this.currentTime) / 10)} minutes`);
//                 break;
                
//             case 'l1-impact':
//                 statusDot.classList.add('impact');
//                 statusText.textContent = 'Impact at L1 Point';
//                 this.showStatusMessage('⚡ L1 IMPACT DETECTED',
//                     'Aditya-L1 recording solar wind parameters',
//                     '📡 Live Analysis in Progress...');
//                 this.animateL1Impact();
//                 break;
                
//             case 'analysis':
//                 statusDot.classList.add('analysis');
//                 statusText.textContent = 'Data Analysis Complete';
//                 this.hideStatusMessage();
//                 this.showGraphsPanel();
//                 break;
//         }
//     }
    
//     showStatusMessage(title, text, details) {
//         document.getElementById('statusTitle').textContent = title;
//         document.getElementById('statusText').textContent = text;
//         document.getElementById('statusDetails').textContent = details;
//         document.getElementById('statusMessage').classList.remove('hidden');
//     }
    
//     hideStatusMessage() {
//         document.getElementById('statusMessage').classList.add('hidden');
//     }
    
//     animateCMELaunch() {
//         // Show and animate shockwave
//         const shockwave = document.getElementById('cmeShockwave');
//         shockwave.classList.remove('hidden');
//         shockwave.classList.add('animate');
        
//         // Show and animate plasma stream
//         setTimeout(() => {
//             const plasma = document.getElementById('cmePlasma');
//             plasma.classList.remove('hidden');
//             plasma.classList.add('animate');
//         }, 500);
//     }
    
//     animateL1Impact() {
//         const l1Point = document.getElementById('l1Point');
//         l1Point.classList.add('impact');
        
//         setTimeout(() => {
//             l1Point.classList.remove('impact');
//         }, 3000);
//     }
    
//     showGraphsPanel() {
//         document.getElementById('graphsPanel').classList.remove('hidden');
//         // Initial graph update when panel is shown
//         this.updateGraphs();
//         this.updateSummaryStats();
//     }
    
//     updateGraphs() {
//         // Only update if analysis is not complete
//         if (this.simulationComplete) {
//             return;
//         }
        
//         const visibleData = this.graphData.slice(0, Math.floor(this.currentTime));
        
//         // Update chart data
//         const labels = visibleData.map(d => d.time);
        
//         this.charts.density.data.labels = labels;
//         this.charts.density.data.datasets[0].data = visibleData.map(d => d.protonDensity);
//         this.charts.density.update('none');
        
//         this.charts.velocity.data.labels = labels;
//         this.charts.velocity.data.datasets[0].data = visibleData.map(d => d.protonVelocity);
//         this.charts.velocity.update('none');
        
//         this.charts.flux.data.labels = labels;
//         this.charts.flux.data.datasets[0].data = visibleData.map(d => d.protonFlux);
//         this.charts.flux.update('none');
//     }
    
//     updateSummaryStats() {
//         // Event Summary
//         document.getElementById('eventSummary').innerHTML = `
//             <div>CME Speed: <span style="color: white">${this.cmeData.speed} km/s</span></div>
//             <div>Angular Width: <span style="color: white">${this.cmeData.angularWidth}°</span></div>
//             <div>Source: <span style="color: white">${this.cmeData.sourceLocation}</span></div>
//         `;
        
//         // Impact Analysis
//         const visibleData = this.graphData.slice(0, Math.floor(this.currentTime));
//         if (visibleData.length > 0) {
//             const maxDensity = Math.max(...visibleData.map(d => d.protonDensity));
//             const maxVelocity = Math.max(...visibleData.map(d => d.protonVelocity));
            
//             document.getElementById('impactAnalysis').innerHTML = `
//                 <div>Peak Density: <span style="color: white">${maxDensity.toFixed(1)} p/cm³</span></div>
//                 <div>Peak Velocity: <span style="color: white">${maxVelocity.toFixed(0)} km/s</span></div>
//                 <div>Duration: <span style="color: white">~2 hours</span></div>
//             `;
//         }
//     }
    
//     startAnimation() {
//         const animate = () => {
//             if (this.simulationComplete) {
//                 if (this.animationId) {
//                     cancelAnimationFrame(this.animationId);
//                     this.animationId = null;
//                 }
//                 return;
//             }
            
//             if (this.isPlaying && this.currentTime < this.totalDuration) {
//                 this.currentTime += 0.5;
//                 this.updateTimeline();
                
//                 // Only update graphs if in analysis phase and not complete
//                 if (this.currentPhase === 'analysis' && !this.isAnalysisComplete) {
//                     this.updateGraphs();
//                     this.updateSummaryStats();
//                 }
//             }
            
//             // Check if simulation is complete
//             if (this.currentTime >= this.totalDuration) {
//                 this.completeSimulation();
//                 return;
//             }
            
//             this.animationId = requestAnimationFrame(animate);
//         };
        
//         animate();
//     }
    
//     completeSimulation() {
//         this.isPlaying = false;
//         this.simulationComplete = true;
//         this.isAnalysisComplete = true;
        
//         // Update UI
//         document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i>';
        
//         // Show final complete graphs
//         if (this.currentPhase === 'analysis') {
//             this.finalizeGraphs();
//         }
        
//         // Stop the animation loop
//         if (this.animationId) {
//             cancelAnimationFrame(this.animationId);
//             this.animationId = null;
//         }
//     }
    
//     finalizeGraphs() {
//         // Show complete graph data when analysis is finished
//         const labels = this.graphData.map(d => d.time);
        
//         this.charts.density.data.labels = labels;
//         this.charts.density.data.datasets[0].data = this.graphData.map(d => d.protonDensity);
//         this.charts.density.update();
        
//         this.charts.velocity.data.labels = labels;
//         this.charts.velocity.data.datasets[0].data = this.graphData.map(d => d.protonVelocity);
//         this.charts.velocity.update();
        
//         this.charts.flux.data.labels = labels;
//         this.charts.flux.data.datasets[0].data = this.graphData.map(d => d.protonFlux);
//         this.charts.flux.update();
        
//         // Update final summary stats
//         const maxDensity = Math.max(...this.graphData.map(d => d.protonDensity));
//         const maxVelocity = Math.max(...this.graphData.map(d => d.protonVelocity));
        
//         document.getElementById('impactAnalysis').innerHTML = `
//             <div>Peak Density: <span style="color: white">${maxDensity.toFixed(1)} p/cm³</span></div>
//             <div>Peak Velocity: <span style="color: white">${maxVelocity.toFixed(0)} km/s</span></div>
//             <div>Duration: <span style="color: white">~2 hours</span></div>
//         `;
//     }
    
//     updateTimeline() {
//         const progress = (this.currentTime / this.totalDuration) * 100;
        
//         // Update progress bar
//         document.getElementById('timelineProgress').style.width = `${progress}%`;
        
//         // Update progress percentage
//         document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
        
//         // Update timeline indicator
//         document.getElementById('timelineIndicator').style.left = `${progress}%`;
        
//         // Update scrubber
//         document.getElementById('timelineScrubber').value = this.currentTime;
        
//         // Update phase markers
//         const markers = document.querySelectorAll('.marker-dot');
//         const phases = [0, 25, 60, 80];
        
//         markers.forEach((marker, index) => {
//             if (this.currentTime >= phases[index]) {
//                 marker.classList.add('active');
//             } else {
//                 marker.classList.remove('active');
//             }
//         });
//     }
    
//     togglePlayPause() {
//         // Don't allow play if simulation is complete
//         if (this.simulationComplete) {
//             return;
//         }
        
//         this.isPlaying = !this.isPlaying;
//         const btn = document.getElementById('playPauseBtn');
//         btn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        
//         if (this.isPlaying && !this.animationId) {
//             this.startAnimation();
//         }
//     }
    
//     setCurrentTime(time) {
//         this.currentTime = time;
//         this.updateTimeline();
        
//         // Reset completion flag if scrubbing backwards
//         if (time < this.totalDuration) {
//             this.simulationComplete = false;
//             this.isAnalysisComplete = false;
//         }
        
//         // Update graphs only if in analysis phase and not manually scrubbing to end
//         if (this.currentPhase === 'analysis') {
//             if (time >= this.totalDuration) {
//                 this.completeSimulation();
//             } else {
//                 this.updateGraphs();
//                 this.updateSummaryStats();
//             }
//         }
//     }
    
//     resetSimulation() {
//         // Stop animation
//         this.isPlaying = false;
//         this.simulationComplete = false; // Reset completion flag
//         this.isAnalysisComplete = false; // Reset completion flag
        
//         if (this.animationId) {
//             cancelAnimationFrame(this.animationId);
//             this.animationId = null;
//         }
        
//         this.currentTime = 0;
//         this.currentPhase = 'input';
        
//         // Hide all panels
//         document.getElementById('inputPanel').classList.remove('hidden');
//         document.getElementById('bottomControls').classList.add('hidden');
//         document.getElementById('phaseIndicator').classList.add('hidden');
//         document.getElementById('statusMessage').classList.add('hidden');
//         document.getElementById('graphsPanel').classList.add('hidden');
        
//         // Reset animations
//         document.getElementById('cmeShockwave').classList.add('hidden');
//         document.getElementById('cmeShockwave').classList.remove('animate');
//         document.getElementById('cmePlasma').classList.add('hidden');
//         document.getElementById('cmePlasma').classList.remove('animate');
//         document.getElementById('l1Point').classList.remove('impact');
        
//         // Reset form
//         document.getElementById('cmeForm').reset();
        
//         // Reset timeline
//         this.updateTimeline();
        
//         // Clear charts
//         Object.values(this.charts).forEach(chart => {
//             chart.data.labels = [];
//             chart.data.datasets[0].data = [];
//             chart.update();
//         });
//     }
    
//     toggleTheme() {
//         this.isDarkMode = !this.isDarkMode;
//         const app = document.getElementById('app');
//         const themeBtn = document.getElementById('themeToggle');
        
//         if (this.isDarkMode) {
//             app.classList.remove('light-mode');
//             app.classList.add('dark-mode');
//             themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
//         } else {
//             app.classList.remove('dark-mode');
//             app.classList.add('light-mode');
//             themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
//         }
//     }
    
//     toggleFullscreen() {
//         if (!document.fullscreenElement) {
//             document.documentElement.requestFullscreen();
//         } else {
//             document.exitFullscreen();
//         }
//     }
// }

// // Initialize the simulation when DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//     new AdityaL1Simulation();
// });

// // Handle fullscreen changes
// document.addEventListener('fullscreenchange', () => {
//     const btn = document.getElementById('fullscreenBtn');
//     if (document.fullscreenElement) {
//         btn.innerHTML = '<i class="fas fa-compress"></i>';
//     } else {
//         btn.innerHTML = '<i class="fas fa-expand"></i>';
//     }
// });

