/**
 * sockjs-client attend l'objet Node `global`, absent du navigateur après bundling esbuild.
 */
(window as unknown as { global: Window }).global = window;
