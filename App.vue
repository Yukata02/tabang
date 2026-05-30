<template>
  <div ref="appRoot" class="simulation-container">
    <!-- WebGL Canvas Container -->
    <div ref="canvasContainer" class="canvas-container"></div>

    <!-- Cinematic loading -->
    <div v-if="showCinematicLoading" class="cinematic-loading">
      <div class="cinematic-glow"></div>
      <h2>Initializing HelmQuest...</h2>
      <p>{{ loadingHint }}</p>
    </div>

    <!-- Landing — title + press any key -->
    <div
      v-if="activeScreen === 'landing'"
      class="scene-overlay landing-overlay game-landing"
      @click="proceedFromLandingToMainMenu"
    >
      <div class="game-landing-bg"></div>
      <div class="game-landing-vignette"></div>

      <div class="game-landing-splash">
        <h1 class="game-title" aria-label="HelmQuest">
          <span class="game-title-helm">Helm</span><span class="game-title-quest">Quest</span>
        </h1>
        <p class="game-hero-tagline">Master every wave</p>
      </div>

      <p class="press-any-key" aria-live="polite">Press any key</p>
    </div>

    <!-- Main menu -->
    <div v-if="activeScreen === 'mainmenu' && !showMenuSettings" class="scene-overlay landing-overlay game-landing main-menu-screen">
      <div class="game-landing-bg"></div>
      <div class="game-landing-vignette"></div>

      <div class="game-landing-center main-menu-center">
        <nav class="game-menu" aria-label="Main menu">
          <button type="button" class="game-menu-btn game-menu-btn-primary" @click="goToScreen('play-options')">
            Play
          </button>
          <button type="button" class="game-menu-btn" @click="goToScreen('auth')" v-if="!isAuthenticated">
            Login
          </button>
          <button type="button" class="game-menu-btn" @click="goToScreen('dashboard')" v-else>
            Dashboard
          </button>
          <button type="button" class="game-menu-btn" @click="openMenuSettings()">
            Settings
          </button>
        </nav>
      </div>
    </div>

    <!-- Play options screen -->
    <div v-if="activeScreen === 'play-options'" class="scene-overlay landing-overlay game-landing main-menu-screen">
      <div class="game-landing-bg"></div>
      <div class="game-landing-vignette"></div>

      <div class="game-landing-center main-menu-center">
        <nav class="game-menu" aria-label="Play options">
          <button type="button" class="game-menu-btn game-menu-btn-primary" @click="startQuickSail()">
            Free Roam
          </button>
          <button type="button" class="game-menu-btn" @click="goToTraining()" v-if="isAuthenticated">
            Training Modules
          </button>
          <button type="button" class="game-menu-btn game-menu-btn-ghost" @click="goToScreen('mainmenu')">
            Back
          </button>
        </nav>
      </div>
    </div>

    <!-- Training Modules Screen -->
    <div v-if="activeScreen === 'training'" class="scene-overlay training-overlay">
      <div class="training-shell glass-card">
        <h2>Navigation Training Modules</h2>
        <p class="training-subtitle">Core competencies for fisheries students</p>
        
        <div class="training-grid">
          <article v-for="module in trainingModules" :key="module.id" class="training-card" :class="{ completed: module.completed }">
            <div class="training-header">
              <span class="training-category">{{ module.category }}</span>
              <span class="training-difficulty">{{ module.difficulty }}</span>
            </div>
            <h3>{{ module.title }}</h3>
            <p>{{ module.description }}</p>
            <div class="training-meta">
              <span>⏱ {{ module.duration }}</span>
              <span v-if="module.completed">✓ Completed</span>
            </div>
            <div class="training-objectives">
              <h4>Learning Objectives:</h4>
              <ul>
                <li v-for="objective in module.objectives" :key="objective">{{ objective }}</li>
              </ul>
            </div>
            <button class="menu-btn menu-btn-play" @click="startTrainingModule(module.id)">
              {{ module.completed ? 'Review' : 'Start Training' }}
            </button>
          </article>
        </div>
        
        <div class="landing-actions">
          <button class="menu-btn menu-btn-settings" @click="goToScreen('play-options')">Back</button>
        </div>
      </div>
    </div>

    <!-- Settings modal -->
    <div v-if="showMenuSettings" class="menu-settings-modal">
      <div class="menu-settings-card glass-card">
        <h2>Settings</h2>
        <div class="menu-settings-content">
          <label class="setting-row">
            <span>Sound Volume</span>
            <input type="range" v-model="soundVolume" min="0" max="1" step="0.1" />
          </label>
          <label class="setting-row">
            <span>Start Camera</span>
            <select v-model="menuStartCamera">
              <option value="chase">Chase Camera</option>
              <option value="orbit">Orbit Camera</option>
              <option value="helm">Helm Camera</option>
            </select>
          </label>
          <label class="setting-row">
            <span>Graphics Quality</span>
            <select v-model="graphicsQuality">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </label>
          <label class="setting-row">
            <span>Water Quality</span>
            <select v-model="waterQuality">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label class="setting-row">
            <span>Shadow Quality</span>
            <select v-model="shadowQuality">
              <option value="off">Off</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label class="setting-row">
            <span>UI Scale</span>
            <select v-model="uiScale">
              <option value="0.8">Small</option>
              <option value="1.0">Normal</option>
              <option value="1.2">Large</option>
              <option value="1.4">Extra Large</option>
            </select>
          </label>
          <label class="setting-row">
            <span>Show FPS</span>
            <input type="checkbox" v-model="showFPS" />
          </label>
        </div>
        <div class="menu-settings-actions">
          <button class="menu-btn" @click="closeMenuSettings()">Close</button>
        </div>
      </div>
    </div>

    <!-- Auth -->
    <div v-if="activeScreen === 'auth'" class="scene-overlay auth-overlay">
      <div class="auth-card glass-card">
        <h2>{{ authMode === 'login' ? 'Welcome Back, Cadet' : 'Create HelmQuest Account' }}</h2>
        <p class="small">Authentication is mocked for prototype presentation.</p>
        <input class="auth-input" placeholder="Student Email" v-model="authForm.email" />
        <input class="auth-input" placeholder="Password" type="password" v-model="authForm.password" />
        <div class="auth-row">
          <label class="remember-toggle">
            <input type="checkbox" v-model="authForm.remember" />
            <span>Remember me</span>
          </label>
          <button class="ghost-link" @click="authMode = authMode === 'login' ? 'register' : 'login'">
            {{ authMode === 'login' ? 'Create account' : 'Back to login' }}
          </button>
        </div>
        <button class="menu-btn menu-btn-play" @click="mockAuthenticate">Continue</button>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-if="activeScreen === 'dashboard'" class="scene-overlay dashboard-overlay">
      <div class="dashboard-shell">
        <aside class="left-nav glass-card">
          <h3>HelmQuest</h3>
          <button class="nav-btn" :class="{active: dashboardRole==='student'}" @click="dashboardRole='student'">Student Dashboard</button>
          <button class="nav-btn" :class="{active: dashboardRole==='instructor'}" @click="dashboardRole='instructor'">Instructor Dashboard</button>
          <button class="nav-btn" @click="goToScreen('missions')">Mission Select</button>
          <button class="nav-btn" @click="startQuickSail()">Quick Launch Sim</button>
          <button class="nav-btn" @click="goToScreen('mainmenu')">Main Menu</button>
        </aside>

        <main class="dashboard-main glass-card">
          <template v-if="dashboardRole==='student'">
            <h2>Student Navigation Command Center</h2>
            <div class="kpi-grid">
              <div class="kpi-card"><span>XP</span><strong>{{ demoStudent.xp }}</strong></div>
              <div class="kpi-card"><span>Rank</span><strong>{{ demoStudent.rank }}</strong></div>
              <div class="kpi-card"><span>Missions</span><strong>{{ demoStudent.completed }}/12</strong></div>
              <div class="kpi-card"><span>Accuracy</span><strong>{{ demoStudent.accuracy }}%</strong></div>
            </div>
            <div class="progress-wrap"><div class="progress-fill" :style="{width: `${demoStudent.xpProgress}%`}"></div></div>
            <div class="chart-row">
              <div class="mini-chart">
                <h4>Recent Session Scores</h4>
                <div class="bars">
                  <div v-for="(v,i) in demoCharts.sessionScores" :key="`s-${i}`" class="bar" :style="{height: `${v}%`}"></div>
                </div>
              </div>
              <div class="mini-chart">
                <h4>Skill Radar (Mock)</h4>
                <ul class="radar-list">
                  <li v-for="skill in demoCharts.skills" :key="skill.name"><span>{{ skill.name }}</span><b>{{ skill.value }}%</b></li>
                </ul>
              </div>
            </div>
          </template>

          <template v-else>
            <h2>Instructor Oversight Panel</h2>
            <div class="kpi-grid">
              <div class="kpi-card"><span>Active Cadets</span><strong>42</strong></div>
              <div class="kpi-card"><span>Avg Completion</span><strong>76%</strong></div>
              <div class="kpi-card"><span>At-Risk</span><strong>7</strong></div>
              <div class="kpi-card"><span>AI Insight</span><strong>Storm handling weak</strong></div>
            </div>
            <div class="chart-row">
              <div class="mini-chart">
                <h4>Checkpoint Heatmap (Mock)</h4>
                <div class="heatmap-grid">
                  <span v-for="n in 20" :key="`h-${n}`" :style="{opacity: (0.25 + (n%5)*0.15)}"></span>
                </div>
              </div>
              <div class="mini-chart">
                <h4>Completion Trend</h4>
                <div class="bars">
                  <div v-for="(v,i) in demoCharts.completionTrend" :key="`c-${i}`" class="bar alt" :style="{height: `${v}%`}"></div>
                </div>
              </div>
            </div>
          </template>
        </main>
      </div>
    </div>


    <!-- Client-Side Error Boundary HUD -->
    <div v-if="fatalError" class="fatal-error-hud">
      <h2>⚠️ SIMULATION CRASHED</h2>
      <p>A runtime exception was caught by the error boundary:</p>
      <pre>{{ fatalError }}</pre>
      <button class="btn btn-danger" @click="clearError" style="width: auto; margin-top: 12px;">Dismiss & Retry</button>
    </div>

    <!-- Legacy HUD disabled (kept in file for now) -->
    <div class="hud-overlay" v-if="false && initComplete && activeScreen === 'simulation'">
      <!-- Top Title and Stats Bar -->
      <header class="hud-header">
        <div class="title-section">
          <h1>3D BOAT SIMULATOR</h1>
          <span class="subtitle">Modern Cabin Cruiser Edition</span>
        </div>
        <div class="quick-stats">
          <div class="stat-badge ui-priority-badge">
            <span class="stat-label">MODE</span>
            <span class="stat-value">UI FIRST</span>
          </div>
          <div class="stat-badge" :class="{ alert: stats.state === 'SINKING!' }">
            <span class="stat-label">STATUS</span>
            <span class="stat-value">{{ stats.state }}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-label">CAMERA</span>
            <span class="stat-value uppercase">{{ activeCamera === 'orbit' ? 'Orbit View' : 'Helm Cam' }}</span>
          </div>
          <div class="stat-badge audio-badge" @click="toggleMusic" :class="{ active: musicPlaying }">
            <span class="stat-label">MUSIC</span>
            <span class="stat-value">
              <svg v-if="musicPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-music-playing"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.063 2.062h1.932l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-music-muted"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.063 2.062h1.932l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.57 17.47a.75.75 0 11-1.06-1.06 5.25 5.25 0 000-7.42.75.75 0 111.06-1.06 6.75 6.75 0 010 9.54z" /></svg>
              {{ musicPlaying ? 'ON' : 'OFF' }}
            </span>
          </div>
        </div>
      </header>

      <!-- Sidebar Configuration Panel -->
      <aside class="hud-sidebar">
        <!-- Tabs Menu -->
        <nav class="sidebar-tabs">
          <button 
            v-for="tab in ['physics', 'environment', 'options']" 
            :key="tab"
            class="tab-btn" 
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            {{ tab === 'options' ? 'Settings' : tab }}
          </button>
        </nav>

        <!-- Tab Contents -->
        <div class="tab-content">
          <!-- Physics Config -->
          <div v-show="activeTab === 'physics'" class="tab-panel ui-preview-panel">
            <h3>Physics Engine Parameters</h3>
            <p class="ui-preview-note">UI preview mode: these controls are display-only right now.</p>
            
            <div class="control-group">
              <label for="thrust">Thrust Force <span class="val">{{ physics.thrustForce.toFixed(1) }}</span></label>
              <input id="thrust" type="range" min="0" max="25" step="0.5" v-model.number="physics.thrustForce" />
            </div>

            <div class="control-group">
              <label for="drag">Drag Coefficient <span class="val">{{ physics.dragCoefficient.toFixed(2) }}</span></label>
              <input id="drag" type="range" min="0" max="2" step="0.01" v-model.number="physics.dragCoefficient" />
            </div>

            <div class="control-group">
              <label for="reaction">Water Reaction <span class="val">{{ physics.waterReactionForce.toFixed(3) }}</span></label>
              <input id="reaction" type="range" min="0" max="0.1" step="0.001" v-model.number="physics.waterReactionForce" />
            </div>

            <div class="control-group">
              <label for="mass">Boat Mass <span class="val">{{ physics.mass }} kg</span></label>
              <input id="mass" type="range" min="30" max="300" step="1" v-model.number="physics.mass" />
              <div class="input-warning" v-if="physics.mass > physics.sinkingThreshold">
                ⚠️ Mass exceeds buoyancy limit ({{ physics.sinkingThreshold }} kg)
              </div>
            </div>

            <div class="control-group">
              <label for="deceleration">Deceleration <span class="val">{{ physics.decelerationRate.toFixed(3) }}</span></label>
              <input id="deceleration" type="range" min="0.9" max="1" step="0.001" v-model.number="physics.decelerationRate" />
            </div>
          </div>

          <!-- Environment Config -->
          <div v-show="activeTab === 'environment'" class="tab-panel ui-preview-panel">
            <h3>Sea & Wind Conditions</h3>
            <p class="ui-preview-note">UI preview mode: these controls are display-only right now.</p>

            <div class="control-group">
              <label for="waveAmp">Wave Amplitude <span class="val">{{ physics.waveAmplitude.toFixed(1) }}m</span></label>
              <input id="waveAmp" type="range" min="0" max="4" step="0.1" v-model.number="physics.waveAmplitude" @input="onWaterParamChange" />
            </div>

            <div class="control-group">
              <label for="waveFreq">Wave Frequency <span class="val">{{ physics.waveFrequency.toFixed(1) }} Hz</span></label>
              <input id="waveFreq" type="range" min="0" max="5" step="0.1" v-model.number="physics.waveFrequency" @input="onWaterParamChange" />
            </div>

            <div class="divider"></div>

            <div class="control-group">
              <label for="windForce">Wind Impact Factor <span class="val">{{ physics.windForce.toFixed(2) }}</span></label>
              <input id="windForce" type="range" min="0" max="0.5" step="0.01" v-model.number="physics.windForce" />
            </div>

            <div class="control-group">
              <label for="windSpeed">Wind Speed <span class="val">{{ wind.speed.toFixed(2) }} m/s</span></label>
              <input id="windSpeed" type="range" min="0" max="2" step="0.05" v-model.number="wind.speed" />
            </div>

            <div class="control-group">
              <div class="compass-label-wrapper">
                <label>Wind Heading</label>
                <span class="val">{{ wind.directionAngle }}°</span>
              </div>
              
              <!-- Interactive Compass Dial -->
              <div class="compass-container">
                <div class="compass-dial" :style="{ transform: `rotate(${-wind.directionAngle}deg)` }">
                  <div class="compass-arrow">↑</div>
                  <div class="compass-points">
                    <span class="n">N</span>
                    <span class="e">E</span>
                    <span class="s">S</span>
                    <span class="w">W</span>
                  </div>
                </div>
                <input type="range" min="0" max="360" step="5" class="compass-slider" v-model.number="wind.directionAngle" />
              </div>
            </div>
          </div>

          <!-- Simulation Panel / Controls -->
          <div v-show="activeTab === 'options'" class="tab-panel">
            <h3>Waterline Adjustment</h3>
            <p class="small description-text">Fine-tune the boat's vertical draft in the water.</p>

            <div class="control-group">
              <label for="waterlineOffset">Draft Offset <span class="val">{{ physics.waterlineOffset.toFixed(1) }}m</span></label>
              <input id="waterlineOffset" type="range" min="-8" max="8" step="0.2" v-model.number="physics.waterlineOffset" />
            </div>

            <div class="divider"></div>
            
            <h3>Simulation Options</h3>

            <div class="view-actions">
              <button class="btn btn-secondary" @click="toggleCamera" id="cameraToggleBtn">
                Switch to {{ activeCamera === 'orbit' ? 'Cockpit Cam' : 'Orbit Cam' }}
              </button>
              
              <button class="btn btn-danger" @click="resetSimulation" id="resetBtn">
                Reset Boat Simulation
              </button>
            </div>

            <div class="divider"></div>

            <div class="control-group audio-controls">
              <label>Sinking Theme Volume</label>
              <input type="range" min="0" max="1" step="0.05" v-model="soundVolume" @input="updateVolume" />
            </div>

            <div class="sound-track-info">
              <p class="small">Background track: <code>music.m4a</code> (Automatic on sinking or manual toggle)</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Bottom Speedometer & Telemetry Bar -->
      <footer class="hud-footer">
        <!-- Speedometer Section -->
        <div class="gauge-card speed-card">
          <div class="gauge-radial">
            <svg viewBox="0 0 100 100" class="gauge-svg">
              <circle cx="50" cy="50" r="45" class="gauge-track"></circle>
              <circle cx="50" cy="50" r="45" class="gauge-fill" :style="speedGaugeStyle"></circle>
            </svg>
            <div class="gauge-value">
              <span class="num">{{ speedKnotsText }}</span>
              <span class="unit">KNOTS</span>
            </div>
          </div>
          <div class="gauge-details">
            <div class="detail-row">
              <span class="label">Heading</span>
              <span class="val">{{ headingText }}°</span>
            </div>
            <div class="detail-row">
              <span class="label">Altitude Y</span>
              <span class="val">{{ stats.yPos.toFixed(2) }} m</span>
            </div>
          </div>
        </div>

        <!-- Controls Guide Card -->
        <div class="guide-card">
          <h4>MANEUVERING GUIDE</h4>
          <div class="keys-grid">
            <div class="key-item"><kbd id="keyW">W</kbd> <span>Throttle</span></div>
            <div class="key-item"><kbd id="keyS">S</kbd> <span>Reverse</span></div>
            <div class="key-item"><kbd id="keyA">A</kbd> <span>Steer Left</span></div>
            <div class="key-item"><kbd id="keyD">D</kbd> <span>Steer Right</span></div>
            <div class="key-item"><kbd id="keyC">C</kbd> <span>Camera Toggle</span></div>
            <div class="key-item"><kbd>Double Click</kbd> <span>Fullscreen</span></div>
          </div>
        </div>
      </footer>
    </div>

    <!-- Top-center heading strip (reference-style) -->
    <div v-if="activeScreen === 'simulation'" class="compass-hud-top">
      <div ref="compassStripViewportRef" class="compass-strip-viewport">
        <div class="compass-strip-center-tick" aria-hidden="true"></div>
        <div
          class="compass-strip-track"
          :style="{
            transform: `translateX(${compassStripTranslatePx}px)`,
            width: `${compassStripTrackWidthPx}px`
          }"
        >
          <span
            v-for="deg in compassStripMarks"
            :key="`strip-${deg}`"
            class="strip-mark"
            :class="{ major: markDisplayDeg(deg) % 90 === 0 }"
            :style="{ left: `${markCenterPx(deg)}px` }"
          >
            {{ cardinalLabel(deg) }}
            <i>{{ markDisplayDeg(deg) }}</i>
          </span>
        </div>
      </div>
      <div class="compass-strip-heading">{{ headingText }}°</div>
    </div>

    <!-- Minimal mission objective box -->
    <div v-if="activeScreen === 'simulation'" class="mission-objective-box">
      <button class="objective-toggle" @click="isObjectiveCollapsed = !isObjectiveCollapsed">
        <span class="objective-label">{{ activeTrainingModule && isAuthenticated ? 'Training Steps' : 'Mission Objective' }}</span>
        <span class="objective-arrow" :class="{ collapsed: isObjectiveCollapsed }">▾</span>
      </button>
      <div v-if="!isObjectiveCollapsed">
        <h4>{{ currentMissionTitle }}</h4>
        <div v-if="activeTrainingModule && isAuthenticated">
          <div class="training-progress-mini">
            <div class="training-progress-bar-mini">
              <div class="training-progress-fill-mini" :style="{ width: trainingProgressPercent + '%' }"></div>
            </div>
            <span class="training-step-counter-mini">Step {{ currentTrainingStep + 1 }} of {{ activeTrainingModule.steps.length }}</span>
          </div>
          <p class="objective-text training-instruction-text">{{ currentStepInstruction }}</p>
          <ul class="training-objectives-list">
            <li v-for="(objective, idx) in activeTrainingModule.objectives" :key="idx" :class="{ completed: idx < currentTrainingStep }">
              {{ objective }}
            </li>
          </ul>
          <div class="training-feedback-mini" :class="{ success: trainingStepSuccess, error: trainingStepError }">
            <p>{{ trainingFeedback }}</p>
          </div>
        </div>
        <p v-else class="objective-text">{{ currentMissionObjective }}</p>
      </div>
    </div>

    <!-- Right-side navigation HUD -->
    <div v-if="activeScreen === 'simulation'" class="nav-hud-right">
      <div class="top-gauges">
        <div class="mini-gauge">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="46" class="g-bg"></circle>
            <circle cx="60" cy="60" r="46" class="g-ring roll"></circle>
          </svg>
          <div class="mini-gauge-center">
            <span>Roll</span>
            <strong>{{ Math.round(stats.rollDeg) }}°</strong>
          </div>
        </div>
        <div class="mini-gauge">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="46" class="g-bg"></circle>
            <circle cx="60" cy="60" r="46" class="g-ring pitch"></circle>
          </svg>
          <div class="mini-gauge-center">
            <span>Pitch</span>
            <strong>{{ Math.round(stats.pitchDeg) }}°</strong>
          </div>
        </div>
      </div>

      <div class="speed-pill">{{ speedKnotsText }} Knots</div>

      <div class="compass-card" aria-label="Heading compass">
        <div
          class="compass-face"
          :style="{ transform: `translate(-50%, -50%) rotate(${-compassContinuousDeg}deg)` }"
        >
          <span class="north">N</span>
          <span class="east">E</span>
          <span class="south">S</span>
          <span class="west">W</span>
        </div>
        <div class="compass-needle" aria-hidden="true"></div>
        <div class="compass-heading-readout">{{ headingText }}°</div>
        <div class="waypoint-dot" aria-hidden="true"></div>
      </div>

      <div class="data-pills">
        <div class="data-pill">{{ speedMsText }} m/s</div>
        <div class="data-pill">{{ clockText }}</div>
        <div class="data-pill" :class="{ 'anchor-active': anchor.deployed }" @click="toggleAnchor" style="cursor: pointer;">
          {{ anchor.deployed ? '⚓ Retract (H)' : '⚓ Deploy (H)' }}
        </div>
      </div>

      <div class="icon-actions">
        <button class="icon-btn" title="Camera" @click="toggleCamera">📷</button>
        <button class="icon-btn" title="Music" @click="toggleMusic">{{ musicPlaying ? '🔊' : '🔈' }}</button>
        <button class="icon-btn" title="Weather" @click="toggleStormMode">{{ stormMode ? '🌩️' : '🌤️' }}</button>
        <button class="icon-btn" title="Reset" @click="resetSimulation">↺</button>
        <button class="icon-btn" title="Fullscreen" @click="toggleFullscreen">⛶</button>
      </div>

      <button
        class="exit-hold-btn"
        title="Hold to return to dashboard (` key)"
        @mousedown="startExitHold"
        @mouseup="cancelExitHold"
        @mouseleave="cancelExitHold"
        @touchstart.prevent="startExitHold"
        @touchend.prevent="cancelExitHold"
      >
        {{ exitHoldActive ? 'HOLDING…' : 'EXIT (HOLD `)' }}
      </button>
    </div>

    <!-- Sinking Crash Alarm Overlay -->
    <transition name="fade">
      <div class="sinking-overlay" v-if="stats.state === 'SINKING!' && activeScreen === 'simulation'">
        <div class="alarm-box">
          <div class="siren-light"></div>
          <h2>WARNING: HULL INTEGRITY CRITICAL</h2>
          <p>The boat is taking on water due to excessive cargo mass.</p>
          <button class="btn btn-danger" @click="resetSimulation">Emergency Reset</button>
        </div>
      </div>
    </transition>

    <!-- Gamification popup -->
    <transition name="fade">
      <div class="achievement-popup" v-if="achievementPopup">
        <h4>Achievement Unlocked</h4>
        <p>{{ achievementPopup }}</p>
      </div>
    </transition>

    <!-- Anchor warning -->
    <transition name="fade">
      <div class="anchor-warning" v-if="anchorWarning">
        <p>Please retract the anchor (H) before moving</p>
      </div>
    </transition>

    <!-- Island collision warning -->
    <transition name="fade">
      <div
        v-if="islandCollisionWarning && activeScreen === 'simulation'"
        class="anchor-warning island-collision-warning"
      >
        <p>⚠ Shore collision — slow down and steer away from the island</p>
      </div>
    </transition>


    <!-- HTML Audio element -->
    <audio ref="audioPlayer" src="/music.m4a" loop></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadOceanSimulation } from './helpers/oceanSimulation.js';
