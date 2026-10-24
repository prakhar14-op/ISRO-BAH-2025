// Feature data
const physicsFeatures = [
  {
    id: "advanced-cme-detection",
    title: "Advanced CME Detection Parameter",
    description:
      "Combines MHD, kinetic and thermodynamic principles into a unified metric to detect CME boundaries in solar wind.",
    detailedExplanation:
      "This advanced parameter integrates magnetohydrodynamic (MHD) theory with kinetic plasma physics and thermodynamic principles. It creates a comprehensive detection algorithm that can identify CME boundaries by analyzing multiple plasma parameters simultaneously, including magnetic field variations, particle density changes, and temperature fluctuations. The unified metric provides superior accuracy compared to single-parameter detection methods.",
  },
  {
    id: "dynamic-pressure",
    title: "Dynamic Pressure",
    description: "Represents a fundamental parameter in MHD.",
    detailedExplanation:
      "Dynamic pressure (Pdyn = ρv²) is a crucial parameter in magnetohydrodynamics that represents the kinetic energy density of the plasma flow. In the context of CME detection, sudden increases in dynamic pressure often indicate the arrival of a CME shock front. This parameter is essential for understanding the momentum transfer between the solar wind and planetary magnetospheres.",
  },
  {
    id: "plasma-frequency",
    title: "Plasma Frequency",
    description: "Natural frequency of plasma particles when displaced from equilibrium.",
    detailedExplanation:
      "The plasma frequency (ωp = √(ne²/ε₀m)) represents the natural oscillation frequency of electrons in a plasma when they are displaced from equilibrium. This fundamental parameter is crucial for understanding wave propagation in the solar wind and helps identify plasma instabilities associated with CME passages. Changes in plasma frequency can indicate variations in electron density during CME events.",
  },
  {
    id: "entropy-proxy",
    title: "Entropy Proxy",
    description: "γ = 5/3 for ideal gas, (γ–1) = 2/3, fundamental to thermodynamic relationships.",
    detailedExplanation:
      "The entropy proxy uses the adiabatic index γ to characterize the thermodynamic state of the solar wind plasma. For an ideal monatomic gas, γ = 5/3, making (γ-1) = 2/3. This parameter helps identify thermodynamic anomalies in the solar wind that may indicate CME material, which often has different thermodynamic properties compared to ambient solar wind due to its different origin and evolution.",
  },
  {
    id: "mach-number",
    title: "Mach Number",
    description: "Sound speed carries information about change of pressure through plasma.",
    detailedExplanation:
      "The Mach number (M = v/cs) compares the flow velocity to the sound speed in the plasma. In solar wind analysis, the Mach number helps identify shock waves and compression regions associated with CMEs. Fast-mode shocks (M > 1) often precede CME magnetic clouds, while slow-mode features may be found within the CME itself. The sound speed variations carry crucial information about pressure changes in the plasma.",
  },
  {
    id: "kinetic-impact-index",
    title: "Kinetic Impact Index",
    description: "Z-score normalization of log-transformed Ram Pressure Proxy (Np × Vp²).",
    detailedExplanation:
      "The Kinetic Impact Index applies statistical normalization to the ram pressure proxy (Np × Vp²) using Z-score transformation of log-transformed values. This index quantifies the kinetic impact potential of solar wind structures, with high values indicating enhanced momentum flux that could significantly affect planetary magnetospheres. The logarithmic transformation helps handle the wide dynamic range of solar wind parameters.",
  },
]

