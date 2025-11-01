/**
 * PF2E Vision Configuration Module
 * Adds configurable vision options for tokens including daylight vision distance
 * Compatible with Foundry VTT v13
 */

class PF2EVisionConfig {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the module when Foundry is ready
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Hook into token configuration rendering
            Hooks.on('renderTokenConfig', this.onRenderTokenConfig.bind(this));
            
            // Hook into token updates to apply vision settings
            Hooks.on('preUpdateToken', this.onPreUpdateToken.bind(this));
            
            // Hook into token creation to set defaults
            Hooks.on('preCreateToken', this.onPreCreateToken.bind(this));
            
            this.initialized = true;
            console.log('PF2E Vision Configuration module initialized');
        } catch (error) {
            console.error('PF2E Vision Configuration: Error during initialization', error);
            ui.notifications.error('PF2E Vision Configuration module failed to initialize. Check console for details.');
        }
    }

    /**
     * Register module settings
     * Settings must be registered when game object is available
     */
    registerSettings() {
        if (!game) {
            console.warn('PF2E Vision Configuration: game object not available for settings registration');
            return;
        }

        try {
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
        } catch (error) {
            console.error('PF2E Vision Configuration: Error registering settings', error);
        }
    }

    /**
     * Set default values for new tokens
     * @param {foundry.documents.BaseToken} tokenDocument - The token document being created
     * @param {object} data - The data object being created
     * @param {object} options - Additional options
     * @param {string} userId - The user ID creating the token
     */
    onPreCreateToken(tokenDocument, data, options, userId) {
        try {
            const defaultFeet = game.settings.get('pf2e-vision-config', 'defaultDaylightFeet') || 0;
            const defaultMiles = game.settings.get('pf2e-vision-config', 'defaultDaylightMiles') || 0;
            const defaultType = game.settings.get('pf2e-vision-config', 'defaultVisionType') || 'normal';

            // Only set defaults if flags aren't already specified
            if (!data.flags?.['pf2e-vision-config']) {
                data.flags = data.flags || {};
                data.flags['pf2e-vision-config'] = {
                    daylightVisionFeet: defaultFeet,
                    daylightVisionMiles: defaultMiles,
                    visionType: defaultType
                };
            }
        } catch (error) {
            console.error('PF2E Vision Configuration: Error setting default token values', error);
        }
    }

    /**
     * Add custom vision fields to token configuration
     * @param {ApplicationV2|Application} app - The token configuration application
     * @param {jQuery} html - The rendered HTML
     * @param {object} data - The form data
     */
    onRenderTokenConfig(app, html, data) {
        try {
            const tokenDocument = app.object;
            if (!tokenDocument) {
                console.warn('PF2E Vision Configuration: Token document not found');
                return;
            }

            // Find a good place to insert our section - look for vision-related fields
            const form = html.find('form').first();
            if (!form.length) {
                console.warn('PF2E Vision Configuration: Form not found in token config');
                return;
            }

            // Try to find vision-related sections, or insert at end of form
            let insertTarget = null;
            
            // Look for vision-related labels or fields
            const visionLabels = form.find('label:contains("Vision"), label:contains("vision"), label:contains("Sight")');
            if (visionLabels.length > 0) {
                insertTarget = visionLabels.first().closest('.form-group, .form-section').parent();
            }
            
            // If not found, look for token config sections
            if (!insertTarget || insertTarget.length === 0) {
                const sections = form.find('.form-section, .tab.active > .form-group').last();
                insertTarget = sections.length > 0 ? sections : form.find('.form-group').last();
            }
            
            // Fallback to form itself
            if (!insertTarget || insertTarget.length === 0) {
                insertTarget = form;
            }

            // Get current values from token document
            const currentFeet = tokenDocument.getFlag('pf2e-vision-config', 'daylightVisionFeet') ?? 0;
            const currentMiles = tokenDocument.getFlag('pf2e-vision-config', 'daylightVisionMiles') ?? 0;
            const currentType = tokenDocument.getFlag('pf2e-vision-config', 'visionType') ?? 'normal';

            // Escape values for HTML safety
            const safeFeet = this.escapeHtml(String(currentFeet));
            const safeMiles = this.escapeHtml(String(currentMiles));
            const safeType = this.escapeHtml(String(currentType));
            const totalVision = this.calculateTotalVision(currentFeet, currentMiles);

            // Create custom vision section HTML
            const customVisionHTML = $(`
                <div class="form-group pf2e-vision-config-section">
                    <h3 class="form-header">${game.i18n.localize('PF2E_VISION_CONFIG.MODULE_NAME')}</h3>
                    <div class="form-group">
                        <label>${game.i18n.localize('PF2E_VISION_CONFIG.DAYLIGHT_VISION_FEET')}</label>
                        <input type="number" 
                               name="flags.pf2e-vision-config.daylightVisionFeet" 
                               value="${safeFeet}" 
                               min="0" 
                               step="1"
                               data-dtype="Number" />
                        <p class="notes">${game.i18n.localize('PF2E_VISION_CONFIG.DAYLIGHT_VISION_FEET_HINT')}</p>
                    </div>
                    <div class="form-group">
                        <label>${game.i18n.localize('PF2E_VISION_CONFIG.DAYLIGHT_VISION_MILES')}</label>
                        <input type="number" 
                               name="flags.pf2e-vision-config.daylightVisionMiles" 
                               value="${safeMiles}" 
                               min="0" 
                               step="0.1"
                               data-dtype="Number" />
                        <p class="notes">${game.i18n.localize('PF2E_VISION_CONFIG.DAYLIGHT_VISION_MILES_HINT')}</p>
                    </div>
                    <div class="form-group">
                        <label>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPE')}</label>
                        <select name="flags.pf2e-vision-config.visionType" data-dtype="String">
                            <option value="normal" ${currentType === 'normal' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.NORMAL')}</option>
                            <option value="low-light" ${currentType === 'low-light' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.LOW_LIGHT')}</option>
                            <option value="darkvision" ${currentType === 'darkvision' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.DARKVISION')}</option>
                            <option value="blindsight" ${currentType === 'blindsight' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.BLINDSIGHT')}</option>
                            <option value="tremorsense" ${currentType === 'tremorsense' ? 'selected' : ''}>${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPES.TREMORSENSE')}</option>
                        </select>
                        <p class="notes">${game.i18n.localize('PF2E_VISION_CONFIG.VISION_TYPE_HINT')}</p>
                    </div>
                    <div class="form-group">
                        <label>${game.i18n.localize('PF2E_VISION_CONFIG.TOTAL_VISION_RANGE')}</label>
                        <input type="text" 
                               class="pf2e-vision-total-range" 
                               readonly 
                               value="${totalVision} ${game.i18n.localize('PF2E_VISION_CONFIG.UNITS.FEET')}" />
                        <p class="notes">${game.i18n.localize('PF2E_VISION_CONFIG.TOTAL_VISION_RANGE_HINT')}</p>
                    </div>
                </div>
            `);

            // Insert the custom section
            if (insertTarget.length > 0) {
                insertTarget.after(customVisionHTML);
            } else {
                form.append(customVisionHTML);
            }

            // Add event listeners for real-time calculation updates
            this.addCalculationListeners(html);
        } catch (error) {
            console.error('PF2E Vision Configuration: Error rendering token config', error);
        }
    }

    /**
     * Add event listeners for real-time vision calculation updates
     * @param {jQuery} html - The rendered HTML
     */
    addCalculationListeners(html) {
        try {
            const feetInput = html.find('input[name="flags.pf2e-vision-config.daylightVisionFeet"]');
            const milesInput = html.find('input[name="flags.pf2e-vision-config.daylightVisionMiles"]');
            const totalDisplay = html.find('input.pf2e-vision-total-range');

            if (!feetInput.length || !milesInput.length || !totalDisplay.length) {
                return; // Elements not found, skip listener setup
            }

            const updateTotal = () => {
                try {
                    const feet = parseInt(feetInput.val()) || 0;
                    const miles = parseFloat(milesInput.val()) || 0;
                    const total = this.calculateTotalVision(feet, miles);
                    totalDisplay.val(`${total} ${game.i18n.localize('PF2E_VISION_CONFIG.UNITS.FEET')}`);
                } catch (error) {
                    console.error('PF2E Vision Configuration: Error updating total vision', error);
                }
            };

            feetInput.on('input change', updateTotal);
            milesInput.on('input change', updateTotal);
        } catch (error) {
            console.error('PF2E Vision Configuration: Error adding calculation listeners', error);
        }
    }

    /**
     * Calculate total vision in feet
     * @param {number} feet - Vision distance in feet
     * @param {number} miles - Vision distance in miles
     * @returns {number} Total vision in feet
     */
    calculateTotalVision(feet, miles) {
        const feetValue = Number(feet) || 0;
        const milesValue = Number(miles) || 0;
        return Math.round(feetValue + (milesValue * 5280));
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle token updates to apply custom vision settings
     * @param {foundry.documents.BaseToken} tokenDocument - The token document being updated
     * @param {object} changes - The update data
     * @param {object} options - Additional options
     * @param {string} userId - The user ID making the update
     */
    onPreUpdateToken(tokenDocument, changes, options, userId) {
        try {
            // Check if vision flags are being updated
            if (!changes.flags?.['pf2e-vision-config']) {
                return; // No vision config changes
            }

            const visionFlags = changes.flags['pf2e-vision-config'];
            
            // Get current and new values
            const currentFeet = tokenDocument.getFlag('pf2e-vision-config', 'daylightVisionFeet') ?? 0;
            const currentMiles = tokenDocument.getFlag('pf2e-vision-config', 'daylightVisionMiles') ?? 0;
            
            const newFeet = visionFlags.daylightVisionFeet !== undefined 
                ? Number(visionFlags.daylightVisionFeet) || 0 
                : currentFeet;
            const newMiles = visionFlags.daylightVisionMiles !== undefined 
                ? Number(visionFlags.daylightVisionMiles) || 0 
                : currentMiles;
            
            // Calculate total daylight vision in feet
            const totalDaylightVision = this.calculateTotalVision(newFeet, newMiles);

            // Get vision type (new or current)
            const visionType = visionFlags.visionType !== undefined 
                ? visionFlags.visionType 
                : (tokenDocument.getFlag('pf2e-vision-config', 'visionType') ?? 'normal');

            // Calculate vision ranges based on type
            const visionRanges = this.calculateVisionRanges(totalDaylightVision, visionType);
            
            // Update the token's vision range in the changes
            changes.vision = foundry.utils.mergeObject(changes.vision || {}, {
                range: visionRanges.range,
                darkness: foundry.utils.mergeObject(changes.vision?.darkness || {}, {
                    range: visionRanges.darknessRange
                })
            });

            // Optional: Show notification if vision was updated
            if (totalDaylightVision > 0 && (newFeet !== currentFeet || newMiles !== currentMiles)) {
                // Notification will be shown after update completes
            }
        } catch (error) {
            console.error('PF2E Vision Configuration: Error updating token vision', error);
        }
    }

    /**
     * Calculate vision ranges based on type and total vision
     * @param {number} totalVision - Total vision distance in feet
     * @param {string} visionType - Type of vision
     * @returns {object} Object with range and darknessRange properties
     */
    calculateVisionRanges(totalVision, visionType) {
        const totalVisionValue = Number(totalVision) || 0;
        let range = 0;
        let darknessRange = 0;

        switch (visionType) {
            case 'normal':
                // Normal vision works in light, limited range
                range = Math.min(totalVisionValue, 1000);
                darknessRange = 0;
                break;
            case 'low-light':
                // Low-light vision doubles range in dim light
                range = Math.min(totalVisionValue * 2, 2000);
                darknessRange = 0;
                break;
            case 'darkvision':
                // Darkvision works in darkness, limited range
                range = 0;
                darknessRange = Math.min(totalVisionValue, 1000);
                break;
            case 'blindsight':
                // Blindsight has shorter range but works in darkness
                range = 0;
                darknessRange = Math.min(totalVisionValue, 500);
                break;
            case 'tremorsense':
                // Tremorsense has very limited range
                range = Math.min(totalVisionValue, 300);
                darknessRange = 0;
                break;
            default:
                // Default to normal vision
                range = Math.min(totalVisionValue, 1000);
                darknessRange = 0;
        }

        return { 
            range: Math.round(range), 
            darknessRange: Math.round(darknessRange) 
        };
    }

}

// Create module instance
const pf2eVisionConfig = new PF2EVisionConfig();

// Register settings during init hook (when game object becomes available)
Hooks.once('init', () => {
    try {
        pf2eVisionConfig.registerSettings();
    } catch (error) {
        console.error('PF2E Vision Configuration: Error during init', error);
    }
});

// Initialize the module when Foundry is ready
Hooks.once('ready', async () => {
    await pf2eVisionConfig.initialize();
}); 