import { createCommercialFishingTrawler } from './helpers/createFishingTrawler.js';
import { loadBoatModel } from './helpers/loadBoatModel.js';
import { normalizeBoatToScene, resolveTargetBoatLength, CHASE_CAM_BEHIND_LOA, CHASE_CAM_LOOK_AHEAD_LOA, CHASE_CAM_HEIGHT_LOA } from './helpers/normalizeBoatScale.js';
import { SIMULATION_SPAWN, SCENE_WATERLINE_Y, updateSimulationSpawn } from './helpers/sceneEnvironment.js';
import { loadArchipelago, getDefaultSimHeading, resolveIslandCollisionAccurate, distanceToNearestIslandShore, ISLAND_PROXIMITY_MARGIN, clampToOceanBounds, OCEAN_MAP_HALF_EXTENT } from './helpers/worldIslands.js';

// --- Reactive State ---
const initComplete = ref(false);
const activeTab = ref('physics');
const activeCamera = ref('chase'); // 'chase' | 'orbit' | 'helm'
const musicPlaying = ref(false);
const soundVolume = ref(0.5);
const fatalError = ref(null);
const showMainMenu = ref(true);
const showMenuSettings = ref(false);
const isAuthenticated = ref(false);
const menuStartCamera = ref('chase');
const simulationRunning = ref(false);
const uiFirstMode = ref(true);
const graphicsQuality = ref('high');
const waterQuality = ref('high');
const shadowQuality = ref('medium');
const uiScale = ref('1.0');
const showFPS = ref(false);
const activeScreen = ref('landing');
const authMode = ref('login');
const dashboardRole = ref('student');
const achievementPopup = ref('');
const showCinematicLoading = ref(false);
const loadingHint = ref('Preparing ocean telemetry');
const isObjectiveCollapsed = ref(false);
const stormMode = ref(false);
const exitHoldActive = ref(false);
const nowTick = ref(Date.now());

const authForm = ref({
  email: '',
  password: '',
  remember: true
});

const demoStudent = ref({
  xp: 3840,
  rank: 'Navigator II',
  completed: 5,
  accuracy: 82,
  xpProgress: 68
});

const demoCharts = ref({
  sessionScores: [55, 63, 72, 78, 66, 84, 91],
  completionTrend: [35, 48, 52, 59, 66, 74, 81],
  skills: [
    { name: 'Compass Use', value: 84 },
    { name: 'Docking', value: 61 },
    { name: 'Storm Control', value: 58 },
    { name: 'Route Planning', value: 73 }
  ]
});

// Core Navigation Skill Modules for Fisheries Students
const trainingModules = ref([
  {
    id: 'steering-speed',
    title: 'Basic Steering & Speed Control',
    category: 'Fundamentals',
    description: 'Learn essential boat handling skills including throttle control, steering techniques, and speed management.',
    objectives: [
      'Accelerate smoothly to cruising speed',
      'Execute controlled turns while maintaining speed',
      'Practice gradual deceleration and stopping',
      'Understand the relationship between speed and turning radius'
    ],
    steps: [
      { instruction: 'Press W to accelerate to 3 knots', check: (stats) => stats.speedKnots >= 3 },
      { instruction: 'Press A to turn left 90 degrees', check: (stats) => Math.abs(stats.rotationDeg - 90) < 10 },
      { instruction: 'Press D to turn right 90 degrees', check: (stats) => Math.abs(stats.rotationDeg - 180) < 10 },
      { instruction: 'Release W to decelerate to 1 knot', check: (stats) => stats.speedKnots <= 1.5 && stats.speedKnots >= 0.5 },
      { instruction: 'Press S to reverse briefly', check: (stats) => stats.speedKnots < -0.5 },
      { instruction: 'Return to neutral and stop', check: (stats) => Math.abs(stats.speedKnots) < 0.3 }
    ],
    duration: '5-10 minutes',
    difficulty: 'Beginner',
    reward: '+100 XP',
    completed: false
  },
  {
    id: 'harbor',
    title: 'Harbor Training',
    category: 'Operations',
    description: 'Master slow-speed turns and docking basics in a controlled harbor environment.',
    objectives: [
      'Navigate through harbor at safe speed',
      'Execute precise turns around buoys',
      'Maintain proper distance from other vessels',
      'Practice emergency stopping procedures'
    ],
    steps: [
      { instruction: 'Enter harbor at speed below 2 knots', check: (stats) => stats.speedKnots < 2 },
      { instruction: 'Navigate around first buoy marker', check: (stats) => true }, // Would check position
      { instruction: 'Execute 90-degree turn at buoy', check: (stats) => Math.abs(stats.rotationDeg - 90) < 15 },
      { instruction: 'Maintain speed between 1-2 knots', check: (stats) => stats.speedKnots >= 1 && stats.speedKnots <= 2 },
      { instruction: 'Complete harbor circuit', check: (stats) => true }, // Would check position
      { instruction: 'Come to complete stop at dock', check: (stats) => Math.abs(stats.speedKnots) < 0.2 }
    ],
    duration: '10-15 minutes',
    difficulty: 'Easy',
    reward: '+120 XP',
    completed: false
  },
  {
    id: 'docking-anchoring',
    title: 'Docking & Anchoring Procedures',
    category: 'Operations',
    description: 'Master safe docking techniques and proper anchoring procedures for various conditions.',
    objectives: [
      'Approach dock at appropriate speed and angle',
      'Execute parallel parking alongside dock',
      'Deploy anchor safely in open water',
      'Retrieve anchor and prepare for departure'
    ],
    steps: [
      { instruction: 'Navigate to dock marker at slow speed', check: (stats) => stats.speedKnots < 2 },
      { instruction: 'Align boat parallel to dock', check: (stats) => Math.abs(stats.rotationDeg % 180) < 15 },
      { instruction: 'Approach dock within 5 meters', check: (stats) => true }, // Would check distance to dock
      { instruction: 'Press H to deploy anchor', check: () => anchor.value.deployed },
      { instruction: 'Wait for boat to settle', check: (stats) => Math.abs(stats.speedKnots) < 0.1 },
      { instruction: 'Press H to retract anchor', check: () => !anchor.value.deployed }
    ],
    duration: '10-15 minutes',
    difficulty: 'Intermediate',
    reward: '+200 XP',
    completed: false
  },
  {
    id: 'storm',
    title: 'Storm Passage',
    category: 'Advanced',
    description: 'Navigate rough water with limited visibility and challenging conditions.',
    objectives: [
      'Maintain boat control in high waves',
      'Navigate through storm gates',
      'Keep heading stable despite wind',
      'Execute safe maneuvers in emergency'
    ],
    steps: [
      { instruction: 'Enter storm zone at reduced speed', check: (stats) => stats.speedKnots < 3 },
      { instruction: 'Navigate through first storm gate', check: (stats) => true }, // Would check position
      { instruction: 'Maintain heading within 15 degrees', check: (stats) => true }, // Would check heading stability
      { instruction: 'Pass second storm gate', check: (stats) => true }, // Would check position
      { instruction: 'Navigate through rough waves', check: (stats) => true }, // Would check wave handling
      { instruction: 'Exit storm zone safely', check: (stats) => true } // Would check position
    ],
    duration: '15-20 minutes',
    difficulty: 'Medium',
    reward: '+220 XP',
    completed: false
  },
  {
    id: 'map-compass',
    title: 'Nautical Map & Compass Reading',
    category: 'Navigation',
    description: 'Develop essential navigation skills using compass headings and understanding nautical charts.',
    objectives: [
      'Read and interpret compass headings',
      'Navigate to specific waypoints using bearings',
      'Understand cardinal and intercardinal directions',
      'Plan and execute a basic navigation route'
    ],
    steps: [
      { instruction: 'Face North (0°) and observe compass', check: (stats) => Math.abs(stats.rotationDeg) < 10 },
      { instruction: 'Turn to face East (90°)', check: (stats) => Math.abs(stats.rotationDeg - 90) < 10 },
      { instruction: 'Turn to face South (180°)', check: (stats) => Math.abs(stats.rotationDeg - 180) < 10 },
      { instruction: 'Turn to face West (270°)', check: (stats) => Math.abs(stats.rotationDeg - 270) < 10 || Math.abs(stats.rotationDeg + 90) < 10 },
      { instruction: 'Navigate to waypoint at heading 45°', check: (stats) => Math.abs(stats.rotationDeg - 45) < 15 },
      { instruction: 'Return to starting position', check: (stats) => true } // Would check position
    ],
    duration: '10-15 minutes',
    difficulty: 'Intermediate',
    reward: '+180 XP',
    completed: false
  },
  {
    id: 'emergency-docking',
    title: 'Emergency Docking',
    category: 'Advanced',
    description: 'Complete time-critical safe docking procedure under pressure.',
    objectives: [
      'Rapidly assess docking situation',
      'Execute quick approach maneuvers',
      'Maintain control during emergency stop',
      'Secure vessel safely under time pressure'
    ],
    steps: [
      { instruction: 'Approach emergency dock zone', check: (stats) => true }, // Would check position
      { instruction: 'Reduce speed rapidly', check: (stats) => stats.speedKnots < 1.5 },
      { instruction: 'Align for emergency approach', check: (stats) => Math.abs(stats.rotationDeg % 180) < 20 },
      { instruction: 'Execute emergency stop', check: (stats) => Math.abs(stats.speedKnots) < 0.3 },
      { instruction: 'Secure vessel position', check: (stats) => true }, // Would check position
      { instruction: 'Complete emergency docking', check: (stats) => true } // Would check final position
    ],
    duration: '5-10 minutes',
    difficulty: 'Hard',
    reward: '+300 XP',
    completed: false
  }
]);