const statisticalFeatures = [
  {
    id: "cme-index",
    title: "CME Index",
    description:
      "Z_Np, Z_Vp, and Z_Tp (Z-score normalized density, velocity, temperature). Peaks when all 3 spike simultaneously.",
    detailedExplanation:
      "The CME Index combines three Z-score normalized parameters: density (Z_Np), velocity (Z_Vp), and temperature (Z_Tp). This composite index reaches maximum values when all three parameters simultaneously deviate from their normal ranges, providing a robust statistical indicator of CME passage. The simultaneous enhancement of these parameters is a characteristic signature of CME events.",
  },
  {
    id: "velocity-fluctuation",
    title: "Velocity Fluctuation",
    description: "Supersonic variations in Vp reflect solar wind turbulence.",
    detailedExplanation:
      "Velocity fluctuations measure the variability in proton velocity (Vp) that exceeds the local sound speed, indicating supersonic turbulence in the solar wind. These fluctuations are often enhanced within CME structures due to internal turbulence and interaction with the ambient solar wind. High-frequency velocity variations can indicate the presence of flux rope structures or shock-compressed regions within CMEs.",
  },
  {
    id: "enhancement-factor",
    title: "Enhancement Factor",
    description: "Measures deviation from normal values—an indicator of possible CME events.",
    detailedExplanation:
      "The Enhancement Factor quantifies how much observed parameters deviate from their statistical normal values, typically calculated as the ratio of observed to expected values. Values significantly greater than 1 indicate potential CME events. This factor is particularly useful for identifying subtle CME signatures that might not trigger other detection algorithms, providing a sensitive measure of solar wind anomalies.",
  },
  {
    id: "spectral-index",
    title: "Spectral Index",
    description: "Power-law: Flux(E) ∝ E⁻ᵞ, where γ is the spectral index.",
    detailedExplanation:
      "The spectral index γ characterizes the energy distribution of particles following a power-law relationship Flux(E) ∝ E⁻ᵞ. In CME analysis, changes in the spectral index can indicate different acceleration mechanisms and particle populations. CME-associated particle events often show distinct spectral characteristics compared to ambient solar wind, with the spectral index providing insights into the acceleration processes within CME structures.",
  },
  {
    id: "spectral-curvature",
    title: "Spectral Curvature",
    description: "F1, F2, F3 are fluxes in 3 consecutive energy channels; E1, E2, E3 their mean energies.",
    detailedExplanation:
      'Spectral curvature analyzes the deviation from a simple power-law by examining fluxes (F1, F2, F3) in three consecutive energy channels with mean energies (E1, E2, E3). This parameter captures the "bend" or curvature in the energy spectrum, which can indicate complex acceleration processes or multiple particle populations within CME events. Spectral curvature is particularly sensitive to the presence of energetic particle enhancements associated with CME shocks.',
  },
  {
    id: "statistical-summary",
    title: "Statistical Summary",
    description: "Comprehensive overview of calculated averages and statistical measures of all features.",
    detailedExplanation:
      "The Statistical Summary provides a comprehensive overview of all calculated parameters, including mean values, standard deviations, confidence intervals, and correlation coefficients between different features. This summary helps identify patterns and relationships between various CME indicators, providing a holistic view of the statistical analysis results and helping researchers understand the overall characteristics of the detected CME event.",
  },
]

// Integrated App Class
class IntegratedCMEApp {
  constructor() {
    this.currentView = "landing" // landing, features, simulation
    this.currentTab = "physics"
    this.cmeData = {}
    this.simulation = null

    this.init()
  }

  init() {
    this.createFloatingParticles()
    this.setupEventListeners()
  }

