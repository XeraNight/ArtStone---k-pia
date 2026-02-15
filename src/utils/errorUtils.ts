/**
 * Error utility functions for converting technical errors to user-friendly messages
 */

export function getErrorMessage(error: unknown): string {
    // Handle Error objects
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Network errors
        if (message.includes('failed to fetch') || message.includes('network')) {
            return 'Problém s pripojením. Skontrolujte internetové pripojenie a skúste to znova.';
        }

        if (message.includes('timeout')) {
            return 'Požiadavka trvala príliš dlho. Skúste to znova.';
        }

        // Authentication errors
        if (message.includes('jwt') || message.includes('token')) {
            return 'Platnosť prihlásenia vypršala. Prihláste sa znova.';
        }

        if (message.includes('invalid credentials') || message.includes('authentication')) {
            return 'Neplatné prihlasovacie údaje.';
        }

        if (message.includes('session')) {
            return 'Platnosť session vypršala. Prihláste sa znova.';
        }

        // Permission errors
        if (message.includes('permission') || message.includes('unauthorized')) {
            return 'Nemáte oprávnenie na túto akciu.';
        }

        if (message.includes('forbidden') || message.includes('access denied')) {
            return 'Prístup zamietnutý.';
        }

        // Database errors
        if (message.includes('unique constraint') || message.includes('23505')) {
            return 'Záznam s týmito údajmi už existuje.';
        }

        if (message.includes('foreign key') || message.includes('23503')) {
            return 'Nemožno vymazať, existujú závislé záznamy.';
        }

        if (message.includes('not found') || message.includes('404')) {
            return 'Požadovaný záznam sa nenašiel.';
        }

        // Return original message if no match
        return error.message || 'Vyskytla sa neočakávaná chyba.';
    }

    // Handle Supabase/PostgreSQL errors
    if (typeof error === 'object' && error !== null) {
        const err = error as any;

        // Supabase error format
        if (err.code) {
            switch (err.code) {
                case '23505':
                    return 'Záznam s týmito údajmi už existuje.';
                case '23503':
                    return 'Nemožno vymazať, existujú závislé záznamy.';
                case '42501':
                    return 'Nemáte oprávnenie na túto operáciu.';
                case 'PGRST116':
                    return 'Žiadny záznam nebol nájdený.';
                default:
                    if (err.message) {
                        return getErrorMessage(new Error(err.message));
                    }
            }
        }

        // HTTP status codes
        if (err.status) {
            switch (err.status) {
                case 401:
                    return 'Nie ste prihlásený. Prihláste sa prosím.';
                case 403:
                    return 'Nemáte oprávnenie na túto akciu.';
                case 404:
                    return 'Požadovaný záznam sa nenašiel.';
                case 500:
                    return 'Chyba servera. Skúste to neskôr.';
                case 503:
                    return 'Služba je momentálne nedostupná. Skúste to neskôr.';
            }
        }

        if (err.message) {
            return getErrorMessage(new Error(err.message));
        }
    }

    // Handle string errors
    if (typeof error === 'string') {
        return getErrorMessage(new Error(error));
    }

    // Fallback
    return 'Vyskytla sa neočakávaná chyba.';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('network') ||
            message.includes('failed to fetch') ||
            message.includes('timeout');
    }
    return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('jwt') ||
            message.includes('token') ||
            message.includes('session') ||
            message.includes('authentication');
    }

    if (typeof error === 'object' && error !== null) {
        const err = error as any;
        return err.status === 401;
    }

    return false;
}

/**
 * Check if error should trigger retry
 */
export function shouldRetry(error: unknown, attemptNumber: number): boolean {
    // Don't retry more than 3 times
    if (attemptNumber >= 3) return false;

    // Retry network errors
    if (isNetworkError(error)) return true;

    // Don't retry auth errors (need login)
    if (isAuthError(error)) return false;

    // Don't retry client errors (4xx)
    if (typeof error === 'object' && error !== null) {
        const err = error as any;
        if (err.status >= 400 && err.status < 500) {
            return false;
        }
    }

    // Retry server errors (5xx)
    if (typeof error === 'object' && error !== null) {
        const err = error as any;
        if (err.status >= 500) {
            return true;
        }
    }

    // Default: retry
    return true;
}