const activeTrainingModule = ref(null);
const currentTrainingStep = ref(0);
const trainingProgress = ref({});

const stats = ref({
  speedKnots: 0,
  rotationDeg: 0,
  yPos: 0,
  rollDeg: 0,
  pitchDeg: 0,
  state: 'NORMAL'
});

const physics = ref({
  thrustForce: 0.7, // Halved from 1.4 for reduced acceleration
  dragCoefficient: 0.24,
  waterReactionForce: 0.015,
  mass: 100,
  decelerationRate: 0.96,
  waveAmplitude: 0.85,
  waveFrequency: 1.0,
  windForce: 0.05,
  sinkingThreshold: 250,
  waterlineOffset: 0
});

const wind = ref({
  speed: 0.1,
  directionAngle: 90 // Degrees
});

// Anchor state
const anchor = ref({
  deployed: false,
  deploying: false,
  retracting: false,
  chainLength: 0,
  maxChainLength: 50,
  position: new THREE.Vector3(0, 0, 0)
});

// Alt key state for cursor visibility
const altKeyPressed = ref(false);

// Anchor warning state
const anchorWarning = ref(false);
const islandCollisionWarning = ref(false);
let islandWarningTimerId = null;

// Track if in Quick Sail mode (no achievements)
const isQuickSailMode = ref(false);

// --- Constants ---
// Trawler GLB model
const BOAT_MODEL_FILE = '/assets/trawler (1).glb';

const BOAT_TARGET_LENGTH_METERS = 16.0; // Fishing trawler LOA (~52 ft)
/** ~1.25 m/s cruise (half speed - HUD: speedVel × 10 = knots, m/s = knots / 1.94384) */
const BOAT_MAX_SPEED = 0.625;
const BOAT_MAX_REVERSE = 0.175;

// Chase cam offsets in boat local space (bow = +X); scaled to LOA in applyChaseCameraScale
const _chaseOffsetBehind = new THREE.Vector3();
const _chaseOffsetLook = new THREE.Vector3();
const _chasePosScratch = new THREE.Vector3();
const _chaseLookScratch = new THREE.Vector3();
const _cameraLookScratch = new THREE.Vector3();
const _cameraRightScratch = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);

// Mouse-look offset (camera only — does not rotate the boat)
let cameraLookYaw = 0;
let cameraLookPitch = 0;
let lastMouseLookX = 0;
let lastMouseLookY = 0;
let mouseLookReady = false;
let teardownMouseLook = null;
const MOUSE_LOOK_SENSITIVITY = 0.003;
const MOUSE_LOOK_YAW_LIMIT = THREE.MathUtils.degToRad(85);
const MOUSE_LOOK_PITCH_LIMIT = THREE.MathUtils.degToRad(40);

// --- Three.js Variables ---
let appRoot = ref(null);
let canvasContainer = ref(null);
let audioPlayer = ref(null);
let renderer, scene, camera, camera2, orbitControls;
let ocean, sky, sun;
let ambientLight, mainLight;
let islandGroup;
/** Resolves when the archipelago GLTF is in the scene (Quick Sail waits on this). */
let archipelagoLoadPromise = null;
let environmentPreset = 'day';
let landingCinematicTime = 0;
let landingBoatPoseActive = false;
const LANDING_BOAT_X = 32;
const LANDING_BOAT_Z = 50;
const DEFAULT_CAMERA_FOV = 62;
const LANDING_CAMERA_FOV = 42;
const _landingFocus = new THREE.Vector3();
const _landingLookAt = new THREE.Vector3();
let boatObject = null; // Main physics container
let anchorMesh = null; // Visual anchor mesh
let animationFrameId = null;
let clockIntervalId = null;
let exitHoldTimerId = null;

// Sinking physics trackers
let speedVel = 0;
let speedRot = 0;
let angularVelocity = 0;
let turnRadius = 0;
let isStopping = false;
let isSinking = false;
let sinkingTimer = 0;
let baselineWaterlineY = 13;

// Input Key States
const keyStates = {};

// Custom Speedometer Styling
const speedKnotsText = computed(() => {
  return Math.abs(stats.value.speedKnots).toFixed(1);
});

/** Nautical heading: 0° = North (-Z), 90° = East (+X), clockwise. */
function boatHeadingDegrees(rotationYRad, { round = false } = {}) {
  const deg = 90 - THREE.MathUtils.radToDeg(rotationYRad);
  const wrapped = ((deg % 360) + 360) % 360;
  return round ? Math.round(wrapped) : wrapped;
}

function boatRotationToCompassHeading(rotationYRad) {
  return boatHeadingDegrees(rotationYRad, { round: true });
}

const COMPASS_MARK_WIDTH_PX = 52;
const COMPASS_MARK_STEP_DEG = 15;

const compassStripViewportRef = ref(null);
const compassStripViewportWidth = ref(420);

// Unwrapped degrees for visuals (359 → 360 → 361) so HUD never spins at north.
const compassContinuousDeg = ref(0);
let lastWrappedHeading = 0;
let compassVisualSynced = false;

const headingDeg = computed(() => stats.value.rotationDeg);
const headingText = computed(() => String(headingDeg.value));

function markDisplayDeg(deg) {
  return ((Math.round(deg) % 360) + 360) % 360;
}

function cardinalLabel(deg) {
  const normalized = markDisplayDeg(deg);
  if (normalized === 0) return 'N';
  if (normalized === 90) return 'E';
  if (normalized === 180) return 'S';
  if (normalized === 270) return 'W';
  return '';
}

function markCenterPx(deg) {
  return (deg / COMPASS_MARK_STEP_DEG) * COMPASS_MARK_WIDTH_PX + COMPASS_MARK_WIDTH_PX / 2;
}

