import { CONFIG as DEFAULT_CONFIG } from './config.js';

const STORAGE_KEY = 'chiaseed_user_config_v1';

export class SettingsManager {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                // Deep merge saved config with defaults to ensure new fields in default are preserved
                return this.deepMerge(structuredClone(DEFAULT_CONFIG), JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load saved config", e);
                return structuredClone(DEFAULT_CONFIG);
            }
        }
        return structuredClone(DEFAULT_CONFIG);
    }

    saveConfig(newConfig) {
        this.config = newConfig;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
        // Dispatch event so UI can react
        window.dispatchEvent(new CustomEvent('config-updated', { detail: this.config }));
    }

    reset() {
        localStorage.removeItem(STORAGE_KEY);
        this.config = structuredClone(DEFAULT_CONFIG);
        window.dispatchEvent(new CustomEvent('config-updated', { detail: this.config }));
        window.location.reload(); // Simplest way to reset everything
    }

    get() {
        return this.config;
    }

    // Helper: Deep Merge
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], this.deepMerge(target[key], source[key]));
            }
        }
        Object.assign(target || {}, source);
        return target;
    }
}

export const settingsManager = new SettingsManager();
export const activeConfig = settingsManager.get();
