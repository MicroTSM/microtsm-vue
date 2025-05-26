import {App} from "vue";

/**
 * Interface representing the properties that can be passed during lifecycle methods.
 * These properties are used to configure the mounting and behavior of the micro app.
 */
export interface MicroAppProps {
    /**
     * An explicit DOM element where the app should mount.
     * Takes precedence over the el option if provided.
     */
    domElement?: HTMLElement;

    /**
     * Name identifier for the micro app.
     * Used to create a custom element if no mount target is specified.
     */
    name?: string;

    /**
     * Additional custom properties that can be passed to the micro app.
     */
    [key: string]: any;
}

/**
 * Options used to configure a Vue micro app during creation.
 *
 * @template TProps - Type of props accepted by the root component
 */
export interface CreateVueMicroAppOptions {
    /**
     * CSS selector string or DOM element where the app will mount.
     * Falls back to creating a custom element if not provided.
     */
    el?: string | HTMLElement;

    /**
     * Hook to customize the Vue app instance before mounting.
     * Can perform async operations like plugin installation.
     *
     * @param instance - The Vue app instance to customize
     * @param props - The props passed during mounting
     */
    handleInstance?: (instance: App, props: MicroAppProps) => Promise<any> | void;
}

/**
 * Defines the standard lifecycle methods that a micro app must implement.
 * These methods manage the app's lifecycle from bootstrap to unmount.
 */
export interface MicroAppLifecycle {
    /**
     * Initializes the micro app.
     * Currently, it resolves immediately but can be extended for setup needs.
     */
    bootstrap: () => Promise<void>;

    /**
     * Mounts the micro app into the DOM.
     * Creates and configures a Vue app instance, determines mount target,
     * and handles instance customization.
     *
     * @param props - Configuration properties for mounting
     * @returns Promise resolving to the mounted Vue app instance
     */
    mount: (props?: MicroAppProps) => Promise<App>;

    /**
     * Updates the micro app with new properties.
     * Merges new props into the Vue app's global properties.
     *
     * @param props - New properties to apply
     */
    update: (props?: MicroAppProps) => Promise<void>;

    /**
     * Unmounts the micro app and cleans up resources.
     * Removes the app from DOM and clears the stored instance.
     */
    unmount: () => Promise<void>;
}

/**
 * Creates a Vue 3 micro app with standardized lifecycle methods.
 * Supports standalone mode for direct mounting and custom instance configuration.
 *
 * @param app - The App instance created with createApp()
 * @param opts - Configuration options for the micro app
 * @returns Object implementing the MicroAppLifecycle interface
 */
export default function createVueMicroApp(
    app: App,
    opts: CreateVueMicroAppOptions
): MicroAppLifecycle {
    const lifeCycle: MicroAppLifecycle = {
        /**
         * Bootstrap lifecycle.
         *
         * @returns A promise that resolves immediately.
         */
        bootstrap(): Promise<void> {
            return Promise.resolve();
        },

        /**
         * Mount lifecycle.
         * It resolves the appOptions (if it's a function), determines the mount element,
         * creates and mounts the Vue app, and applies any additional instance handling.
         *
         * @param props Optional micro app properties (including an optional domElement and name).
         * @returns A promise that resolves to the mounted Vue app instance.
         */
        mount(props: MicroAppProps = {}): Promise<App> {
            return new Promise((resolve, reject) => {
                // if (!opts.createApp) {
                //     throw new Error("createApp option is required");
                // }

                // Determine the mount element (priority: props.domElement > opts.el)
                let mountEl: HTMLElement | null = null;
                if (props.domElement) {
                    mountEl = props.domElement;
                } else if (opts.el) {
                    if (typeof opts.el === "string") {
                        mountEl = document.querySelector(opts.el) as HTMLElement;
                        if (!mountEl) {
                            // Create the element if it doesn't exist (fallback to a <div>)
                            mountEl = document.createElement("div");
                            mountEl.id = opts.el.replace(/^#/, "");
                            document.body.appendChild(mountEl);
                        }
                    } else if (opts.el instanceof HTMLElement) {
                        mountEl = opts.el;
                    }
                } else {
                    // If no mounting target is provided, create a custom element <microtsm-mfe-app>
                    const mfeName = props.name ? props.name : "default-mfe";

                    class MicroTSMMFEApp extends HTMLElement {
                        constructor() {
                            super();
                        }
                    }

                    if (!customElements.get('microtsm-mfe-app')) {
                        customElements.define('microtsm-mfe-app', MicroTSMMFEApp);

                        // Add style to make custom element display as block
                        const style = document.createElement('style');
                        style.textContent = 'microtsm-mfe-app { display: block; }';
                        document.head.appendChild(style);
                    }

                    mountEl = document.createElement('microtsm-mfe-app');
                    mountEl.setAttribute('name', mfeName);
                    document.body.appendChild(mountEl);

                    opts.el = `microtsm-mfe-app[name="${mfeName}"]`;
                }

                // Create the Vue app instance using the root component
                // app = opts.createApp(rootComponent, props || {});

                // Customize the instance if the handleInstance hook is provided.
                if (opts.handleInstance) {
                    Promise.resolve(opts.handleInstance(app, props))
                        .then(() => {
                            app!.mount(mountEl);
                            resolve(app!);
                        })
                        .catch(reject);
                } else {
                    app.mount(mountEl);
                    resolve(app);
                }
            });
        },

        /**
         * Update lifecycle.
         * It merges new properties into the Vue app's global properties.
         *
         * @param newProps Optional new properties to merge.
         * @returns A promise that resolves when the update is complete.
         */
        update(newProps: MicroAppProps = {}): Promise<void> {
            return new Promise((resolve) => {
                if (app && newProps) {
                    Object.assign(app.config.globalProperties, newProps);
                }
                resolve();
            });
        },

        /**
         * Unmount lifecycle.
         * It unmounts the Vue app and clears the stored instance.
         *
         * @returns A promise that resolves when the app is unmounted.
         */
        unmount(): Promise<void> {
            return new Promise((resolve) => {
                if (app) {
                    app.unmount();
                }
                resolve();
            });
        },
    };

    // Directly mount the app if running in standalone mode 
    console.log("🚀 ~ createVueMicroApp ~ process.env.MICROTSM_STANDALONE: ", process.env.MICROTSM_STANDALONE);
    console.log("🚀 ~ createVueMicroApp ~ process.env: ", process.env);
    if (process.env.MICROTSM_STANDALONE === 'true') {
        lifeCycle.mount().then(() =>
            console.log(
                "MicroTSM Vue app mounted with Standalone mode."
            ));
    }

    return lifeCycle;
}