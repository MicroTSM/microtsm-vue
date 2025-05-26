import {App, CreateAppFunction} from "vue";
import "css.escape";

/**
 * Interface representing the Vue component options for the micro app.
 * It extends Vue's Component interface with an optional 'el' property,
 * and allows additional Vue options.
 *
 * @interface MicroVueAppOptions
 */
export interface MicroVueAppOptions {
    /**
     * A CSS selector string or DOM element where the app will mount.
     */
    el?: string | HTMLElement;

    /**
     * Additional Vue component options (such as data, template, etc.).
     */
    [key: string]: any;
}

/**
 * Interface representing the properties that can be passed during lifecycle methods.
 *
 * @interface MicroAppProps
 */
export interface MicroAppProps {
    /**
     * An optional explicit DOM element where the app should mount.
     */
    domElement?: HTMLElement;

    /**
     * Additional properties.
     */
    [key: string]: any;
}

/**
 * Interface for the options used to create a Vue micro app lifecycle.
 *
 * @interface CreateVueMicroAppOptions
 */
export interface CreateVueMicroAppOptions {
    /**
     * The Vue component options, or a function returning Vue component options.
     */
    appOptions: MicroVueAppOptions | ((props: MicroAppProps) => MicroVueAppOptions);

    /**
     * Vue 3's createApp function.
     */
    createApp: CreateAppFunction<Element>;

    /**
     * Optional hook to perform custom modifications on the Vue app instance during mount.
     */
    handleInstance?: (instance: App, props: MicroAppProps) => Promise<any> | void;
}

/**
 * Interface defining the lifecycle methods for the micro app.
 *
 * @interface MicroAppLifecycle
 */
export interface MicroAppLifecycle {
    /**
     * The bootstrap lifecycle method.
     */
    bootstrap: () => Promise<void>;

    /**
     * The mount lifecycle method.
     *
     * @param props Optional properties for the micro app.
     * @returns A promise that resolves to the mounted Vue app instance.
     */
    mount: (props?: MicroAppProps) => Promise<App>;

    /**
     * The update lifecycle method.
     *
     * @param props Optional new properties to update.
     */
    update: (props?: MicroAppProps) => Promise<void>;

    /**
     * The unmount lifecycle method.
     */
    unmount: () => Promise<void>;
}

/**
 * Creates a Vue 3 micro app lifecycle helper.
 * This function returns an object containing the standard lifecycle methods:
 * bootstrap, mount, update, and unmount.
 *
 * @param userOpts User-supplied options for configuring the Vue micro app.
 * @returns An object implementing the MicroAppLifecycle interface.
 * @throws Will throw an error if userOpts is not an object or required options are missing.
 */
export default function createVueMicroApp(
    userOpts: CreateVueMicroAppOptions
): MicroAppLifecycle {
    if (typeof userOpts !== "object") {
        throw new Error("createVueMicroApp requires a configuration object");
    }

    const opts: CreateVueMicroAppOptions = {...userOpts};

    if (!opts.appOptions) {
        throw new Error("createVueMicroApp must be passed opts.appOptions");
    }
    if (!opts.createApp) {
        throw new Error(
            "createVueMicroApp must be passed opts.createApp (Vue 3's createApp function)"
        );
    }

    // Store the Vue app instance created during mount
    let vueInstance: App | null = null;

    return {
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
         * @param props Optional micro app properties (including an optional domElement).
         * @returns A promise that resolves to the mounted Vue app instance.
         */
        mount(props: MicroAppProps = {}): Promise<App> {
            return new Promise((resolve, reject) => {
                let resolvedAppOptions: MicroVueAppOptions;
                try {
                    resolvedAppOptions =
                        typeof opts.appOptions === "function"
                            ? opts.appOptions(props)
                            : {...opts.appOptions};
                } catch (error) {
                    return reject(error);
                }

                // Determine the mount element (priority: props.domElement > resolvedAppOptions.el)
                let mountEl: HTMLElement | null = null;
                if (props.domElement) {
                    mountEl = props.domElement;
                } else if (resolvedAppOptions.el) {
                    if (typeof resolvedAppOptions.el === "string") {
                        mountEl = document.querySelector(resolvedAppOptions.el) as HTMLElement;
                        if (!mountEl) {
                            // Create the element if it doesn't exist
                            mountEl = document.createElement("div");
                            mountEl.id = resolvedAppOptions.el.replace(/^#/, "");
                            document.body.appendChild(mountEl);
                        }
                    } else if (resolvedAppOptions.el instanceof HTMLElement) {
                        mountEl = resolvedAppOptions.el;
                    }
                } else {
                    // If no mounting target is provided, create one with a generated id.
                    const generatedId =
                        "micro-vue-app-" + Math.random().toString(36).substring(2, 8);
                    mountEl = document.createElement("div");
                    mountEl.id = generatedId;
                    document.body.appendChild(mountEl);
                    resolvedAppOptions.el = "#" + CSS.escape(generatedId);
                }

                // Remove the 'el' property since Vue 3's createApp expects a component without it.
                const {el, ...componentOptions} = resolvedAppOptions;

                // Create the Vue app instance using the provided createApp function.
                vueInstance = opts.createApp(componentOptions);

                // Customize the instance if handleInstance hook is provided.
                if (opts.handleInstance) {
                    Promise.resolve(opts.handleInstance(vueInstance, props))
                        .then(() => {
                            vueInstance!.mount(mountEl);
                            resolve(vueInstance!);
                        })
                        .catch(reject);
                } else {
                    vueInstance.mount(mountEl);
                    resolve(vueInstance);
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
                if (vueInstance && newProps) {
                    Object.assign(vueInstance.config.globalProperties, newProps);
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
                if (vueInstance) {
                    vueInstance.unmount();
                }
                vueInstance = null;
                resolve();
            });
        }
    };
}