/**
 * PF2E Vision Configuration Module
 * Adds configurable vision options for tokens including daylight vision distance
 */

class PF2EVisionConfig {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Hook into token configuration
        Hooks.on('renderTokenConfig', this.onRenderTokenConfig.bind(this));
        
        // Hook into token updates
        Hooks.on('preUpdateToken', this.onPreUpdateToken.bind(this));
        
        // Hook into scene updates for vision calculations
        Hooks.on('updateScene', this.onUpdateScene.bind(this));
        
        // Hook into token creation to set defaults
        Hooks.on('preCreateToken', this.onPreCreateToken.bind(this));
        
        // Register module settings
        this.registerSettings();
        
        console.log('PF2E Vision Configuration module initialized');
    }

    /**
     * Register module settings
     */
    registerSettings() {
        game.settings.register('pf2e-vision-config', 'defaultDaylightFeet', {
            name: game.i18n.localize('PF2E_VISION_CONFIG.SETTINGS.DEFAULT_DAYLIGHT_FEET'),
            hint: game.i18n.localize('PF2E_VISION_CONFIG.SETTINGS.DEFAULT_DAYLIGHT_FEET_HINT'),
            scope: 'world',
            config: true,
            type: Number,
            default: 0,
            range: {
                min: 0,
                max: 10000,
                step: 10
            }
        });

        game.settings.register('pf2e-vision-config', 'defaultDaylightMiles', {
            name: game.i18n.localize('PF2E_VISION_CONFIG.SETTINGS.DEFAULT_DAYLIGHT_MILES'),
            hint: game.i18n.localize('PF2E_VISION_CONFIG.SETTINGS.DEFAULT_DAYLIGHT_MILES_HINT'),
            scope: 'world',
            config: true,
            type: Number,
            default: 0,
            range: {
                min: 0,
                max: 100,
                step: 0.1
            }
        });

        game.settings.register('pf2e-vision-config', 'defaultVisionType', {
            name: game.i18n.localize('PF2E_VISION_CONFIG.SETTINGS.DEFAULT_VISION_TYPE'),
            hint: game.i18n.localize('PF2E_VISION_CONFIG.SETTINGS.DEFAULT_VISION_TYPE_HINT'),
            scope: 'world',
            config: true,
            type: String,
            default: 'normal',
            choices: {
                'normal': game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.NORMAL'),
                'low-light': game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.LOW_LIGHT'),
                'darkvision': game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.DARKVISION'),
                'blindsight': game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.BLINDSIGHT'),
                'tremorsense': game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.TREMORSENSE')
            }
        });
    }

    /**
     * Set default values for new tokens
     */
    onPreCreateToken(token, data, options, userId) {
        const defaultFeet = game.settings.get('pf2e-vision-config', 'defaultDaylightFeet');
        const defaultMiles = game.settings.get('pf2e-vision-config', 'defaultDaylightMiles');
        const defaultType = game.settings.get('pf2e-vision-config', 'defaultVisionType');

        data.flags = data.flags || {};
        data.flags['pf2e-vision-config'] = {
            daylightVisionFeet: defaultFeet,
            daylightVisionMiles: defaultMiles,
            visionType: defaultType
        };
    }

    /**
     * Add custom vision fields to token configuration
     */
    onRenderTokenConfig(app, html, data) {
        const token = app.object;
        const form = html.find('form');
        
        // Find the vision section - try multiple selectors for compatibility
        let visionSection = form.find('.form-group:contains("Vision")').parent();
        if (visionSection.length === 0) {
            visionSection = form.find('.form-group:contains("vision")').parent();
        }
        if (visionSection.length === 0) {
            visionSection = form.find('.form-group').last().parent();
        }
        
        if (visionSection.length === 0) {
            console.warn('Vision section not found in token config');
            return;
        }

        // Get current values
        const currentFeet = token.getFlag('pf2e-vision-config', 'daylightVisionFeet') || 0;
        const currentMiles = token.getFlag('pf2e-vision-config', 'daylightVisionMiles') || 0;
        const currentType = token.getFlag('pf2e-vision-config', 'visionType') || 'normal';

        // Add custom vision fields after the existing vision options
        const customVisionHTML = `
            <div class="form-group pf2e-vision-config-section">
                <h3>PF2E Vision Configuration</h3>
                <div class="form-group">
                    <label>${game.i18n.localize('PF2E_VISION_CONFIG.DAYLIGHT_VISION_FEET')}</label>
                    <input type="number" name="flags.pf2e-vision-config.daylightVisionFeet" 
                           value="${currentFeet}" 
                           min="0" step="1" />
                    <p class="notes">${game.i18n.localize('PF2E_VISION_CONFIG.DAYLIGHT_VISION_FEET_HINT')}</p>
                </div>
                <div class="form-group">
                    <label>${game.i18n.localize('PF2E_VISION_CONFIG.DAYLIGHT_VISION_MILES')}</label>
                    <input type="number" name="flags.pf2e-vision-config.daylightVisionMiles" 
                           value="${currentMiles}" 
                           min="0" step="0.1" />
                    <p class="notes">${game.i18n.localize('PF2E_VISION_CONFIG.DAYLIGHT_VISION_MILES_HINT')}</p>
                </div>
                <div class="form-group">
                    <label>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPE')}</label>
                    <select name="flags.pf2e-vision-config.visionType">
                        <option value="normal" ${currentType === 'normal' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.NORMAL')}</option>
                        <option value="low-light" ${currentType === 'low-light' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.LOW_LIGHT')}</option>
                        <option value="darkvision" ${currentType === 'darkvision' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.DARKVISION')}</option>
                        <option value="blindsight" ${currentType === 'blindsight' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.BLINDSIGHT')}</option>
                        <option value="tremorsense" ${currentType === 'tremorsense' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.TREMORSENSE')}</option>
                    </select>
                    <p class="notes">${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPE_HINT')}</p>
                </div>
                <div class="form-group">
                    <label>Total Vision Range</label>
                    <input type="text" readonly value="${this.calculateTotalVision(currentFeet, currentMiles)} feet" />
                    <p class="notes">Calculated total vision range (feet + miles converted)</p>
                </div>
            </div>
        `;

        visionSection.append(customVisionHTML);

        // Add event listeners for real-time calculation updates
        this.addCalculationListeners(html);
    }

    /**
     * Add event listeners for real-time vision calculation updates
     */
    addCalculationListeners(html) {
        const feetInput = html.find('input[name="flags.pf2e-vision-config.daylightVisionFeet"]');
        const milesInput = html.find('input[name="flags.pf2e-vision-config.daylightVisionMiles"]');
        const totalDisplay = html.find('input[readonly]');

        const updateTotal = () => {
            const feet = parseInt(feetInput.val()) || 0;
            const miles = parseFloat(milesInput.val()) || 0;
            const total = this.calculateTotalVision(feet, miles);
            totalDisplay.val(`${total} feet`);
        };

        feetInput.on('input', updateTotal);
        milesInput.on('input', updateTotal);
    }

    /**
     * Calculate total vision in feet
     */
    calculateTotalVision(feet, miles) {
        return feet + (miles * 5280);
    }

    /**
     * Handle token updates to apply custom vision settings
     */
    onPreUpdateToken(token, changes, options, userId) {
        // Check if vision flags are being updated
        if (changes.flags && changes.flags['pf2e-vision-config']) {
            const visionFlags = changes.flags['pf2e-vision-config'];
            
            // Calculate total daylight vision in feet
            let totalDaylightVision = 0;
            if (visionFlags.daylightVisionFeet !== undefined) {
                totalDaylightVision += parseInt(visionFlags.daylightVisionFeet) || 0;
            }
            if (visionFlags.daylightVisionMiles !== undefined) {
                totalDaylightVision += (parseFloat(visionFlags.daylightVisionMiles) || 0) * 5280;
            }

            // If no specific values provided, get current values
            if (totalDaylightVision === 0) {
                const currentFeet = token.getFlag('pf2e-vision-config', 'daylightVisionFeet') || 0;
                const currentMiles = token.getFlag('pf2e-vision-config', 'daylightVisionMiles') || 0;
                totalDaylightVision = this.calculateTotalVision(currentFeet, currentMiles);
            }

            // Update the token's vision range based on vision type
            if (visionFlags.visionType !== undefined) {
                const visionType = visionFlags.visionType;
                const visionRanges = this.calculateVisionRanges(totalDaylightVision, visionType);
                
                changes.vision = changes.vision || {};
                changes.vision.range = visionRanges.range;
                changes.vision.darkness = changes.vision.darkness || {};
                changes.vision.darkness.range = visionRanges.darknessRange;
            }
        }
    }

    /**
     * Calculate vision ranges based on type and total vision
     */
    calculateVisionRanges(totalVision, visionType) {
        let range = 0;
        let darknessRange = 0;

        switch (visionType) {
            case 'normal':
                range = Math.min(totalVision, 1000);
                darknessRange = 0;
                break;
            case 'low-light':
                range = Math.min(totalVision * 2, 2000);
                darknessRange = 0;
                break;
            case 'darkvision':
                range = 0;
                darknessRange = Math.min(totalVision, 1000);
                break;
            case 'blindsight':
                range = 0;
                darknessRange = Math.min(totalVision, 500);
                break;
            case 'tremorsense':
                range = Math.min(totalVision, 300);
                darknessRange = 0;
                break;
            default:
                range = Math.min(totalVision, 1000);
                darknessRange = 0;
        }

        return { range, darknessRange };
    }

    /**
     * Update scene lighting based on token vision settings
     */
    onUpdateScene(scene, changes, options, userId) {
        // This could be expanded to handle scene-wide lighting changes
        // based on the vision capabilities of tokens in the scene
        if (changes.globalLight !== undefined) {
            this.updateTokenVisionForLighting(scene);
        }
    }

    /**
     * Update token vision based on current scene lighting
     */
    updateTokenVisionForLighting(scene) {
        const tokens = scene.tokens.contents;
        tokens.forEach(token => {
            const visionType = token.getFlag('pf2e-vision-config', 'visionType') || 'normal';
            const daylightVisionFeet = token.getFlag('pf2e-vision-config', 'daylightVisionFeet') || 0;
            const daylightVisionMiles = token.getFlag('pf2e-vision-config', 'daylightVisionMiles') || 0;
            
            let totalVision = this.calculateTotalVision(daylightVisionFeet, daylightVisionMiles);
            const visionRanges = this.calculateVisionRanges(totalVision, visionType);
            
            // Adjust vision based on scene lighting
            if (scene.globalLight) {
                // Bright lighting - use normal vision range
                token.update({
                    'vision.range': visionRanges.range,
                    'vision.darkness.range': 0
                });
            } else {
                // Dim or no lighting - apply vision type modifiers
                if (visionType === 'darkvision' || visionType === 'blindsight') {
                    token.update({
                        'vision.range': 0,
                        'vision.darkness.range': visionRanges.darknessRange
                    });
                } else if (visionType === 'low-light') {
                    token.update({
                        'vision.range': Math.min(totalVision * 0.5, 500),
                        'vision.darkness.range': 0
                    });
                } else {
                    token.update({
                        'vision.range': 0,
                        'vision.darkness.range': 0
                    });
                }
            }
        });
    }
}

// Initialize the module when Foundry is ready
Hooks.once('ready', () => {
    new PF2EVisionConfig();
}); 