function shortestHeadingDelta(fromDeg, toDeg) {
  let delta = toDeg - fromDeg;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

function syncCompassVisualHeading(wrappedHeading, { force = false } = {}) {
  if (force || !compassVisualSynced) {
    compassContinuousDeg.value = wrappedHeading;
    lastWrappedHeading = wrappedHeading;
    compassVisualSynced = true;
    return;
  }

  const delta = shortestHeadingDelta(lastWrappedHeading, wrappedHeading);
  compassContinuousDeg.value += delta;
  lastWrappedHeading = wrappedHeading;
}

const COMPASS_STRIP_WINDOW_DEG = 250;

const compassStripMarks = computed(() => {
  const h = compassContinuousDeg.value;
  const start = Math.floor((h - COMPASS_STRIP_WINDOW_DEG) / COMPASS_MARK_STEP_DEG) * COMPASS_MARK_STEP_DEG;
  const end = Math.floor((h + COMPASS_STRIP_WINDOW_DEG) / COMPASS_MARK_STEP_DEG) * COMPASS_MARK_STEP_DEG;
  const marks = [];
  for (let d = start; d <= end; d += COMPASS_MARK_STEP_DEG) {
    marks.push(d);
  }
  return marks;
});

const compassStripTranslatePx = computed(() => {
  return compassStripViewportWidth.value / 2 - markCenterPx(compassContinuousDeg.value);
});

const compassStripTrackWidthPx = computed(() => {
  const marks = compassStripMarks.value;
  if (!marks.length) return compassStripViewportWidth.value;
  const maxCenter = markCenterPx(marks[marks.length - 1]);
  return Math.max(compassStripViewportWidth.value, maxCenter + COMPASS_MARK_WIDTH_PX);
});

function updateCompassStripViewportWidth() {
  if (compassStripViewportRef.value) {
    compassStripViewportWidth.value = compassStripViewportRef.value.clientWidth;
  }
}

const speedMsText = computed(() => (Math.abs(stats.value.speedKnots) / 1.94384).toFixed(1));

const clockText = computed(() => {
  const d = new Date(nowTick.value);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
});

const speedGaugeStyle = computed(() => {
  const circumference = 2 * Math.PI * 45; // 282.7
  const maxSpeed = 10;
  const currentSpeed = Math.min(Math.abs(stats.value.speedKnots), maxSpeed);
  const percentage = currentSpeed / maxSpeed;
  const offset = circumference * (1 - percentage);
  return {
    strokeDasharray: circumference,
    strokeDashoffset: offset
  };
});

const currentMissionTitle = computed(() => {
  if (activeTrainingModule.value && isAuthenticated.value) return activeTrainingModule.value.title;
  if (isQuickSailMode.value) return 'Quick Sail';
  return 'Free Navigation';
});

const currentMissionObjective = computed(() => {
  if (isQuickSailMode.value) {
    return 'Explore the islands: WASD to drive, mouse to look around, C to switch camera. Stay on the open water.';
  }
  if (!activeTrainingModule.value) {
    return 'Explore freely: WASD to drive, move the mouse over the view to look around, C to switch camera.';
  }
  return activeTrainingModule.value.description;
});

// Training Module Computed Properties
const currentStepInstruction = computed(() => {
  if (!activeTrainingModule.value) return '';
  const step = activeTrainingModule.value.steps[currentTrainingStep.value];
  return step ? step.instruction : '';
});

const trainingProgressPercent = computed(() => {
  if (!activeTrainingModule.value) return 0;
  return ((currentTrainingStep.value + 1) / activeTrainingModule.value.steps.length) * 100;
});

const trainingStepSuccess = ref(false);
const trainingStepError = ref(false);
const trainingFeedback = ref('');

// Clear local error HUD
function clearError() {
  fatalError.value = null;
}

// Watch parameters to update water shader properties
function onWaterParamChange() {
  if (uiFirstMode.value) return;
  if (ocean) {
    ocean.setWaveDistortion(physics.value.waveAmplitude);
    ocean.setPlaybackSpeed(physics.value.waveFrequency * (0.5 + physics.value.waveAmplitude * 0.25));
  }
}

// Watch volume slider
function updateVolume() {
  if (audioPlayer.value) {
    audioPlayer.value.volume = soundVolume.value;
  }
}

// Toggle background music
function toggleMusic() {
  if (!audioPlayer.value) return;
  if (musicPlaying.value) {
    audioPlayer.value.pause();
    musicPlaying.value = false;
  } else {
    audioPlayer.value.play().catch(err => console.log('Audio playback blocked: ', err));
    musicPlaying.value = true;
  }
}

function openMenuSettings() {
  showMenuSettings.value = true;
}

function closeMenuSettings() {
  showMenuSettings.value = false;
}


function startGame() {
  showMainMenu.value = false;
  showMenuSettings.value = false;
  simulationRunning.value = true;
  activeCamera.value = menuStartCamera.value;
  activeScreen.value = 'simulation';
  syncWorldForSimulation();
  syncOrbitControlsEnabled();
  if (activeCamera.value === 'chase') snapChaseCamera();
  requestAnimationFrame(() => updateCompassStripViewportWidth());
  mouseLookReady = false;
}

/** Daylight + visible islands + sim boat pose (missions & Quick Sail). */
function syncWorldForSimulation() {
  if (islandGroup) {
    islandGroup.visible = true;
    updateSimulationSpawn(islandGroup);
  }
  applyEnvironmentPreset('day');
  landingBoatPoseActive = false;
  if (boatObject) restoreBoatSimPose();
}

function isMenuBackdropScreen(screen = activeScreen.value) {
  return screen === 'landing' || screen === 'mainmenu';
}

// Training Module Functions
function goToTraining() {
  if (!isAuthenticated.value) {
    goToScreen('auth');
    return;
  }
  activeScreen.value = 'training';
}

function startTrainingModule(moduleId) {
  if (!isAuthenticated.value) {
    goToScreen('auth');
    return;
  }

  const module = trainingModules.value.find(m => m.id === moduleId);
  if (!module) return;

  activeTrainingModule.value = module;
  currentTrainingStep.value = 0;
  trainingStepSuccess.value = false;
  trainingStepError.value = false;
  trainingFeedback.value = '';

  // Start simulation with training mode
  isQuickSailMode.value = true;
  startQuickSail();
}

function exitTraining() {
  activeTrainingModule.value = null;
  currentTrainingStep.value = 0;
  trainingStepSuccess.value = false;
  trainingStepError.value = false;
  trainingFeedback.value = '';
  goToScreen('training');
}

function checkTrainingStep() {
  if (!activeTrainingModule.value) return;

  const module = activeTrainingModule.value;
  const step = module.steps[currentTrainingStep.value];

  if (step && step.check) {
    const passed = step.check(stats.value);
    
    if (passed) {
      trainingStepSuccess.value = true;
      trainingStepError.value = false;
      trainingFeedback.value = '✓ Step completed!';
      
      setTimeout(() => {
        trainingStepSuccess.value = false;
        trainingFeedback.value = '';
        
        // Move to next step
        if (currentTrainingStep.value < module.steps.length - 1) {
          currentTrainingStep.value++;
        } else {
          // Module completed
          module.completed = true;
          trainingFeedback.value = '🎉 Training module completed!';
          achievementPopup.value = `${module.title} Completed!`;
          
          setTimeout(() => {
            achievementPopup.value = '';
            exitTraining();
          }, 3000);
        }
      }, 1500);
    }
  }
}

function applySunPosition(elevationDeg, azimuthDeg) {
  if (!sun || !sky) return;
  const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
  const theta = THREE.MathUtils.degToRad(azimuthDeg);
  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms.sunPosition.value.copy(sun);
  ocean?.setSunDirection(sun);
}

function applyEnvironmentPreset(preset) {
  if (!renderer || !scene || !sky) return;

  const alreadyOnPreset = environmentPreset === preset;
  if (alreadyOnPreset) {
    if (preset === 'day') scene.fog = new THREE.FogExp2(0xc5d8ea, 0.00038);
    if (islandGroup) islandGroup.visible = true;
    return;
  }

  environmentPreset = preset;

  if (preset === 'sunset') {
    applySunPosition(2.2, 238);
    sky.material.uniforms.turbidity.value = 16;
    sky.material.uniforms.rayleigh.value = 3.4;
    sky.material.uniforms.mieCoefficient.value = 0.014;
    sky.material.uniforms.mieDirectionalG.value = 0.92;
    ocean?.setWaterColor(0x1a3a52);
    ocean?.setSunColor(0xffa060);
    ocean?.setOpacityScale(0.92);
    ocean?.setWaveDistortion(3.2);
    ocean?.setPlaybackSpeed(0.55);
    if (ambientLight) {
      ambientLight.color.setHex(0xffb88a);
      ambientLight.intensity = 0.38;
    }
    if (mainLight) {
      mainLight.color.setHex(0xff9f5a);
      mainLight.intensity = 1.35;
      mainLight.position.set(-140, 55, -60);
    }
    renderer.toneMappingExposure = 1.22;
    scene.fog = new THREE.FogExp2(0x5c3a4a, 0.0016);
    if (islandGroup) islandGroup.visible = true;
  } else {
    applySunPosition(8, 180);
    sky.material.uniforms.turbidity.value = 10;
    sky.material.uniforms.rayleigh.value = 2;
    sky.material.uniforms.mieCoefficient.value = 0.005;
    sky.material.uniforms.mieDirectionalG.value = 0.8;
    ocean?.setWaterColor(0x0a3d5c);
    ocean?.setSunColor(0xfff5e6);
    ocean?.setOpacityScale(1.02);
    onWaterParamChange();
    if (ambientLight) {
      ambientLight.color.setHex(0xdbeafe);
      ambientLight.intensity = 0.55;
    }
    if (mainLight) {
      mainLight.color.setHex(0xfffaed);
      mainLight.intensity = 1.55;
      mainLight.position.set(100, 300, -200);
    }
    renderer.toneMappingExposure = 1.0;
    scene.fog = new THREE.FogExp2(0xc5d8ea, 0.00038);
    if (islandGroup) islandGroup.visible = true;
  }
}

function applyLandingBoatPose() {
  if (!boatObject || landingBoatPoseActive) return;
  boatObject.position.set(
    LANDING_BOAT_X,
    baselineWaterlineY + physics.value.waterlineOffset,
    LANDING_BOAT_Z
  );
  boatObject.rotation.set(0, Math.PI / 2 + 0.52, 0);
  boatObject.scale.setScalar(1.08);
  landingBoatPoseActive = true;
}

function restoreBoatSimPose() {
  if (!boatObject) return;
  landingBoatPoseActive = false;
  boatObject.position.set(SIMULATION_SPAWN.x, baselineWaterlineY + physics.value.waterlineOffset, SIMULATION_SPAWN.z);
  const bowHeading = getDefaultSimHeading();
  boatObject.rotation.set(0, bowHeading, 0);
  boatObject.rotation.z = 0;
  boatObject.scale.setScalar(1);
  syncCompassVisualHeading(boatRotationToCompassHeading(boatObject.rotation.y), { force: true });
}

function updateLandingCinematic(delta) {
  if (!camera || !boatObject) return;

  applyLandingBoatPose();

  landingCinematicTime += delta;
  const t = landingCinematicTime;

  const bob = Math.sin(t * 0.9) * 0.14;
  const sway = Math.sin(t * 0.55) * 0.006;
  boatObject.position.y = baselineWaterlineY + physics.value.waterlineOffset + bob;
  boatObject.rotation.z = sway;

  const boatPos = boatObject.position;
  const driftX = Math.sin(t * 0.11) * 0.9;
  const driftY = Math.sin(t * 0.19) * 0.45;
  const driftZ = Math.cos(t * 0.14) * 0.7;

  // Low angle from the left — hull fills the right half (reference composition)
  camera.fov = LANDING_CAMERA_FOV;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.position.set(
    boatPos.x - 44 + driftX,
    boatPos.y + 4.2 + driftY,
    boatPos.z + 20 + driftZ
  );

  _landingLookAt.set(boatPos.x + 2, boatPos.y + 7.5, boatPos.z - 2);
  camera.lookAt(_landingLookAt);
}

function proceedFromLandingToMainMenu() {
  if (activeScreen.value !== 'landing') return;
  goToScreen('mainmenu');
}

function onLandingKeyDown(event) {
  if (activeScreen.value !== 'landing' || fatalError.value) return;
  if (event.repeat) return;
  event.preventDefault();
  proceedFromLandingToMainMenu();
}

function startQuickSail() {
  isQuickSailMode.value = true;
  showCinematicLoading.value = true;
  loadingHint.value = 'Loading islands & open water...';

  const enterSimulation = () => {
    showCinematicLoading.value = false;
    goToScreen('simulation');
    syncWorldForSimulation();
  };

  Promise.resolve(archipelagoLoadPromise)
    .then(enterSimulation)
    .catch((err) => {
      console.error('Archipelago not ready for Quick Sail:', err);
      enterSimulation();
    });
}

function goToScreen(screen) {
  activeScreen.value = screen;
  if (screen === 'simulation') {
    simulationRunning.value = true;
    activeCamera.value = menuStartCamera.value;
    syncOrbitControlsEnabled();
    if (activeCamera.value === 'chase') snapChaseCamera();
    requestAnimationFrame(() => updateCompassStripViewportWidth());
    mouseLookReady = false;
  } else {
    simulationRunning.value = false;
    isQuickSailMode.value = false; // Reset Quick Sail mode when leaving simulation
    cancelExitHold();
    mouseLookReady = false;
    resetCameraLookOffset();
    if (orbitControls) orbitControls.enabled = false;
  }
}

function showAchievement(text) {
  if (isQuickSailMode.value) return; // Skip achievements in Quick Sail mode
  achievementPopup.value = text;
  window.setTimeout(() => {
    if (achievementPopup.value === text) achievementPopup.value = '';
  }, 2600);
}

function mockAuthenticate() {
  showCinematicLoading.value = true;
  loadingHint.value = 'Authenticating maritime profile';
  window.setTimeout(() => {
    showCinematicLoading.value = false;
    isAuthenticated.value = true;
    goToScreen('dashboard');
    showAchievement('Welcome aboard, Cadet!');
  }, 1200);
}


function toggleStormMode() {
  stormMode.value = !stormMode.value;
  if (stormMode.value) {
    physics.value.waveAmplitude = 2.8;
    physics.value.waveFrequency = 2.1;
    wind.value.speed = 0.9;
    if (ocean) {
      ocean.setWaterColor(0x081e30);
      ocean.setSunColor(0xccccdd);
      ocean.setOpacityScale(1.08);
      onWaterParamChange();
    }
    showAchievement('Storm mode engaged');
  } else {
    physics.value.waveAmplitude = 0.5;
    physics.value.waveFrequency = 1.0;
    wind.value.speed = 0.1;
    if (ocean) {
      ocean.setWaterColor(0x0a3d5c);
      ocean.setSunColor(0xfff5e6);
      ocean.setOpacityScale(1);
      onWaterParamChange();
    }
    showAchievement('Calm sea restored');
  }
}

function toggleFullscreen() {
  const root = appRoot.value;
  if (!root) return;
  if (!document.fullscreenElement) {
    root.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

function startExitHold() {
  if (exitHoldTimerId) return;
  exitHoldActive.value = true;
  exitHoldTimerId = window.setTimeout(() => {
    exitHoldActive.value = false;
    exitHoldTimerId = null;
    goToScreen('dashboard');
  }, 900);
}

function cancelExitHold() {
  exitHoldActive.value = false;
  if (exitHoldTimerId) {
    window.clearTimeout(exitHoldTimerId);
    exitHoldTimerId = null;
  }
}

function syncOrbitControlsEnabled() {
  if (!orbitControls) return;
  orbitControls.enabled = activeCamera.value === 'orbit';
}

function resetCameraLookOffset() {
  cameraLookYaw = 0;
  cameraLookPitch = 0;
}

function applyCameraLookOffset(camPos, lookTarget) {
  _cameraLookScratch.copy(lookTarget).sub(camPos);
  const distance = _cameraLookScratch.length();
  if (distance < 0.001) return lookTarget;

  _cameraLookScratch.normalize();
  _cameraLookScratch.applyAxisAngle(_worldUp, cameraLookYaw);

  _cameraRightScratch.crossVectors(_cameraLookScratch, _worldUp);
  if (_cameraRightScratch.lengthSq() > 0.0001) {
    _cameraRightScratch.normalize();
    _cameraLookScratch.applyAxisAngle(_cameraRightScratch, cameraLookPitch);
  }

  return camPos.clone().add(_cameraLookScratch.multiplyScalar(distance));
}

function snapChaseCamera() {
  if (!boatObject || !camera) return;
  const behind = _chaseOffsetBehind.clone().applyQuaternion(boatObject.quaternion);
  const ahead = _chaseOffsetLook.clone().applyQuaternion(boatObject.quaternion);
  camera.position.copy(boatObject.position).add(behind);
  camera.lookAt(boatObject.position.clone().add(ahead));
}

function placeOrbitCameraBehindBoat() {
  if (!boatObject || !camera || !orbitControls) return;
  const behind = _chaseOffsetBehind.clone().applyQuaternion(boatObject.quaternion);
  camera.position.copy(boatObject.position).add(behind.multiplyScalar(1.35));
  orbitControls.target.copy(boatObject.position);
  orbitControls.update();
}

// Camera Toggle: chase → orbit → helm
function toggleCamera() {
  resetCameraLookOffset();
  if (activeCamera.value === 'chase') {
    activeCamera.value = 'orbit';
    placeOrbitCameraBehindBoat();
  } else if (activeCamera.value === 'orbit') {
    activeCamera.value = 'helm';
  } else {
    activeCamera.value = 'chase';
    snapChaseCamera();
  }
  syncOrbitControlsEnabled();
}

// Create anchor mesh
function createAnchorMesh() {
  const anchorGroup = new THREE.Group();

  // Anchor shank (vertical bar)
  const shankGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
  const shankMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
  const shank = new THREE.Mesh(shankGeometry, shankMaterial);
  shank.rotation.z = Math.PI / 2;
  anchorGroup.add(shank);

  // Anchor ring (top)
  const ringGeometry = new THREE.TorusGeometry(0.5, 0.15, 8, 16);
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.x = 1;
  ring.rotation.y = Math.PI / 2;
  anchorGroup.add(ring);

  // Anchor arms (bottom curved parts)
  const armCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.5, -1, 0.8),
    new THREE.Vector3(-1, -1.5, 1.2)
  );
  const armGeometry = new THREE.TubeGeometry(armCurve, 20, 0.15, 8, false);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  anchorGroup.add(leftArm);

  const rightArmCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.5, -1, -0.8),
    new THREE.Vector3(-1, -1.5, -1.2)
  );
  const rightArmGeometry = new THREE.TubeGeometry(rightArmCurve, 20, 0.15, 8, false);
  const rightArm = new THREE.Mesh(rightArmGeometry, armMaterial);
  anchorGroup.add(rightArm);

  // Anchor flukes (pointed ends)
  const flukeGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
  const flukeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
  
  const leftFluke = new THREE.Mesh(flukeGeometry, flukeMaterial);
  leftFluke.position.set(-1.2, -1.8, 1.2);
  leftFluke.rotation.z = Math.PI / 4;
  leftFluke.rotation.y = -Math.PI / 6;
  anchorGroup.add(leftFluke);

  const rightFluke = new THREE.Mesh(flukeGeometry, flukeMaterial);
  rightFluke.position.set(-1.2, -1.8, -1.2);
  rightFluke.rotation.z = Math.PI / 4;
  rightFluke.rotation.y = Math.PI / 6;
  anchorGroup.add(rightFluke);

  anchorGroup.scale.set(2, 2, 2);
  anchorGroup.visible = false;
  return anchorGroup;
}

// Anchor Toggle
function toggleAnchor() {
  if (anchor.value.deployed) {
    // Retract anchor
    anchor.value.deployed = false;
    anchor.value.retracting = true;
    anchor.value.chainLength = 0;
    if (anchorMesh) anchorMesh.visible = false;
  } else {
    // Deploy anchor
    if (boatObject) {
      anchor.value.position.copy(boatObject.position);
      anchor.value.deployed = true;
      anchor.value.deploying = true;
      anchor.value.chainLength = anchor.value.maxChainLength;
      
      // Immediately stop the boat
      speedVel = 0;
      speedRot = 0;
      angularVelocity = 0;
      
      // Position and show anchor mesh
      if (!anchorMesh) {
        anchorMesh = createAnchorMesh();
        scene.add(anchorMesh);
      }
      anchorMesh.position.copy(anchor.value.position);
      anchorMesh.position.y = baselineWaterlineY - 2;
      anchorMesh.visible = true;
    }
  }
}

// Reset Simulation
function resetSimulation() {
  speedVel = 0;
  speedRot = 0;
  angularVelocity = 0;
  turnRadius = 0;
  isStopping = false;
  isSinking = false;
  sinkingTimer = 0;

  if (boatObject) {
    boatObject.position.set(SIMULATION_SPAWN.x, baselineWaterlineY + physics.value.waterlineOffset, SIMULATION_SPAWN.z);
    boatObject.rotation.set(0, Math.PI / 2, 0); // bow north (0° compass heading)
    
    if (orbitControls) {
      orbitControls.target.copy(boatObject.position);
      orbitControls.update();
    }
    if (activeCamera.value === 'chase') snapChaseCamera();
    else if (activeCamera.value === 'orbit') placeOrbitCameraBehindBoat();
  }

  if (stats.value.state === 'SINKING!' && !musicPlaying.value && audioPlayer.value) {
    audioPlayer.value.pause();
  }
  stats.value.state = 'NORMAL';
  stats.value.rollDeg = 0;
  stats.value.pitchDeg = 0;
  stats.value.rotationDeg = 0;
  syncCompassVisualHeading(0, { force: true });
  resetCameraLookOffset();
  landingBoatPoseActive = false;
  restoreBoatSimPose();
}

// --- Procedural Teak Wood Plank Texture ---
function createTeakPlankTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Rich warm brown teak base
  ctx.fillStyle = "#9f6032"; 
  ctx.fillRect(0, 0, 512, 512);

  // Subtle natural wood grains
  for (let i = 0; i < 500; i++) {
    ctx.strokeStyle = `rgba(80, 40, 15, ${Math.random() * 0.16})`;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, 0);
    ctx.lineTo(Math.random() * 512, 512);
    ctx.stroke();
  }

  // Soft wood rings
  ctx.fillStyle = "rgba(70, 30, 10, 0.02)";
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, 40 + Math.random() * 120, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw dark caulked deck seams/plank lines
  ctx.strokeStyle = "#25160d";
  ctx.lineWidth = 4;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

// --- Procedural Canvas Fabric Texture (for Canopy Cover) ---
function createCanvasFabricTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // Soft Charcoal Canvas base color
  ctx.fillStyle = "#27272a";
  ctx.fillRect(0, 0, 128, 128);

  // Cross-hatched threads
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 1;
  for (let i = 0; i < 128; i += 2) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// --- HIGH-FIDELITY REALISTIC CABIN CRUISER BUILDER ---
