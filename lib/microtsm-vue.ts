import { App, Component, createApp } from 'vue';
import { Router } from 'vue-router';

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
    setupInstance?: (instance: App, props: MicroAppProps) => Promise<any> | void;
}

/**
 * TODO: import from core package
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
    mount: (props?: MicroAppProps) => Promise<ReturnType<App['mount']>>;

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
 * Provides support for standalone execution and allows custom instance configuration.
 *
 * @param {Component} rootComponent - The root Vue component (e.g., App.vue).
 * @param {CreateVueMicroAppOptions} [opts={}] - Optional configuration settings.
 * @returns {MicroAppLifecycle} Object implementing micro-app lifecycle methods (`bootstrap`, `mount`, `update`, `unmount`).
 */
export default function createVueMicroApp(
    rootComponent: Component,
    opts: CreateVueMicroAppOptions = {},
): MicroAppLifecycle {
    let app: App | null = null;
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
        async mount(props: MicroAppProps = {}): Promise<ReturnType<App['mount']>> {
            const appInstance = await new Promise<ReturnType<App['mount']>>((resolve, reject) => {
                // Determine the mount element (priority: props.domElement > opts.el)
                let mountEl: HTMLElement | null = null;
                if (props.domElement && document.body.contains(props.domElement)) {
                    mountEl = props.domElement;
                } else if (opts.el) {
                    if (typeof opts.el === 'string') {
                        mountEl = document.querySelector(opts.el) as HTMLElement;
                        if (!mountEl) {
                            const errMessage =
                                '❌ Failed to mount the app: The specified DOM element does not exist. ' +
                                'If `el` is provided as a query string, ensure that the element is present in your `index.html`.';
                            console.error(errMessage);
                            reject(errMessage);
                        }
                    } else if (opts.el instanceof HTMLElement) {
                        mountEl = opts.el;
                    }
                } else {
                    // If no mounting target is provided, create a custom element <microtsm-mfe-app>
                    const mfeName = props.name ? props.name : 'default-mfe';

                    class MicroTSMMFEApp extends HTMLElement {
                        constructor() {
                            super();
                        }
                    }

                    if (!customElements.get('microtsm-mfe-app')) {
                        customElements.define('microtsm-application', MicroTSMMFEApp);

                        // Add style to make custom element display as block
                        const style = document.createElement('style');
                        style.textContent = 'microtsm-application { display: block; }';
                        document.head.appendChild(style);
                    }

                    mountEl = document.createElement('microtsm-application');
                    mountEl.setAttribute('name', mfeName);
                    document.body.appendChild(mountEl);
                }

                // Create the Vue app instance using the root component
                app = createApp(rootComponent, props || {});
                let publicInstance: ReturnType<typeof app.mount>;

                // Customize the instance if the setupInstance hook is provided.
                if (opts.setupInstance) {
                    Promise.resolve(opts.setupInstance(app, props))
                        .then(() => {
                            publicInstance = app!.mount(mountEl);
                            resolve(publicInstance!);
                        })
                        .catch(reject);
                } else {
                    publicInstance = app.mount(mountEl);
                    resolve(publicInstance);
                }
            });

            /**
             * Ensures Vue Router correctly resolves routes when a micro-app is remounted.
             *
             * 🔹 **Why This Is Needed:**
             * - Vue Router loses its view when the micro-app is recreated, even though the router state persists.
             * - ES module caching means the router instance remains, but Vue's reactive system doesn't automatically refresh the view.
             * - Manually resolving the route ensures that `<router-view>` displays the correct component upon remount.
             *
             * 🔹 **How It Works:**
             * - Waits for Vue Router to be fully initialized (`router.isReady()`).
             * - If no matching components are found (`matched.length === 0`), it manually resolves the correct route.
             * - Updates `router.currentRoute.value` with the resolved match to ensure a fresh render.
             */
            (async function resolveRoute() {
                const router: Router = appInstance['$router' as keyof typeof appInstance];

                if (router) {
                    const { matched } = router.currentRoute.value;
                    if (matched.length === 0) {
                        const correctRoute = router.resolve(window.location.pathname);
                        router.currentRoute.value = {
                            ...correctRoute,
                            name: correctRoute.name ?? '',
                        };
                    }
                }
            })().then();

            return appInstance;
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
    if (window.__MICROTSM_STANDALONE__) {
        lifeCycle.mount().then(() => console.log('MicroTSM Vue app mounted with Standalone mode.'));
    }

    return lifeCycle;
}

declare global {
    interface Window {
        __MICROTSM_STANDALONE__: boolean;
    }
}