  createFloatingParticles() {
    const particlesContainer = document.querySelector(".floating-particles")
    if (!particlesContainer) return

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div")
      particle.className = "particle"
      particle.style.left = Math.random() * 100 + "%"
      particle.style.top = Math.random() * 100 + "%"
      particle.style.animationDelay = Math.random() * 2 + "s"
      particle.style.animationDuration = 2 + Math.random() * 3 + "s"
      particlesContainer.appendChild(particle)
    }
  }

  setupEventListeners() {
    // Form submission - show features panel
    document.getElementById("cmeForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleFormSubmit(e)
    })

    // Features panel controls
    document.getElementById("closePanelBtn").addEventListener("click", () => {
      this.showView("landing")
    })

    document.getElementById("proceedToSimulation").addEventListener("click", () => {
      this.startSimulation()
    })

    // Tab switching
    document.getElementById("physicsTab").addEventListener("click", () => {
      this.switchTab("physics")
    })

    document.getElementById("statisticalTab").addEventListener("click", () => {
      this.switchTab("statistical")
    })

    // Modal controls
    document.getElementById("closeModalBtn").addEventListener("click", () => {
      this.closeModal()
    })

    // Back to features from simulation
    document.getElementById("backToFeaturesBtn")?.addEventListener("click", () => {
      this.showView("features")
    })

    // Close modal/panel when clicking backdrop
    document.querySelector(".panel-backdrop")?.addEventListener("click", () => {
      this.showView("landing")
    })

    document.querySelector(".modal-backdrop")?.addEventListener("click", () => {
      this.closeModal()
    })

    // Escape key to close modal/panel
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal()
        if (this.currentView === "features") {
          this.showView("landing")
        }
      }
    })
  }

  handleFormSubmit(e) {
    const formData = new FormData(e.target)
    this.cmeData = Object.fromEntries(formData)

    // Validate required fields
    if (
      !this.cmeData.date ||
      !this.cmeData.time ||
      !this.cmeData.speed ||
      !this.cmeData.angularWidth ||
      !this.cmeData.sourceLocation
    ) {
      alert("Please fill in all required fields")
      return
    }

    // Show features panel
    this.showView("features")
  }

  showView(view) {
    // Hide all views
    document.getElementById("landingPage").classList.add("hidden")
    document.getElementById("featuresPanel").classList.add("hidden")
    document.getElementById("app").classList.add("hidden")

    // Show selected view
    switch (view) {
      case "landing":
        document.getElementById("landingPage").classList.remove("hidden")
        document.body.style.overflow = "auto"
        break
      case "features":
        document.getElementById("featuresPanel").classList.remove("hidden")
        this.renderFeatures()
        document.body.style.overflow = "hidden"
        break
      case "simulation":
        document.getElementById("app").classList.remove("hidden")
        document.body.style.overflow = "hidden"
        break
    }

    this.currentView = view
  }

  switchTab(tab) {
    this.currentTab = tab

    // Update tab buttons
    document.getElementById("physicsTab").classList.toggle("active", tab === "physics")
    document.getElementById("statisticalTab").classList.toggle("active", tab === "statistical")

    // Update tab button colors
    if (tab === "physics") {
      document.getElementById("physicsTab").style.background = "rgba(59, 130, 246, 0.8)"
      document.getElementById("statisticalTab").style.background = "transparent"
    } else {
      document.getElementById("statisticalTab").style.background = "rgba(168, 85, 247, 0.8)"
      document.getElementById("physicsTab").style.background = "transparent"
    }

    this.renderFeatures()
  }

  renderFeatures() {
    const grid = document.getElementById("featuresGrid")
    const features = this.currentTab === "physics" ? physicsFeatures : statisticalFeatures

    grid.innerHTML = ""

    features.forEach((feature, index) => {
      const card = this.createFeatureCard(feature, index)
      grid.appendChild(card)
    })
  }

  createFeatureCard(feature, index) {
    const card = document.createElement("div")
    card.className = "feature-card"
    card.style.animationDelay = `${index * 100}ms`

    card.innerHTML = `
      <h3 class="feature-title">${feature.title}</h3>
      <p class="feature-description">${feature.description}</p>
      <button class="learn-more-btn" onclick="app.showModal('${feature.id}')">
        <i class="fas fa-info-circle"></i>
        Learn More
      </button>
    `

    return card
  }

  showModal(featureId) {
    const features = this.currentTab === "physics" ? physicsFeatures : statisticalFeatures
    const feature = features.find((f) => f.id === featureId)

    if (!feature) return

    document.getElementById("modalTitle").textContent = feature.title
    document.getElementById("modalContent").textContent = feature.detailedExplanation

    const modal = document.getElementById("featureModal")
    modal.classList.remove("hidden")
  }

  closeModal() {
    const modal = document.getElementById("featureModal")
    modal.classList.add("hidden")
  }

  startSimulation() {
    // Show loading state
    this.showLoadingOverlay()

    // Transition to simulation after brief delay
    setTimeout(() => {
      this.showView("simulation")
      this.hideLoadingOverlay()

      // Initialize the simulation with form data
      if (!this.simulation) {
        this.simulation = new AdityaL1Simulation(this.cmeData)
      } else {
        this.simulation.updateCMEData(this.cmeData)
      }

      // Auto-start the simulation
      setTimeout(() => {
        this.simulation.startSimulation()
      }, 1000)
    }, 1500)
  }

  showLoadingOverlay() {
    let overlay = document.getElementById("loadingOverlay")
    if (!overlay) {
      overlay = document.createElement("div")
      overlay.id = "loadingOverlay"
      overlay.className = "loading-overlay"
      overlay.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <h3>Initializing CME Simulation...</h3>
          <p>Preparing analysis parameters and visualization</p>
        </div>
      `
      document.body.appendChild(overlay)
    }
    overlay.classList.add("active")
  }

  hideLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay")
    if (overlay) {
      overlay.classList.remove("active")
    }
  }
}

// Simulation class (integrated from previous code)
class AdityaL1Simulation {
  constructor(cmeData = {}) {
    this.currentPhase = "input"
    this.isPlaying = false
    this.currentTime = 0
    this.totalDuration = 100
    this.isDarkMode = true
    this.cmeData = cmeData
    this.animationId = null
    this.charts = {}
    this.graphData = []
    this.simulationComplete = false
    this.isAnalysisComplete = false

    this.init()
  }

  init() {
    this.setupSimulationEventListeners()
    this.initializeSpaceBackground()
    this.setupCharts()
  }

  updateCMEData(newData) {
    this.cmeData = newData
    this.resetSimulation()
  }

  setupSimulationEventListeners() {
    // Theme toggle
    document.getElementById("themeToggle")?.addEventListener("click", () => {
      this.toggleTheme()
    })

    // Fullscreen toggle
    document.getElementById("fullscreenBtn")?.addEventListener("click", () => {
      this.toggleFullscreen()
    })

    // Playback controls
    document.getElementById("playPauseBtn")?.addEventListener("click", () => {
      this.togglePlayPause()
    })

    document.getElementById("resetBtn")?.addEventListener("click", () => {
      this.resetSimulation()
    })

    // Timeline scrubber
    document.getElementById("timelineScrubber")?.addEventListener("input", (e) => {
      this.setCurrentTime(Number.parseInt(e.target.value))
    })

    // Window resize
    window.addEventListener("resize", () => {
      this.resizeCanvas()
    })
  }

  startSimulation() {
    // Generate graph data based on form input
    this.generateGraphData()

    // Show controls
    document.getElementById("bottomControls")?.classList.remove("hidden")
    document.getElementById("phaseIndicator")?.classList.remove("hidden")

    // Start simulation sequence
    this.setPhase("cme-launch")
    this.isPlaying = true
    this.currentTime = 0
    this.startAnimation()

    // Phase transitions
    setTimeout(() => this.setPhase("cme-travel"), 2000)
    setTimeout(() => this.setPhase("l1-impact"), 5000)
    setTimeout(() => this.setPhase("analysis"), 8000)
  }

  // ... (Include all other simulation methods from the previous code)
  // This includes: initializeSpaceBackground, setupCharts, generateGraphData,
  // setPhase, animateCMELaunch, animateL1Impact, updateGraphs, etc.

  generateGraphData() {
    this.graphData = []
    const baseTime = new Date(`${this.cmeData.date}T${this.cmeData.time}`).getTime()

    for (let i = 0; i < 100; i++) {
      const time = new Date(baseTime + i * 60000)
      const impactPoint = 60

      let protonDensity = 5 + Math.random() * 2
      let protonVelocity = 400 + Math.random() * 50
      let protonFlux = 1e6 + Math.random() * 5e5

      if (i >= impactPoint && i <= impactPoint + 20) {
        const spikeIntensity = Math.exp(-Math.pow(i - impactPoint - 10, 2) / 50)
        protonDensity += (this.cmeData.speed / 50) * spikeIntensity
        protonVelocity += this.cmeData.speed * 0.8 * spikeIntensity
        protonFlux += this.cmeData.speed * 1000 * spikeIntensity
      }

      this.graphData.push({
        time: time.toLocaleTimeString(),
        timestamp: time,
        protonDensity: Math.max(0, protonDensity),
        protonVelocity: Math.max(0, protonVelocity),
        protonFlux: Math.max(0, protonFlux),
        index: i,
      })
    }
  }

  // Add other necessary simulation methods here...
  // (Include all methods from the previous simulation code)

  resetSimulation() {
    this.isPlaying = false
    this.simulationComplete = false
    this.isAnalysisComplete = false

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    this.currentTime = 0
    this.currentPhase = "input"

    // Hide panels
    document.getElementById("bottomControls")?.classList.add("hidden")
    document.getElementById("phaseIndicator")?.classList.add("hidden")
    document.getElementById("statusMessage")?.classList.add("hidden")
    document.getElementById("graphsPanel")?.classList.add("hidden")

    // Reset animations
    document.getElementById("cmeShockwave")?.classList.add("hidden")
    document.getElementById("cmePlasma")?.classList.add("hidden")

    // Clear charts if they exist
    if (this.charts.density) {
      Object.values(this.charts).forEach((chart) => {
        chart.data.labels = []
        chart.data.datasets[0].data = []
        chart.update()
      })
    }
  }

  // Placeholder methods - implement full simulation methods from previous code
  initializeSpaceBackground() {
    /* Implementation from previous code */
  }
  setupCharts() {
    /* Implementation from previous code */
  }
  setPhase(phase) {
    /* Implementation from previous code */
  }
  togglePlayPause() {
    /* Implementation from previous code */
  }
  toggleTheme() {
    /* Implementation from previous code */
  }
  toggleFullscreen() {
    /* Implementation from previous code */
  }
  startAnimation() {
    /* Implementation from previous code */
  }
  resizeCanvas() {
    /* Implementation from previous code */
  }
  setCurrentTime(time) {
    /* Implementation from previous code */
  }
}

// Initialize the integrated app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new IntegratedCMEApp()
})