function createRealisticCabinCruiser() {
  const boatGroup = new THREE.Group();
  boatGroup.name = "RealisticCabinCruiser";

  // Materials Config
  const matHullWhite = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  const matHullBottom = new THREE.MeshStandardMaterial({
    color: 0x18181b, 
    roughness: 0.5,
    metalness: 0.1
  });

  const matStripe = new THREE.MeshPhysicalMaterial({
    color: 0x1d4ed8, 
    roughness: 0.15,
    clearcoat: 0.8
  });

  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.05,
    metalness: 0.98
  });

  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.86,
    roughness: 0.02,
    metalness: 0.2,
    transmission: 0.8,
    thickness: 0.8
  });

  const matDeck = new THREE.MeshStandardMaterial({
    map: createTeakPlankTexture(),
    roughness: 0.7
  });

  const matSeat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, 
    roughness: 0.6
  });

  const matSeatTrim = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, 
    roughness: 0.5
  });

  const matCanopyCover = new THREE.MeshStandardMaterial({
    map: createCanvasFabricTexture(),
    roughness: 0.9
  });

  const matLifebuoyRed = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
  const matLifebuoyWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

  const matNavRed = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const matNavGreen = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const matSearchlight = new THREE.MeshBasicMaterial({ color: 0xffffee });

  // 1. Sleek Curved V-Hull (Main Section)
  const hullGeo = new THREE.BoxGeometry(8, 2.2, 4.2, 40, 10, 10);
  const pos = hullGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i); 
    let y = pos.getY(i); 
    let z = pos.getZ(i); 

    if (x > 0.0) {
      let t = x / 4.0;
      let widthSqueeze = 1.0 - Math.pow(Math.abs(t), 2.2) * 0.95;
      pos.setZ(i, z * widthSqueeze);
      pos.setY(i, y + Math.pow(Math.abs(t), 2.2) * 0.75);
    }

    let normX = (x + 4.0) / 8.0; 
    let deadrise = 0.55 * (0.2 + 0.8 * normX); 
    if (y < 0) {
      let keelDepth = (1.0 - Math.abs(pos.getZ(i)) / 2.1) * deadrise;
      pos.setY(i, y - keelDepth * 1.3);
    }

    if (y > 0) {
      pos.setZ(i, pos.getZ(i) * (1.0 + y * 0.06));
    }
  }
  pos.needsUpdate = true; // Signal Three.js to re-upload vertices to GPU
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, matHullWhite);
  hull.position.set(-1.0, 0.4, 0);
  hull.castShadow = true;
  hull.receiveShadow = true;
  boatGroup.add(hull);

  // 2. Tapered Curved V-Bow Section
  const bowGeo = new THREE.BoxGeometry(5.0, 2.2, 4.2, 30, 10, 10);
  const bowPos = bowGeo.attributes.position;
  for (let i = 0; i < bowPos.count; i++) {
    let x = bowPos.getX(i); 
    let y = bowPos.getY(i); 
    let z = bowPos.getZ(i); 

    let t = (x + 2.5) / 5.0; 
    let widthSqueeze = 1.0 - Math.pow(Math.abs(t), 2.0) * 0.96;
    bowPos.setZ(i, z * widthSqueeze);
    bowPos.setY(i, y + (t * 0.9));

    let deadrise = 0.55 * (0.6 + 0.4 * t);
    if (y < 0) {
      let keelDepth = (1.0 - Math.abs(bowPos.getZ(i)) / 2.1) * deadrise;
      bowPos.setY(i, y - keelDepth * 1.3);
    }

    if (y > 0) {
      bowPos.setZ(i, bowPos.getZ(i) * (1.0 + y * 0.06));
    }
  }
  bowPos.needsUpdate = true;
  bowGeo.computeVertexNormals();
  const bow = new THREE.Mesh(bowGeo, matHullWhite);
  bow.position.set(5.5, 0.85, 0);
  bow.castShadow = true;
  bow.receiveShadow = true;
  boatGroup.add(bow);

  // 3. Hull Bottom (Charcoal Gelcoat Bottom Paint)
  const bottomGeo = new THREE.BoxGeometry(11.8, 0.8, 4.22, 40, 4, 4);
  const botPos = bottomGeo.attributes.position;
  for (let i = 0; i < botPos.count; i++) {
    let x = botPos.getX(i);
    let y = botPos.getY(i);
    let z = botPos.getZ(i);

    let t = (x + 5.9) / 11.8;
    botPos.setZ(i, z * (1.0 - Math.pow(Math.abs(t), 2.2) * 0.94));
    if (y < 0) {
      let keelDepth = (1.0 - Math.abs(botPos.getZ(i)) / 2.11) * 0.55;
      botPos.setY(i, y - keelDepth * 1.35);
    }
  }
  botPos.needsUpdate = true;
  bottomGeo.computeVertexNormals();
  const bottom = new THREE.Mesh(bottomGeo, matHullBottom);
  bottom.position.set(2.5, -0.62, 0);
  boatGroup.add(bottom);

  // 4. Accent Racing Stripe
  const stripeGeo = new THREE.BoxGeometry(13.2, 0.16, 4.26, 40, 2, 2);
  const strPos = stripeGeo.attributes.position;
  for (let i = 0; i < strPos.count; i++) {
    let x = strPos.getX(i);
    let z = strPos.getZ(i);
    let t = (x + 6.6) / 13.2;
    strPos.setZ(i, z * (1.0 - Math.pow(Math.abs(t), 2.2) * 0.95));
  }
  strPos.needsUpdate = true;
  stripeGeo.computeVertexNormals();
  const stripe = new THREE.Mesh(stripeGeo, matStripe);
  stripe.position.set(2.5, 0.65, 0);
  boatGroup.add(stripe);

  // 5. Deck Topsides (Premium Teak Planking)
  const deckMainGeo = new THREE.BoxGeometry(7.6, 0.1, 4.14);
  const deckMain = new THREE.Mesh(deckMainGeo, matDeck);
  deckMain.position.set(-1.5, 1.5, 0);
  boatGroup.add(deckMain);

  const deckBowGeo = new THREE.BoxGeometry(5.8, 0.1, 4.14, 20, 1, 1);
  const dbPos = deckBowGeo.attributes.position;
  for (let i = 0; i < dbPos.count; i++) {
    let lx = dbPos.getX(i);
    let ly = dbPos.getY(i);
    let lz = dbPos.getZ(i);
    let t = (lx + 2.9) / 5.8;
    dbPos.setZ(i, lz * (1.0 - t * 0.96));
    dbPos.setY(i, ly + (lx + 2.9) * 0.155); 
  }
  dbPos.needsUpdate = true;
  deckBowGeo.computeVertexNormals();
  const deckBow = new THREE.Mesh(deckBowGeo, matDeck);
  deckBow.position.set(5.1, 1.95, 0);
  boatGroup.add(deckBow);

  // 6. Curved Modern Cabin Structure
  const cabinGeo = new THREE.BoxGeometry(4.8, 1.4, 3.2, 20, 5, 5);
  const cPos = cabinGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    let x = cPos.getX(i); 
    let y = cPos.getY(i); 
    let z = cPos.getZ(i); 
    let t = (x + 2.4) / 4.8;

    cPos.setZ(i, z * (1.0 - t * 0.12));

    if (y > 0) {
      let tZ = Math.abs(z) / 1.6;
      cPos.setY(i, y - Math.pow(Math.abs(tZ), 2) * 0.15);
    }
  }
  cPos.needsUpdate = true;
  cabinGeo.computeVertexNormals();
  const cabin = new THREE.Mesh(cabinGeo, matHullWhite);
  cabin.position.set(1.5, 2.15, 0);
  cabin.castShadow = true;
  boatGroup.add(cabin);

  // 7. Panoramic Tinted Windshield and Curved Glass
  const windshieldGeo = new THREE.CylinderGeometry(1.6, 1.7, 1.25, 24, 1, true, 0, Math.PI);
  const windshield = new THREE.Mesh(windshieldGeo, matGlass);
  windshield.rotation.y = -Math.PI / 2;
  windshield.rotation.z = -0.32; 
  windshield.position.set(3.9, 2.5, 0);
  boatGroup.add(windshield);

  const winPortGeo = new THREE.BoxGeometry(3.6, 0.72, 0.05);
  const winPort = new THREE.Mesh(winPortGeo, matGlass);
  winPort.position.set(1.5, 2.3, 1.61);
  boatGroup.add(winPort);

  const winStarboard = winPort.clone();
  winStarboard.position.z = -1.61;
  boatGroup.add(winStarboard);

  // 8. Sleek Cockpit Canopy (Black Canvas Cover)
  const canopyGeo = new THREE.BoxGeometry(4.2, 1.25, 3.4, 20, 4, 4);
  const capPos = canopyGeo.attributes.position;
  for (let i = 0; i < capPos.count; i++) {
    let x = capPos.getX(i); 
    let y = capPos.getY(i);
    let z = capPos.getZ(i);

    if (y > 0) {
      let t = (x + 2.1) / 4.2;
      capPos.setY(i, y + t * 0.15);
    }
  }
  capPos.needsUpdate = true;
  canopyGeo.computeVertexNormals();
  const canopy = new THREE.Mesh(canopyGeo, matCanopyCover);
  canopy.position.set(-1.0, 2.9, 0);
  canopy.castShadow = true;
  boatGroup.add(canopy);

  // Chrome supports for canopy
  for (let side = -1; side <= 1; side += 2) {
    const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3), matChrome);
    pillarR.position.set(-3.0, 2.1, 1.62 * side);
    pillarR.rotation.z = 0.15;
    boatGroup.add(pillarR);

    const pillarF = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), matChrome);
    pillarF.position.set(-0.8, 2.5, 1.62 * side);
    pillarF.rotation.z = -0.15;
    boatGroup.add(pillarF);
  }

  // 9. Aft Cockpit Seating
  const aftSeatGeo = new THREE.BoxGeometry(0.9, 0.65, 3.5);
  const aftSeat = new THREE.Mesh(aftSeatGeo, matSeat);
  aftSeat.position.set(-4.8, 1.8, 0);
  boatGroup.add(aftSeat);

  const trimGeo = new THREE.BoxGeometry(0.92, 0.08, 3.52);
  const trim = new THREE.Mesh(trimGeo, matSeatTrim);
  trim.position.set(-4.8, 2.1, 0);
  boatGroup.add(trim);

  // Seats
  const seatBaseGeo = new THREE.BoxGeometry(0.85, 0.9, 0.85);
  const seatCushionGeo = new THREE.BoxGeometry(0.87, 0.18, 0.87);

  const createDriverSeat = (offsetZ) => {
    const seatGroup = new THREE.Group();
    const base = new THREE.Mesh(seatBaseGeo, matSeat);
    base.castShadow = true;
    seatGroup.add(base);

    const cushion = new THREE.Mesh(seatCushionGeo, matSeatTrim);
    cushion.position.y = 0.45;
    seatGroup.add(cushion);

    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.5), matSeat);
    headrest.position.set(-0.35, 0.75, 0);
    seatGroup.add(headrest);

    seatGroup.position.set(0.1, 1.9, offsetZ);
    return seatGroup;
  };

  boatGroup.add(createDriverSeat(0.75));
  boatGroup.add(createDriverSeat(-0.75));

  // Helm
  const helmGeo = new THREE.BoxGeometry(0.5, 0.9, 1.2);
  const helm = new THREE.Mesh(helmGeo, matHullWhite);
  helm.position.set(3.3, 1.9, -0.75);
  boatGroup.add(helm);

  const matGps = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }); 
  const gpsScreen = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.5), matGps);
  gpsScreen.position.set(3.04, 2.15, -0.75);
  boatGroup.add(gpsScreen);

  const wheelGroup = new THREE.Group();
  const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 12, 24), matSeatTrim);
  wheelGroup.add(wheelRing);
  for (let s = 0; s < 3; s++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48), matChrome);
    spoke.rotation.z = (s * Math.PI * 2) / 3;
    wheelGroup.add(spoke);
  }
  wheelGroup.position.set(3.03, 1.98, -0.75);
  wheelGroup.rotation.y = Math.PI / 2;
  wheelGroup.rotation.z = 0.22; 
  boatGroup.add(wheelGroup);

  // 10. Lifebuoy
  const buoyGroup = new THREE.Group();
  const buoyBase = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.14, 12, 32), matLifebuoyRed);
  buoyGroup.add(buoyBase);
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.34, 16), matLifebuoyWhite);
    band.position.set(Math.cos(angle) * 0.48, Math.sin(angle) * 0.48, 0);
    band.rotation.z = angle + Math.PI / 2;
    buoyGroup.add(band);
  }
  const matLine = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const lifeline = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.025, 8, 32), matLine);
  buoyGroup.add(lifeline);

  buoyGroup.rotation.x = Math.PI / 2;
  buoyGroup.position.set(1.5, 2.9, 0);
  boatGroup.add(buoyGroup);

  // 11. Electronics
  const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16), matChrome);
  domeBase.position.set(3.0, 2.9, 0.7);
  boatGroup.add(domeBase);

  const domeGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.24, 16);
  const dome = new THREE.Mesh(domeGeo, matHullWhite);
  dome.position.set(3.0, 3.1, 0.7);
  boatGroup.add(dome);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 1.8), matChrome);
  mast.rotation.z = -0.15; 
  mast.position.set(-0.8, 3.6, 0);
  boatGroup.add(mast);

  const lightHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.22, 12), matChrome);
  lightHousing.rotation.z = Math.PI / 2;
  lightHousing.position.set(3.92, 2.95, 0);
  boatGroup.add(lightHousing);

  const lightLens = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), matSearchlight);
  lightLens.rotation.z = Math.PI / 2;
  lightLens.position.set(4.03, 2.95, 0);
  boatGroup.add(lightLens);

  // 12. Nav Lights
  const navPort = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), matNavRed);
  navPort.position.set(3.6, 2.2, 1.63);
  boatGroup.add(navPort);

  const navStbd = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), matNavGreen);
  navStbd.position.set(3.6, 2.2, -1.63);
  boatGroup.add(navStbd);

  // 13. Engines
  const createRealisticEngine = (offsetZ) => {
    const engineGroup = new THREE.Group();

    const cowlGeo = new THREE.BoxGeometry(0.75, 1.05, 0.58, 4, 4, 4);
    const cPos = cowlGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      let x = cPos.getX(i);
      let y = cPos.getY(i);
      let z = cPos.getZ(i);
      if (y > 0.3) {
        cPos.setX(i, x * 0.8);
        cPos.setZ(i, z * 0.8);
      }
    }
    cPos.needsUpdate = true;
    cowlGeo.computeVertexNormals();
    const cowl = new THREE.Mesh(cowlGeo, matCanopyCover);
    cowl.castShadow = true;
    engineGroup.add(cowl);

    const engStripe = new THREE.Mesh(new THREE.BoxGeometry(0.77, 0.08, 0.6), matChrome);
    engStripe.position.set(0, 0.18, 0);
    engineGroup.add(engStripe);

    const columnGeo = new THREE.BoxGeometry(0.26, 1.45, 0.2);
    const col = new THREE.Mesh(columnGeo, matChrome);
    col.position.set(-0.1, -0.95, 0);
    engineGroup.add(col);

    const bulletGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.52, 12);
    const bullet = new THREE.Mesh(bulletGeo, matChrome);
    bullet.rotation.x = Math.PI / 2;
    bullet.position.set(-0.1, -1.68, 0);
    engineGroup.add(bullet);

    const propGroup = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const bladeGeo = new THREE.BoxGeometry(0.04, 0.36, 0.13, 2, 2, 2);
      const blade = new THREE.Mesh(bladeGeo, matChrome);
      blade.position.y = 0.18;
      blade.rotation.x = 0.35; 
      blade.rotation.z = (b * Math.PI * 2) / 3;
      propGroup.add(blade);
    }
    propGroup.position.set(-0.38, -1.68, 0);
    engineGroup.add(propGroup);

    engineGroup.position.set(-5.6, 1.15, offsetZ);
    return engineGroup;
  };

  boatGroup.add(createRealisticEngine(0.95));
  boatGroup.add(createRealisticEngine(-0.95));

  // 14. Railings
  const railingGroup = new THREE.Group();
  const stanchionHeight = 0.65;
  const numStanchions = 8;
  for (let s = 0; s < numStanchions; s++) {
    const xPos = 0.2 + s * 1.35;
    const zOffset = 1.95 - (s * 0.24);

    const stanchionP = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, stanchionHeight, 8), matChrome);
    stanchionP.position.set(xPos, 1.82, zOffset);
    railingGroup.add(stanchionP);

    const stanchionS = stanchionP.clone();
    stanchionS.position.z = -zOffset;
    railingGroup.add(stanchionS);
  }

  const leftRailGeo = new THREE.BoxGeometry(9.6, 0.04, 0.04);
  const leftRail = new THREE.Mesh(leftRailGeo, matChrome);
  leftRail.position.set(4.6, 2.15, 1.05);
  leftRail.rotation.y = -0.19; 
  railingGroup.add(leftRail);

  const rightRail = leftRail.clone();
  rightRail.position.z = -1.05;
  rightRail.rotation.y = 0.19;
  railingGroup.add(rightRail);

  boatGroup.add(railingGroup);

  // 15. Swim platform
  const platformGeo = new THREE.BoxGeometry(0.85, 0.12, 3.8);
  const platform = new THREE.Mesh(platformGeo, matDeck);
  platform.position.set(-5.6, 0.6, 0);
  boatGroup.add(platform);

  const ladderGroup = new THREE.Group();
  const leftRailLad = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8), matChrome);
  leftRailLad.position.z = 0.35;
  ladderGroup.add(leftRailLad);

  const rightRailLad = leftRailLad.clone();
  rightRailLad.position.z = -0.35;
  ladderGroup.add(rightRailLad);

  for (let step = -0.4; step <= 0.4; step += 0.4) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), matChrome);
    rung.rotation.x = Math.PI / 2;
    rung.position.y = step;
    ladderGroup.add(rung);
  }
  ladderGroup.rotation.z = -0.25; 
  ladderGroup.position.set(-5.95, 0.1, -1.25);
  boatGroup.add(ladderGroup);

  boatGroup.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return boatGroup;
}

