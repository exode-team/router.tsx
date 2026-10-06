/**
 * @ignore
 * @packageDocumentation
 */

/**
 * @ignore
 */
export function setScrollRestoration(mode: 'auto' | 'manual') {
    if ('scrollRestoration' in window.history && window.history.scrollRestoration !== mode) {
        window.history.scrollRestoration = mode;
    }
}

/**
 * @ignore
 * @param WrappedComponent
 */
export function getDisplayName(WrappedComponent: { displayName?: string; name?: string }) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
