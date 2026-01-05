import { settingsManager } from '../settings_manager.js';
import { showModal, closeModal } from '../modal.js';

export class SettingsUI {
    constructor() {
        this.renderModal();
        this.setupListeners();
    }

    renderModal() {
        // Create modal if it doesn't exist
        if (!document.getElementById('modal-settings')) {
            const modal = document.createElement('div');
            modal.id = 'modal-settings';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <div class="flex justify-between items-center mb-4" style="border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
                        <h3 style="color: var(--primary);">⚙️ Platform Settings</h3>
                        <button class="btn-icon" id="close-settings-btn">×</button>
                    </div>
                    
                    <div class="tabs" style="margin-bottom: 1rem;">
                        <button class="tab-btn active" data-target="set-general">General & UI</button>
                        <button class="tab-btn" data-target="set-subjects">Subjects & Data</button>
                        <button class="tab-btn" data-target="set-advanced">Advanced</button>
                    </div>

                    <div id="set-general" class="settings-tab-content">
                        <div class="input-group">
                            <label>Platform Name</label>
                            <input type="text" id="set-platform-name" class="form-control">
                        </div>
                         <div class="input-group">
                            <label>Logo URL</label>
                            <input type="text" id="set-logo-url" class="form-control">
                        </div>
                        <div class="input-group">
                            <label>Default Theme</label>
                            <select id="set-theme" class="form-control">
                                <option value="system">System Default</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                         <div class="input-group">
                            <label>UI Style</label>
                            <select id="set-ui-style" class="form-control">
                                <option value="modern">Modern (Default)</option>
                                <option value="glass">Glassmorphism</option>
                                <option value="minimal">Minimalist</option>
                            </select>
                        </div>
                    </div>

                    <div id="set-subjects" class="settings-tab-content hidden">
                        <div class="alert alert-info" style="font-size: 0.85rem; margin-bottom: 1rem;">
                            Edit the JSON configuration for subjects below. Be careful with syntax!
                        </div>
                        <textarea id="set-subjects-json" class="textarea-control" rows="15" style="font-family: monospace; font-size: 0.85rem;"></textarea>
                    </div>

                    <div id="set-advanced" class="settings-tab-content hidden">
                        <div class="input-group">
                            <label>API Endpoint (Data)</label>
                            <input type="text" id="set-api-data" class="form-control">
                        </div>
                        <div class="input-group">
                            <label>API Endpoint (GenAI)</label>
                            <input type="text" id="set-api-genai" class="form-control">
                        </div>
                         <div class="alert alert-warning" style="font-size: 0.85rem; margin-top: 1rem;">
                            Warning: Resetting will clear all local configuration changes.
                        </div>
                        <button class="btn btn-secondary" id="btn-reset-config" style="color: var(--error); border-color: var(--error);">Reset to Defaults</button>
                    </div>

                    <div class="flex justify-end gap-2 mt-4 pt-4" style="border-top: 1px solid var(--border);">
                        <button class="btn btn-secondary" id="btn-cancel-settings">Cancel</button>
                        <button class="btn btn-primary" id="btn-save-settings">Save Changes</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    setupListeners() {
        document.getElementById('close-settings-btn').onclick = () => closeModal('modal-settings');
        document.getElementById('btn-cancel-settings').onclick = () => closeModal('modal-settings');
        
        // Tab switching
        document.querySelectorAll('#modal-settings .tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('#modal-settings .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.add('hidden'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.target).classList.remove('hidden');
            };
        });

        document.getElementById('btn-save-settings').onclick = () => this.save();
        document.getElementById('btn-reset-config').onclick = () => {
            if(confirm("Are you sure? This will revert all customizations.")) settingsManager.reset();
        };
    }

    open() {
        const config = settingsManager.get();
        
        // Populate Fields
        document.getElementById('set-platform-name').value = config.platform.name || '';
        document.getElementById('set-logo-url').value = config.platform.logoUrl || '';
        document.getElementById('set-theme').value = config.platform.theme || 'system';
        document.getElementById('set-ui-style').value = config.platform.uiStyle || 'modern';
        
        // JSON Fields
        document.getElementById('set-subjects-json').value = JSON.stringify(config.subjects, null, 2);
        
        // Advanced
        document.getElementById('set-api-data').value = config.endpoints.data || '';
        document.getElementById('set-api-genai').value = config.endpoints.genai || '';

        showModal('modal-settings');
    }

    save() {
        const current = settingsManager.get();
        
        // Update simple fields
        current.platform.name = document.getElementById('set-platform-name').value;
        current.platform.logoUrl = document.getElementById('set-logo-url').value;
        current.platform.theme = document.getElementById('set-theme').value;
        current.platform.uiStyle = document.getElementById('set-ui-style').value;
        
        current.endpoints.data = document.getElementById('set-api-data').value;
        current.endpoints.genai = document.getElementById('set-api-genai').value;

        // Parse JSON
        try {
            const subjects = JSON.parse(document.getElementById('set-subjects-json').value);
            current.subjects = subjects;
        } catch (e) {
            alert("Invalid JSON in Subjects tab: " + e.message);
            return;
        }

        settingsManager.saveConfig(current);
        closeModal('modal-settings');
        window.location.reload(); // Reload to apply deep changes safely
    }
}