function applyChaseCameraScale(lengthMeters) {
  _chaseOffsetBehind.set(
    -lengthMeters * CHASE_CAM_BEHIND_LOA,
    lengthMeters * CHASE_CAM_HEIGHT_LOA,
    0
  );
  _chaseOffsetLook.set(
    lengthMeters * CHASE_CAM_LOOK_AHEAD_LOA,
    lengthMeters * CHASE_CAM_HEIGHT_LOA * 0.45,
    0
  );
}

function finalizeSpawnedBoat(modelPath = BOAT_MODEL_FILE) {
  const meshRoot = boatObject;
  if (meshRoot?.parent) meshRoot.parent.remove(meshRoot);

  if (islandGroup) updateSimulationSpawn(islandGroup);

  const targetLength = resolveTargetBoatLength(modelPath);
  const { boat, waterlineY, lengthMeters } = normalizeBoatToScene(meshRoot, {
    targetLength,
    targetWaterlineY: SCENE_WATERLINE_Y,
    spawnX: SIMULATION_SPAWN.x,
    spawnZ: SIMULATION_SPAWN.z,
    waterlineOffset: physics.value.waterlineOffset
  });

  boatObject = boat;
  scene.add(boatObject);
  baselineWaterlineY = waterlineY;
  applyChaseCameraScale(lengthMeters);

  orbitControls.target.copy(boatObject.position);
  orbitControls.update();
  syncOrbitControlsEnabled();
  snapChaseCamera();
  stats.value.rotationDeg = boatRotationToCompassHeading(boatObject.rotation.y);
  syncCompassVisualHeading(stats.value.rotationDeg, { force: true });
  initComplete.value = true;

  if (isMenuBackdropScreen()) {
    landingBoatPoseActive = false;
  }
}

function showIslandCollisionWarning() {
  islandCollisionWarning.value = true;
  if (islandWarningTimerId) window.clearTimeout(islandWarningTimerId);
  islandWarningTimerId = window.setTimeout(() => {
    islandCollisionWarning.value = false;
    islandWarningTimerId = null;
  }, 2800);
}

function applyIslandCollisionBlocking() {
  if (!islandGroup || !boatObject) return;

  const resolved = resolveIslandCollisionAccurate(
    boatObject.position.x,
    boatObject.position.z,
    islandGroup
  );
  if (resolved.collided) {
    boatObject.position.x = resolved.x;
    boatObject.position.z = resolved.z;
    speedVel *= 0.2;
    showIslandCollisionWarning();
    return;
  }

  const shoreDist = distanceToNearestIslandShore(
    boatObject.position.x,
    boatObject.position.z,
    islandGroup
  );
  if (shoreDist < ISLAND_PROXIMITY_MARGIN && Math.abs(speedVel) > 0.08) {
    showIslandCollisionWarning();
  }

  const bounded = clampToOceanBounds(boatObject.position.x, boatObject.position.z);
  if (bounded.x !== boatObject.position.x || bounded.z !== boatObject.position.z) {
    boatObject.position.x = bounded.x;
    boatObject.position.z = bounded.z;
    speedVel *= 0.12;
  }
}

// --- Boat Physics Logic ---
function updateBoatPhysics() {
  if (!boatObject || !simulationRunning.value) return;

  if (!isSinking) {
    // Anchor physics - prevent movement when anchor is deployed
    if (anchor.value.deployed) {
      // Completely disable movement when anchor is deployed
      speedVel = 0;
      speedRot = 0;
      angularVelocity = 0;
      return;
    }

    const thrustAcceleration = keyStates["KeyW"]
      ? physics.value.thrustForce / physics.value.mass
      : 0;

    let reverseAcceleration = 0;
    if (keyStates["KeyS"]) {
      reverseAcceleration = -(physics.value.thrustForce * 0.3) / physics.value.mass;
    }

    const dragForce = 0.5 * physics.value.dragCoefficient * speedVel * speedVel;
    const dragAcceleration = -Math.sign(speedVel) * dragForce / physics.value.mass;
    const waterReactionAcceleration = -speedVel * physics.value.waterReactionForce;

    const totalAcceleration = thrustAcceleration + reverseAcceleration + dragAcceleration + waterReactionAcceleration;
    speedVel += totalAcceleration;

    if (isStopping) {
      speedVel *= physics.value.decelerationRate;
      if (Math.abs(speedVel) < 0.01) {
        speedVel = 0;
        isStopping = false;
      }
    }

    // Check training step completion
    checkTrainingStep();

    if (keyStates["KeyA"]) {
      const turnFactor = Math.max(0, Math.min(1, Math.abs(speedVel) / 0.5));
      speedRot = 0.018 * turnFactor; // Reduced from 0.028 for less responsive steering
      angularVelocity = 0.04 * turnFactor; // Reduced from 0.06
      turnRadius = 1.0;
    } else if (keyStates["KeyD"]) {
      const turnFactor = Math.max(0, Math.min(1, Math.abs(speedVel) / 0.5));
      speedRot = -0.018 * turnFactor; // Reduced from 0.028
      angularVelocity = 0.04 * turnFactor; // Reduced from 0.06
      turnRadius = 1.0;
    } else {
      // Add angular damping for realistic steering drag
      speedRot *= 0.85; // Gradual slowdown instead of instant stop
      angularVelocity *= 0.85;
      if (Math.abs(speedRot) < 0.001) speedRot = 0;
      if (Math.abs(angularVelocity) < 0.001) angularVelocity = 0;
      turnRadius = 0;
    }

    speedVel = THREE.MathUtils.clamp(speedVel, -BOAT_MAX_REVERSE, BOAT_MAX_SPEED);

    boatObject.rotation.y += speedRot;
    boatObject.translateX(speedVel);
    applyIslandCollisionBlocking();

    // Wave Bobbing
    const waveEffect = Math.sin(performance.now() * 0.001 * physics.value.waveFrequency) * physics.value.waveAmplitude;
    boatObject.position.y = (baselineWaterlineY + physics.value.waterlineOffset) + waveEffect;

    // Wind effect
    const windRad = THREE.MathUtils.degToRad(wind.value.directionAngle);
    const windDir = new THREE.Vector3(Math.cos(windRad), 0, Math.sin(windRad));
    const windImpact = windDir.clone().multiplyScalar(wind.value.speed * physics.value.windForce);
    boatObject.position.add(windImpact);
    applyIslandCollisionBlocking();

    const sideImpact = windDir.dot(new THREE.Vector3(1, 0, 0));
    speedRot += sideImpact * 0.0001;
    speedRot = Math.max(Math.min(speedRot, 0.02), -0.02);

    if (angularVelocity > 0 && turnRadius > 0) {
      const centrifugalForce = physics.value.mass * angularVelocity * angularVelocity * turnRadius;
      const adjustment = centrifugalForce * 0.0005;
      boatObject.position.x += adjustment;

      const maxTiltAngle = Math.PI / 8;
      const tilt = angularVelocity * turnRadius * 0.15;
      const currentTilt = Math.min(maxTiltAngle, tilt) * Math.sign(speedRot);
      boatObject.rotation.z = currentTilt;
    } else {
      boatObject.rotation.z *= 0.92;
    }

    if (physics.value.mass > physics.value.sinkingThreshold) {
      isSinking = true;
      stats.value.state = 'SINKING!';
      if (audioPlayer.value && !musicPlaying.value) {
        audioPlayer.value.play().catch(() => {});
        musicPlaying.value = true;
      }
    }

    if (Math.random() < 0.0025) {
      demoStudent.value.xp += 15;
      demoStudent.value.xpProgress = Math.min(100, demoStudent.value.xpProgress + 2);
      showAchievement('+15 XP Checkpoint');
    }

    stats.value.speedKnots = speedVel * 10;
    const headingPrecise = boatHeadingDegrees(boatObject.rotation.y);
    stats.value.rotationDeg = Math.round(headingPrecise);
    syncCompassVisualHeading(headingPrecise);
    stats.value.yPos = boatObject.position.y;
    stats.value.rollDeg = THREE.MathUtils.radToDeg(boatObject.rotation.z || 0);
    stats.value.pitchDeg = THREE.MathUtils.radToDeg(boatObject.rotation.x || 0);

  } else {
    sinkingTimer += 0.001;
    boatObject.position.y -= sinkingTimer;
    boatObject.rotation.z += 0.001;
    boatObject.rotation.x += 0.0005;
    
    speedVel *= 0.95;
    boatObject.translateX(speedVel);

    if (boatObject.position.y < -120) {
      boatObject.position.y = -120;
      speedVel = 0;
    }

    stats.value.speedKnots = speedVel * 10;
    stats.value.yPos = boatObject.position.y;
    stats.value.rollDeg = THREE.MathUtils.radToDeg(boatObject.rotation.z || 0);
    stats.value.pitchDeg = THREE.MathUtils.radToDeg(boatObject.rotation.x || 0);
  }
}

// --- Camera Focus Update ---
function updateCameras() {
  if (!boatObject) return;

  if (activeCamera.value === 'chase') {
    _chasePosScratch.copy(_chaseOffsetBehind).applyQuaternion(boatObject.quaternion).add(boatObject.position);
    _chaseLookScratch.copy(_chaseOffsetLook).applyQuaternion(boatObject.quaternion).add(boatObject.position);
    camera.position.lerp(_chasePosScratch, 0.14);
    camera.lookAt(applyCameraLookOffset(camera.position, _chaseLookScratch));
    if (orbitControls) orbitControls.target.copy(boatObject.position);
  } else if (activeCamera.value === 'orbit') {
    orbitControls.target.copy(boatObject.position);
  } else {
    const relativeHelmOffset = new THREE.Vector3(14, 4.2, 0.4);
    const relativeLookAt = new THREE.Vector3(42, 3.2, 0.4);

    const helmWorld = relativeHelmOffset.clone().applyMatrix4(boatObject.matrixWorld);
    const lookAtWorld = relativeLookAt.clone().applyMatrix4(boatObject.matrixWorld);

    camera2.position.copy(helmWorld);
    camera2.lookAt(applyCameraLookOffset(camera2.position, lookAtWorld));
  }
}

// Keyboard input setup
function setupInputs() {
  window.addEventListener("keyup", (event) => {
    if (activeScreen.value !== 'simulation') return;
    if (event.code === 'Backquote') {
      cancelExitHold();
      return;
    }
    // Track Alt key release
    if (event.key === 'Alt') {
      altKeyPressed.value = false;
      if (activeScreen.value === 'simulation') {
        document.body.style.cursor = 'none';
      }
    }
    keyStates[event.code] = false;
    if (event.code === "KeyW" || event.code === "KeyS") {
      isStopping = true;
    }
    const keyEl = document.getElementById(`key${event.code.replace('Key', '')}`);
    if (keyEl) keyEl.classList.remove('active');
  });

  window.addEventListener("keydown", (event) => {
    if (activeScreen.value !== 'simulation') return;
    if (event.code === 'Backquote') {
      event.preventDefault();
      startExitHold();
      return;
    }
    // Track Alt key press to show cursor
    if (event.key === 'Alt') {
      altKeyPressed.value = true;
      document.body.style.cursor = 'auto';
      return;
    }
    // Anchor toggle with H key
    if (event.code === 'KeyH' && !event.repeat) {
      toggleAnchor();
      return;
    }
    // Check for movement input while anchor is deployed
    if (anchor.value.deployed && (event.code === 'KeyW' || event.code === 'KeyS' || event.code === 'KeyA' || event.code === 'KeyD')) {
      anchorWarning.value = true;
      setTimeout(() => { anchorWarning.value = false; }, 2000);
      return;
    }
    keyStates[event.code] = true;
    if (event.code === "KeyW" || event.code === "KeyS") {
      isStopping = false;
    }
    if (event.code === "KeyC") {
      toggleCamera();
    }
    const keyEl = document.getElementById(`key${event.code.replace('Key', '')}`);
    if (keyEl) keyEl.classList.add('active');
  });

  // Handle window blur (alt+tab) to reset states
  window.addEventListener('blur', () => {
    altKeyPressed.value = false;
    mouseLookReady = false;
    // Reset all key states to prevent stuck keys
    Object.keys(keyStates).forEach(key => {
      keyStates[key] = false;
    });
  });

  // Handle window focus to ensure proper state
  window.addEventListener('focus', () => {
    if (activeScreen.value === 'simulation') {
      document.body.style.cursor = 'none';
      mouseLookReady = false;
    }
  });

  window.addEventListener('dblclick', () => {
    if (activeScreen.value !== 'simulation') return;
    toggleFullscreen();
  });
}

function shouldApplyMouseLook(clientX, clientY) {
  const hit = document.elementFromPoint(clientX, clientY);
  if (!hit) return false;
  if (hit.closest('button, input, select, textarea, a, .nav-hud-right, .mission-objective-box')) {
    return false;
  }
  const canvas = renderer?.domElement;
  if (!canvas) return false;
  if (hit === canvas || canvas.contains(hit)) return true;
  return Boolean(canvasContainer.value?.contains(hit));
}

function disposeMouseLook() {
  if (teardownMouseLook) {
    teardownMouseLook();
    teardownMouseLook = null;
  }
}

function setupMouseLook() {
  if (!renderer?.domElement) return;
  disposeMouseLook();

  const canvas = renderer.domElement;

  const onMouseMove = (event) => {
    if (activeScreen.value !== 'simulation') return;
    if (activeCamera.value === 'orbit') return;
    // Disable mouse look when Alt is held
    if (altKeyPressed.value) return;
    if (!shouldApplyMouseLook(event.clientX, event.clientY)) {
      mouseLookReady = false;
      return;
    }

    if (!mouseLookReady) {
      lastMouseLookX = event.clientX;
      lastMouseLookY = event.clientY;
      mouseLookReady = true;
      return;
    }

    const dx = event.clientX - lastMouseLookX;
    const dy = event.clientY - lastMouseLookY;
    lastMouseLookX = event.clientX;
    lastMouseLookY = event.clientY;

    if (dx === 0 && dy === 0) return;

    cameraLookYaw -= dx * MOUSE_LOOK_SENSITIVITY;
    cameraLookPitch -= dy * MOUSE_LOOK_SENSITIVITY;
    cameraLookPitch = THREE.MathUtils.clamp(
      cameraLookPitch,
      -MOUSE_LOOK_PITCH_LIMIT,
      MOUSE_LOOK_PITCH_LIMIT
    );
    cameraLookYaw = THREE.MathUtils.clamp(
      cameraLookYaw,
      -MOUSE_LOOK_YAW_LIMIT,
      MOUSE_LOOK_YAW_LIMIT
    );
  };

  const onContextMenu = (event) => event.preventDefault();

  window.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('contextmenu', onContextMenu);

  teardownMouseLook = () => {
    window.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('contextmenu', onContextMenu);
  };
}

// --- Three.js Initialization ---
function initThree() {
  try {
    const container = canvasContainer.value;
    if (!container) {
      throw new Error("Canvas container DOM element not found.");
    }
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.sortObjects = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Scene
    scene = new THREE.Scene();

    // 3. Cameras
    camera = new THREE.PerspectiveCamera(62, width / height, 1, OCEAN_MAP_HALF_EXTENT * 4);
    camera.position.set(-18, 24, 82);
    camera.lookAt(SIMULATION_SPAWN.x, SCENE_WATERLINE_Y, SIMULATION_SPAWN.z);

    camera2 = new THREE.PerspectiveCamera(75, width / height, 0.2, OCEAN_MAP_HALF_EXTENT * 4);

    // 4. Lights (Calibrated for high realism)
    ambientLight = new THREE.AmbientLight(0xdbeafe, 0.55);
    scene.add(ambientLight);

    mainLight = new THREE.DirectionalLight(0xfffaed, 1.55);
    mainLight.position.set(100, 300, -200);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 1000;
    
    const d = 160;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;
    scene.add(mainLight);

    // 5. Sky & Sun
    sky = new Sky();
    sky.scale.setScalar(100000);
    scene.add(sky);

    sun = new THREE.Vector3();
    applyEnvironmentPreset('sunset');

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(sky).texture;
    pmremGenerator.dispose();

    const gltfLoader = new GLTFLoader();

    // 6. Ocean (Three.js Water2)
    loadOceanSimulation(null, { renderer })
      .then((oceanApi) => {
        ocean = oceanApi;
        scene.add(ocean.root);
        applyEnvironmentPreset(environmentPreset);
        onWaterParamChange();
        if (sun) ocean.setSunDirection(sun);
        console.info('[HelmQuest] Ocean water ready');
      })
      .catch((err) => {
        console.error('Ocean load error:', err);
        const fallback = new THREE.Mesh(
          new THREE.PlaneGeometry(OCEAN_MAP_HALF_EXTENT * 2, OCEAN_MAP_HALF_EXTENT * 2),
          new THREE.MeshStandardMaterial({ color: 0x032430, roughness: 0.15, metalness: 0.05 })
        );
        fallback.rotation.x = -Math.PI / 2;
        fallback.receiveShadow = true;
        scene.add(fallback);
      });

    // 7. Orbit Controls
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.set(SIMULATION_SPAWN.x, SCENE_WATERLINE_Y, SIMULATION_SPAWN.z);
    orbitControls.maxPolarAngle = Math.PI * 0.485;
    orbitControls.minDistance = 16.0;
    orbitControls.maxDistance = OCEAN_MAP_HALF_EXTENT * 0.92;
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.update();

    // 8. Archipelago from public/assets/tropical_island.glb (terrain only, no sky LOD)
    archipelagoLoadPromise = loadArchipelago(gltfLoader)
      .then((archipelago) => {
        islandGroup = archipelago;
        islandGroup.visible = true;
        scene.add(islandGroup);
        const spawn = updateSimulationSpawn(islandGroup);
        console.info(
          '[HelmQuest] Archipelago ready:',
          archipelago.children.length,
          'islands — spawn',
          spawn.x.toFixed(0),
          spawn.z.toFixed(0)
        );
        if (activeScreen.value === 'simulation') syncWorldForSimulation();
        else if (boatObject) restoreBoatSimPose();
        return archipelago;
      })
      .catch((err) => {
        console.error('Archipelago load error:', err);
        throw err;
      });

    // 9. Spawn boat: show procedural hull immediately, swap in OBJ when ready
    const attachBoat = (model, modelPath = BOAT_MODEL_FILE) => {
      if (boatObject?.parent) scene.remove(boatObject);
      boatObject = model;
      finalizeSpawnedBoat(modelPath);
    };

    const spawnProceduralTrawler = () => {
      attachBoat(createCommercialFishingTrawler(), null);
    };

    spawnProceduralTrawler();

    if (BOAT_MODEL_FILE) {
      loadBoatModel(BOAT_MODEL_FILE)
        .then((model) => {
          attachBoat(model, BOAT_MODEL_FILE);
        })
        .catch((err) => {
          console.error(`Boat model failed (${BOAT_MODEL_FILE}):`, err);
        });
    }

    setupMouseLook();
  } catch (e) {
    fatalError.value = `${e.message}\n${e.stack || ""}`;
    console.error("Initialization error caught:", e);
  }
}

// --- Animation Loop ---
function animate() {
  try {
    animationFrameId = requestAnimationFrame(animate);
    const delta = 1 / 60;
    const menuBackdrop = isMenuBackdropScreen();

    if (menuBackdrop) {
      updateLandingCinematic(delta);
      if (ocean) ocean.update(delta);
      renderer.render(scene, camera);
      return;
    }

    // Update simulation
    updateBoatPhysics();
    
    // Update camera focal positions
    updateCameras();

    if (ocean) ocean.update(delta);

    if (activeCamera.value === 'orbit') {
      orbitControls.update();
      renderer.render(scene, camera);
    } else if (activeCamera.value === 'chase') {
      renderer.render(scene, camera);
    } else {
      renderer.render(scene, camera2);
    }
  } catch (e) {
    fatalError.value = `Animation frame crashed:\n${e.message}\n${e.stack || ""}`;
    console.error("Frame render crashed:", e);
    cancelAnimationFrame(animationFrameId);
  }
}

// Window resizing
function onWindowResize() {
  if (!renderer || !camera || !camera2) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  camera2.aspect = w / h;
  camera2.updateProjectionMatrix();

  renderer.setSize(w, h);
  updateCompassStripViewportWidth();
}

// Global Exception Handlers
window.addEventListener("error", (e) => {
  fatalError.value = `Runtime Error: ${e.message}\nLine ${e.lineno}:${e.colno} in ${e.filename}\nStack: ${e.error?.stack || ''}`;
});

window.addEventListener("unhandledrejection", (e) => {
  fatalError.value = `Unhandled Rejection: ${e.reason}`;
});

// --- Lifecycle Hooks ---
watch(activeScreen, (screen) => {
  if (isMenuBackdropScreen(screen)) {
    applyEnvironmentPreset('sunset');
    landingCinematicTime = 0;
    landingBoatPoseActive = false;
    if (camera) {
      camera.fov = LANDING_CAMERA_FOV;
      camera.updateProjectionMatrix();
    }
    document.body.style.cursor = 'auto';
  } else {
    if (camera) {
      camera.fov = DEFAULT_CAMERA_FOV;
      camera.updateProjectionMatrix();
    }
    if (screen === 'simulation') {
      syncWorldForSimulation();
      document.body.style.cursor = 'none';
    } else {
      applyEnvironmentPreset('day');
      landingBoatPoseActive = false;
      if (islandGroup) islandGroup.visible = true;
      document.body.style.cursor = 'auto';
    }
  }

  if (screen === 'simulation') {
    requestAnimationFrame(() => updateCompassStripViewportWidth());
  }
});

watch(graphicsQuality, (newQuality) => {
  if (!renderer) return;
  switch (newQuality) {
    case 'low':
      renderer.setPixelRatio(1);
      break;
    case 'medium':
      renderer.setPixelRatio(window.devicePixelRatio > 1 ? 1.5 : 1);
      break;
    case 'high':
      renderer.setPixelRatio(window.devicePixelRatio);
      break;
    case 'ultra':
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      break;
  }
});

watch(waterQuality, (newQuality) => {
  if (!ocean) return;
  switch (newQuality) {
    case 'low':
      ocean.setOpacityScale(0.88);
      break;
    case 'medium':
      ocean.setOpacityScale(1);
      break;
    case 'high':
      ocean.setOpacityScale(1.05);
      break;
  }
});

watch(shadowQuality, (newQuality) => {
  if (!renderer) return;
  switch (newQuality) {
    case 'off':
      renderer.shadowMap.enabled = false;
      break;
    case 'low':
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      break;
    case 'medium':
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      break;
    case 'high':
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      break;
  }
});

watch(uiScale, (newScale) => {
  document.documentElement.style.fontSize = `${parseFloat(newScale) * 16}px`;
});

watch(showFPS, (newShow) => {
  const fpsElement = document.getElementById('fps-counter');
  if (newShow && !fpsElement) {
    const fpsDiv = document.createElement('div');
    fpsDiv.id = 'fps-counter';
    fpsDiv.style.cssText = 'position:fixed;top:10px;left:10px;background:transparent;color:#fff;padding:8px 12px;border-radius:4px;font-family:monospace;z-index:10000;text-shadow:1px 1px 2px rgba(0,0,0,0.8);';
    document.body.appendChild(fpsDiv);
  } else if (!newShow && fpsElement) {
    fpsElement.remove();
  }
});

onMounted(() => {
  initThree();
  setupInputs();
  animate();
  clockIntervalId = window.setInterval(() => {
    nowTick.value = Date.now();
  }, 1000);

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onLandingKeyDown);
  requestAnimationFrame(() => updateCompassStripViewportWidth());
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  if (clockIntervalId) window.clearInterval(clockIntervalId);
  cancelExitHold();
  if (islandWarningTimerId) {
    window.clearTimeout(islandWarningTimerId);
    islandWarningTimerId = null;
  }
  islandCollisionWarning.value = false;
  disposeMouseLook();
  window.removeEventListener('keydown', onLandingKeyDown);
  window.removeEventListener('resize', onWindowResize);
  ocean?.dispose?.();
  if (renderer) {
    renderer.dispose();
  }
});
</script>

<style scoped>
.simulation-container {
  position: relative;
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  color: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: #020617;
}

.simulation-container:fullscreen {
  width: 100%;
  height: 100%;
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: block;
}

.scene-overlay {
  position: absolute;
  inset: 0;
  z-index: 85000;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.scene-overlay.game-landing {
  padding: 0;
}

.glass-card {
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(14px);
}

.cinematic-loading {
  position: absolute;
  inset: 0;
  z-index: 92000;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 8px;
  background: rgba(2, 6, 23, 0.88);
}

.cinematic-loading h2 {
  margin: 0;
  color: #e2e8f0;
  font-family: 'Outfit', sans-serif;
  letter-spacing: 0.8px;
}

.cinematic-loading p {
  margin: 0;
  color: #93c5fd;
  font-size: 0.85rem;
}

.cinematic-glow {
  width: 200px;
  height: 4px;
  margin: 0 auto 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #38bdf8, transparent);
  animation: cinematicPulse 1.25s infinite linear;
}

@keyframes cinematicPulse {
  0% { transform: translateX(-35px); opacity: 0.5; }
  50% { transform: translateX(35px); opacity: 1; }
  100% { transform: translateX(-35px); opacity: 0.5; }
}

.auth-overlay,
.dashboard-overlay,
.missions-overlay {
  background: radial-gradient(circle at 20% 20%, rgba(30, 58, 138, 0.30), rgba(2, 6, 23, 0.85));
}

/* —— Game landing (minimal title screen) —— */
.game-landing {
  padding: 0;
  overflow: hidden;
  background: transparent;
}

.game-landing-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(36, 18, 52, 0.5) 0%,
    rgba(20, 16, 40, 0.22) 42%,
    rgba(8, 14, 32, 0.08) 62%,
    rgba(6, 10, 24, 0.2) 100%
  );
  pointer-events: none;
  animation: sunsetOverlayShift 14s ease-in-out infinite alternate;
}

.game-landing-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 55% 45% at 50% 42%, rgba(8, 6, 20, 0.45) 0%, transparent 70%),
    linear-gradient(90deg, transparent 42%, rgba(8, 6, 18, 0.18) 72%, rgba(8, 6, 18, 0.35) 100%),
    linear-gradient(0deg, rgba(255, 120, 60, 0.12) 0%, transparent 38%);
  pointer-events: none;
}

@keyframes sunsetOverlayShift {
  0% { opacity: 0.92; }
  100% { opacity: 1; }
}

.game-landing-center {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(20px, 4vh, 36px);
  width: 100%;
  height: 100%;
  padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
  box-sizing: border-box;
  text-align: center;
  animation: landingFadeIn 0.7s ease-out;
}

.game-landing-splash {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 42%;
  transform: translate(-50%, -50%);
  width: min(920px, 92vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: clamp(10px, 2vh, 18px);
  animation: landingFadeIn 0.7s ease-out;
  pointer-events: none;
}

.press-any-key {
  position: absolute;
  left: 50%;
  bottom: max(40px, calc(env(safe-area-inset-bottom) + 28px));
  transform: translateX(-50%);
  z-index: 3;
  margin: 0;
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(0.9rem, 2.2vw, 1.05rem);
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 235, 210, 0.88);
  text-shadow: 0 0 18px rgba(255, 150, 80, 0.55), 0 2px 12px rgba(0, 0, 0, 0.85);
  animation: pressKeyPulse 2.2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pressKeyPulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

.main-menu-screen .main-menu-center {
  gap: clamp(16px, 3vh, 28px);
}

.main-menu-label {
  margin: 0 0 4px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.9);
}

@keyframes landingFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.game-title {
  margin: 0;
  font-family: 'Bebas Neue', 'Outfit', sans-serif;
  font-size: clamp(4rem, 12vw, 7.5rem);
  font-weight: 400;
  line-height: 0.92;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow:
    0 4px 24px rgba(0, 0, 0, 0.65),
    0 0 48px rgba(255, 150, 80, 0.25);
  animation: titleFloat 6s ease-in-out infinite alternate;
}

.game-title-helm {
  color: #ffffff;
}

.game-title-quest {
  color: #ffffff;
  text-shadow:
    0 4px 24px rgba(0, 0, 0, 0.65),
    0 0 32px rgba(255, 180, 100, 0.35);
}

.game-hero-tagline {
  margin: 0;
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(0.95rem, 2.8vw, 1.15rem);
  font-weight: 600;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: rgba(255, 248, 240, 0.82);
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.75);
  animation: taglineGlow 4s ease-in-out infinite alternate;
}

@keyframes taglineGlow {
  0% { opacity: 0.65; }
  100% { opacity: 1; }
}

@keyframes titleFloat {
  0% { transform: translateY(0); }
  100% { transform: translateY(-6px); }
}

.game-landing-splash .game-title {
  max-width: 100%;
}

.game-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(280px, 88vw);
}

.game-menu-btn {
  width: 100%;
  padding: 14px 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #f1f5f9;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}

.game-menu-btn:hover {
  background: rgba(30, 41, 59, 0.65);
  border-color: rgba(255, 255, 255, 0.22);
}

.game-menu-btn-primary {
  padding: 16px 20px;
  border: none;
  background: #2563eb;
  font-size: 1.05rem;
  letter-spacing: 0.18em;
}

.game-menu-btn-primary:hover {
  background: #3b82f6;
  transform: translateY(-1px);
}

.game-menu-btn-ghost {
  background: transparent;
  border-color: transparent;
  color: rgba(248, 250, 252, 0.45);
  font-size: 0.9rem;
  letter-spacing: 0.12em;
  padding-top: 8px;
}

.game-menu-btn-ghost:hover {
  background: transparent;
  color: rgba(248, 250, 252, 0.75);
  border-color: transparent;
}

@media (max-height: 560px) {
  .game-landing-center {
    gap: 12px;
  }

  .game-title {
    font-size: clamp(2.5rem, 12vw, 4rem);
  }

  .game-menu-btn {
    padding: 10px 16px;
  }

  .game-menu-btn-primary {
    padding: 12px 16px;
  }
}

.landing-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.auth-card {
  width: min(430px, 92vw);
  padding: 22px;
  display: grid;
  gap: 10px;
}

.auth-card h2 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  color: #f8fafc;
}

.auth-input {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
}

.auth-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
  font-size: 0.8rem;
}

.ghost-link {
  background: transparent;
  border: none;
  color: #93c5fd;
  cursor: pointer;
}

.dashboard-shell {
  width: min(1200px, 95vw);
  height: min(730px, 88vh);
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 14px;
}

.left-nav {
  padding: 16px;
  display: grid;
  gap: 10px;
  align-content: start;
}

.left-nav h3 {
  margin: 0 0 8px;
  color: #e2e8f0;
}

.nav-btn {
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.65);
  color: #cbd5e1;
  text-align: left;
  padding: 9px 10px;
  cursor: pointer;
}

.nav-btn.active {
  background: rgba(37, 99, 235, 0.35);
  color: #e2e8f0;
}

.dashboard-main {
  padding: 18px;
  overflow: auto;
}

.dashboard-main h2 {
  margin-top: 0;
  color: #f8fafc;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.kpi-card {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 6px;
}

.kpi-card span { color: #93c5fd; font-size: 0.75rem; }
.kpi-card strong { color: #f8fafc; font-size: 1.05rem; }

.progress-wrap {
  margin: 14px 0;
  height: 10px;
  background: rgba(30, 41, 59, 0.9);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22d3ee, #2563eb);
  border-radius: inherit;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mini-chart {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px;
}

.mini-chart h4 {
  margin: 0 0 10px;
  color: #cbd5e1;
}

.bars {
  height: 140px;
  display: flex;
  align-items: end;
  gap: 8px;
}

.bar {
  flex: 1;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, #38bdf8, #1e40af);
}

.bar.alt {
  background: linear-gradient(180deg, #22d3ee, #0891b2);
}

.radar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.radar-list li {
  display: flex;
  justify-content: space-between;
  color: #cbd5e1;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.heatmap-grid span {
  aspect-ratio: 1;
  border-radius: 6px;
  background: #0ea5e9;
}

.missions-shell {
  width: min(1080px, 95vw);
  padding: 20px;
}

.missions-shell h2 {
  margin-top: 0;
  color: #f8fafc;
}

.mission-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0 18px;
}

.mission-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
}

.mission-card h3 { margin: 0; color: #f8fafc; }
.mission-card p { margin: 0; color: #cbd5e1; font-size: 0.84rem; min-height: 42px; }

.mission-meta {
  display: flex;
  justify-content: space-between;
  color: #93c5fd;
  font-size: 0.74rem;
}

.compass-hud-top {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 90500;
  width: min(560px, 52vw);
  pointer-events: none;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.55));
}

.compass-strip-viewport {
  position: relative;
  height: 44px;
  overflow: hidden;
  border-radius: 10px;
  background: rgba(8, 16, 32, 0.92);
  border: 1px solid rgba(250, 204, 21, 0.42);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06) inset,
    0 4px 18px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
}

.compass-strip-center-tick {
  position: absolute;
  left: 50%;
  top: 4px;
  bottom: 4px;
  width: 2px;
  transform: translateX(-50%);
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(250, 204, 21, 0.15), #facc15 45%, rgba(250, 204, 21, 0.15));
  box-shadow: 0 0 10px rgba(250, 204, 21, 0.65);
  z-index: 2;
  pointer-events: none;
}

.compass-strip-center-tick::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -2px;
  width: 8px;
  height: 8px;
  transform: translateX(-50%);
  border-radius: 2px;
  background: #facc15;
  box-shadow: 0 0 8px rgba(250, 204, 21, 0.9);
}

.compass-strip-track {
  position: relative;
  height: 100%;
  min-width: 100%;
  padding-top: 4px;
  transition: transform 0.12s linear;
  will-change: transform;
}

.strip-mark {
  position: absolute;
  bottom: 3px;
  width: 52px;
  margin-left: -26px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
  line-height: 1.1;
}

.strip-mark.major {
  color: #fde047;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
}

.strip-mark i {
  display: block;
  font-style: normal;
  font-size: 0.62rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-top: 2px;
}

.compass-strip-heading {
  margin-top: 6px;
  text-align: center;
  font-size: 0.88rem;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

.achievement-popup {
  position: absolute;
  right: 12px;
  top: 180px;
  z-index: 91000;
  width: min(200px, 40vw);
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
}

.achievement-popup h4 {
  margin: 0;
  color: #38bdf8;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.achievement-popup p {
  margin: 6px 0 0;
  color: #e2e8f0;
}

.anchor-warning {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 91001;
  background: rgba(220, 38, 38, 0.95);
  border: 3px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 20px 40px;
  box-shadow: 0 12px 40px rgba(220, 38, 38, 0.6);
  animation: pulse-warning 0.5s ease-in-out infinite alternate;
}

@keyframes pulse-warning {
  from {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 12px 40px rgba(220, 38, 38, 0.6);
  }
  to {
    transform: translateX(-50%) scale(1.05);
    box-shadow: 0 16px 50px rgba(220, 38, 38, 0.8);
  }
}

.anchor-warning p {
  margin: 0;
  color: #fff;
  font-size: 1.4rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.island-collision-warning {
  bottom: 190px;
  background: rgba(234, 88, 12, 0.95);
  border-color: rgba(255, 237, 213, 0.75);
  box-shadow: 0 12px 40px rgba(234, 88, 12, 0.55);
}

.island-collision-warning p {
  text-transform: none;
  font-size: 1.15rem;
  letter-spacing: 0.02em;
}

.mission-objective-box {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 90500;
  width: min(220px, 22vw);
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(250, 204, 21, 0.28);
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
}

.objective-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.objective-label {
  margin: 0;
  color: #facc15;
  font-size: 0.55rem;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.objective-arrow {
  color: #93c5fd;
  font-size: 0.95rem;
  transition: transform 0.2s ease;
}

.objective-arrow.collapsed {
  transform: rotate(-90deg);
}

.mission-objective-box h4 {
  margin: 2px 0 4px;
  color: #f8fafc;
  font-size: 0.78rem;
}

.objective-text {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.66rem;
  line-height: 1.3;
}

.nav-hud-right {
  position: absolute;
  right: 10px;
  bottom: 10px;
  top: auto;
  z-index: 90500;
  width: clamp(128px, 16vw, 168px);
  display: grid;
  gap: 5px;
  pointer-events: auto;
}

.top-gauges {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.mini-gauge {
  position: relative;
  width: 100%;
  max-width: 72px;
  justify-self: center;
  aspect-ratio: 1;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.mini-gauge svg {
  width: 100%;
  height: 100%;
}

.g-bg {
  fill: none;
  stroke: rgba(148, 163, 184, 0.25);
  stroke-width: 6;
}

.g-ring {
  fill: none;
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 220;
  stroke-dashoffset: 35;
}

.g-ring.roll { stroke: #22d3ee; }
.g-ring.pitch { stroke: #f43f5e; }

.mini-gauge-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
}

.mini-gauge-center span {
  color: #94a3b8;
  font-size: 0.48rem;
  text-transform: uppercase;
}

.mini-gauge-center strong {
  color: #f8fafc;
  font-size: 0.62rem;
}

.speed-pill {
  justify-self: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255,255,255,0.12);
  color: #f8fafc;
  font-size: 0.62rem;
}

.compass-card {
  position: relative;
  width: clamp(76px, 10vmin, 96px);
  aspect-ratio: 1;
  justify-self: center;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.68);
  border: 1px solid rgba(56, 189, 248, 0.28);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.compass-face {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 78%;
  height: 78%;
  box-sizing: border-box;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  transform-origin: center center;
  transition: transform 0.12s linear;
}

.compass-face span {
  position: absolute;
  color: #94a3b8;
  font-size: 0.52rem;
  font-weight: 700;
  line-height: 1;
}

.compass-face .north {
  top: 6%;
  left: 50%;
  transform: translate(-50%, 0);
  color: #facc15 !important;
}

.compass-face .east {
  right: 6%;
  top: 50%;
  transform: translate(0, -50%);
}

.compass-face .south {
  bottom: 6%;
  left: 50%;
  transform: translate(-50%, 0);
}

.compass-face .west {
  left: 6%;
  top: 50%;
  transform: translate(0, -50%);
}

.compass-needle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 34%;
  background: linear-gradient(180deg, #facc15 0%, #facc15 45%, #e2e8f0 100%);
  border-radius: 2px;
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 2;
}

.compass-heading-readout {
  position: absolute;
  left: 50%;
  bottom: 8%;
  transform: translateX(-50%);
  z-index: 3;
  font-size: 0.58rem;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.4px;
  pointer-events: none;
}

.waypoint-dot {
  position: absolute;
  left: 50%;
  top: 22%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #facc15;
  box-shadow: 0 0 6px rgba(250, 204, 21, 0.7);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.data-pills {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.data-pill {
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255,255,255,0.1);
  color: #e2e8f0;
  font-size: 0.58rem;
}

.icon-actions {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}

.icon-btn {
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  font-size: 0.68rem;
  padding: 4px 0;
  cursor: pointer;
  line-height: 1;
}

.exit-hold-btn {
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 6px;
  background: rgba(127, 29, 29, 0.26);
  color: #fee2e2;
  font-weight: 700;
  letter-spacing: 0.3px;
  font-size: 0.58rem;
  padding: 6px 8px;
  cursor: pointer;
}

.main-menu-overlay {
  position: absolute;
  inset: 0;
  z-index: 90000;
  background: radial-gradient(circle at 20% 20%, rgba(30, 64, 175, 0.35), rgba(2, 6, 23, 0.92));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.main-menu-card {
  width: min(520px, 92vw);
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 28px 24px;
  text-align: center;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.main-menu-card h1 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  letter-spacing: 1px;
  color: #f8fafc;
}

.menu-subtitle {
  margin: 8px 0 18px;
  color: #93c5fd;
  font-size: 0.92rem;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

.menu-actions {
  display: grid;
  gap: 10px;
}

.menu-btn {
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
}

.menu-btn-play {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
}

.menu-btn-settings {
  background: rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.menu-btn-ghost {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.menu-hint {
  margin-top: 14px;
  color: #94a3b8;
  font-size: 0.75rem;
}

.menu-settings-modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.85);
  padding: 18px;
  z-index: 1000;
}

.menu-settings-card {
  width: min(440px, 90vw);
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 18px;
  display: grid;
  gap: 14px;
}

.menu-settings-card h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #e2e8f0;
}

.menu-setting-row {
  display: grid;
  gap: 6px;
}

.menu-setting-row label {
  font-size: 0.78rem;
  color: #cbd5e1;
}

.menu-setting-row select {
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
}

.menu-settings-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.menu-settings-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.85rem;
  color: #e2e8f0;
}

.setting-row input[type="range"] {
  width: 120px;
  cursor: pointer;
}

.setting-row select {
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 0.85rem;
  cursor: pointer;
}

/* Fatal Error Hud Overlay */
.fatal-error-hud {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 680px;
  background: rgba(127, 29, 29, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid #ef4444;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  z-index: 100000;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.fatal-error-hud h2 {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  color: #fca5a5;
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  letter-spacing: 0.5px;
}

.fatal-error-hud p {
  font-size: 0.8rem;
  color: #fecaca;
  margin: 0 0 16px 0;
}

.fatal-error-hud pre {
  font-family: monospace;
  font-size: 0.72rem;
  background: rgba(0, 0, 0, 0.45);
  padding: 12px;
  border-radius: 8px;
  overflow: auto;
  max-height: 250px;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Glassmorphism Styles Core */
.hud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let clicks pass through canvas except on HUD items */
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 320px 1fr;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
  padding: 16px;
  box-sizing: border-box;
}

.hud-overlay > * {
  pointer-events: auto; /* Re-enable pointer events on interactive UI cards */
}

.ui-priority-badge {
  background: rgba(14, 116, 144, 0.26);
  border-color: rgba(56, 189, 248, 0.45);
}

.ui-preview-note {
  margin-top: -8px;
  margin-bottom: 14px;
  font-size: 0.66rem;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.25);
  padding: 6px 8px;
  border-radius: 8px;
}

.ui-preview-panel input,
.ui-preview-panel .compass-slider {
  pointer-events: none;
  opacity: 0.55;
}

/* Dashboard Header */
.hud-header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  margin-bottom: 12px;
}

.title-section h1 {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.4rem;
  letter-spacing: 2px;
  margin: 0;
  background: linear-gradient(135deg, #38bdf8, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-section .subtitle {
  font-size: 0.72rem;
  letter-spacing: 1px;
  color: #94a3b8;
  text-transform: uppercase;
}

.quick-stats {
  display: flex;
  gap: 12px;
}

.stat-badge {
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 14px;
  border-radius: 10px;
  min-width: 80px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-badge.alert {
  background: rgba(220, 38, 38, 0.25);
  border-color: rgba(220, 38, 38, 0.6);
  color: #f87171;
  animation: pulse-alarm 1.5s infinite;
}

.audio-badge {
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  justify-content: center;
  user-select: none;
}

.audio-badge.active {
  background: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.6);
}

.audio-badge:hover {
  background: rgba(255, 255, 255, 0.08);
}

.icon-music-playing, .icon-music-muted {
  width: 14px;
  height: 14px;
}

.stat-label {
  font-size: 0.6rem;
  color: #64748b;
  letter-spacing: 0.5px;
}

.stat-value {
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

/* Glassmorphic Sidebar Panel */
.hud-sidebar {
  grid-area: sidebar;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 200px);
  overflow-y: auto;
}

.sidebar-tabs {
  display: flex;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-btn.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.tab-panel h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 16px;
  color: #38bdf8;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.description-text {
  margin-top: -12px;
  margin-bottom: 16px;
  color: #94a3b8;
  line-height: 1.4;
}

.control-group {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-group label {
  font-size: 0.72rem;
  color: #cbd5e1;
  display: flex;
  justify-content: space-between;
}

.control-group label .val {
  font-family: monospace;
  font-weight: bold;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  padding: 1px 6px;
  border-radius: 4px;
}

/* Custom CSS Range Inputs */
input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  background: rgba(30, 41, 59, 0.8);
  height: 6px;
  border-radius: 3px;
  outline: none;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  transition: transform 0.1s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.input-warning {
  font-size: 0.65rem;
  color: #fb7185;
  background: rgba(244, 63, 94, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  margin-top: 4px;
  border: 1px solid rgba(244, 63, 94, 0.2);
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 16px 0;
}

/* Compass Widget styles */
.compass-label-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compass-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.compass-dial {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(30, 41, 59, 0.7);
  border: 2px dashed rgba(56, 189, 248, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.5s cubic-bezier(0.1, 0.8, 0.3, 1);
}

.compass-arrow {
  font-size: 2.2rem;
  font-weight: bold;
  color: #3b82f6;
  transform: translateY(-4px);
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.compass-points {
  position: absolute;
  width: 100%;
  height: 100%;
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
  pointer-events: none;
}

.compass-points span {
  position: absolute;
}

.compass-points .n { top: 6px; left: 50%; transform: translateX(-50%); color: #ef4444; }
.compass-points .e { right: 8px; top: 50%; transform: translateY(-50%); }
.compass-points .s { bottom: 6px; left: 50%; transform: translateX(-50%); }
.compass-points .w { left: 8px; top: 50%; transform: translateY(-50%); }

.compass-slider {
  margin-top: 4px;
}

/* Tab View Buttons */
.view-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  border: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  width: 100%;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-secondary {
  background: rgba(30, 41, 59, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}

.btn-danger {
  background: #dc2626;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
}

.btn-danger:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.audio-controls {
  margin-top: 14px;
}

.sound-track-info {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 10px;
  border-radius: 8px;
}

.small {
  font-size: 0.62rem;
  color: #94a3b8;
  line-height: 1.35;
  margin: 0;
}

/* Bottom HUD elements */
.hud-footer {
  grid-area: footer;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  margin-top: 12px;
  align-items: end;
}

/* Speedometer Gauge Panel */
.gauge-card {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.gauge-radial {
  position: relative;
  width: 90px;
  height: 90px;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.gauge-track {
  fill: none;
  stroke: rgba(30, 41, 59, 0.8);
  stroke-width: 8px;
}

.gauge-fill {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 8px;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.15s linear;
}

.gauge-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-value .num {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  color: #ffffff;
  line-height: 1;
}

.gauge-value .unit {
  font-size: 0.52rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 1px;
}

.gauge-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  padding-bottom: 4px;
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-row .label {
  font-size: 0.65rem;
  color: #94a3b8;
}

.detail-row .val {
  font-family: monospace;
  font-weight: bold;
  font-size: 0.78rem;
  color: #38bdf8;
}

/* Keyboard Guide Card */
.guide-card {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  padding: 14px 20px;
}

.guide-card h4 {
  font-family: 'Outfit', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  color: #38bdf8;
  margin-top: 0;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.keys-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.key-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.68rem;
  color: #cbd5e1;
}

kbd {
  display: inline-block;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
  font-size: 0.72rem;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.5);
  min-width: 12px;
  text-align: center;
  transition: all 0.15s ease;
}

kbd.active {
  background: #3b82f6;
  border-color: #60a5fa;
  transform: translateY(2px);
  box-shadow: 0 0px 0 rgba(0, 0, 0, 0);
}

/* Sinking Alarm Overlay screen */
.sinking-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(12, 10, 9, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.alarm-box {
  background: rgba(28, 25, 23, 0.95);
  border: 2px solid #dc2626;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 440px;
  box-shadow: 0 0 40px rgba(220, 38, 38, 0.35);
  animation: shake 0.5s ease-in-out;
}

.siren-light {
  width: 45px;
  height: 45px;
  background: #dc2626;
  border-radius: 50%;
  margin: 0 auto 20px;
  box-shadow: 0 0 25px #dc2626;
  animation: flash-red 0.6s infinite alternate;
}

.alarm-box h2 {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  color: #ef4444;
  margin-top: 0;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.alarm-box p {
  font-size: 0.85rem;
  color: #d6d3d1;
  line-height: 1.5;
  margin-bottom: 24px;
}

/* Animations */
@keyframes pulse-alarm {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.97); }
}

@keyframes flash-red {
  from { opacity: 0.3; box-shadow: 0 0 5px #dc2626; }
  to { opacity: 1; box-shadow: 0 0 30px #dc2626; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Scrollbars */
.hud-sidebar::-webkit-scrollbar {
  width: 4px;
}
.hud-sidebar::-webkit-scrollbar-track {
  background: transparent;
}
.hud-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}
.hud-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

@media(max-height: 700px) {
  .hud-sidebar {
    height: calc(100vh - 170px);
  }
}
</style>
