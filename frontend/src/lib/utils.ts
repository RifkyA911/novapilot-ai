import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type Locale = "id" | "en";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// ============================================================================
// PERFORMANCE-OPTIMIZED INTL FORMATTER CACHE
// Eliminates repetitive garbage collection and object instantiation on render
// ============================================================================

const numberFormatCache = new Map<string, Intl.NumberFormat>();
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();
const relativeTimeFormatCache = new Map<string, Intl.RelativeTimeFormat>();

/**
 * Returns a cached, high-performance Intl.NumberFormat instance.
 */
export function getNumberFormatter(
	locale: string = "id-ID",
	options: Intl.NumberFormatOptions = { style: "currency", currency: "IDR", minimumFractionDigits: 0 }
): Intl.NumberFormat {
	const key = `${locale}:${JSON.stringify(options)}`;
	let formatter = numberFormatCache.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, options);
		numberFormatCache.set(key, formatter);
	}
	return formatter;
}

/**
 * Format currency using cached NumberFormat instances.
 */
export function formatCurrency(amount: number, locale: string = "id-ID", currency: string = "IDR"): string {
	return getNumberFormatter(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 0
	}).format(amount);
}

/**
 * Returns a cached, high-performance Intl.DateTimeFormat instance.
 */
export function getDateTimeFormatter(
	locale: string = "id-ID",
	options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }
): Intl.DateTimeFormat {
	const key = `${locale}:${JSON.stringify(options)}`;
	let formatter = dateTimeFormatCache.get(key);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(locale, options);
		dateTimeFormatCache.set(key, formatter);
	}
	return formatter;
}

/**
 * Returns a cached Intl.RelativeTimeFormat instance.
 */
export function getRelativeTimeFormatter(
	locale: string = "en",
	options: Intl.RelativeTimeFormatOptions = { numeric: "auto" }
): Intl.RelativeTimeFormat {
	const key = `${locale}:${JSON.stringify(options)}`;
	let formatter = relativeTimeFormatCache.get(key);
	if (!formatter) {
		formatter = new Intl.RelativeTimeFormat(locale, options);
		relativeTimeFormatCache.set(key, formatter);
	}
	return formatter;
}

/**
 * Formats relative time (e.g. "5m ago" or localized relative string).
 */
export function timeAgo(dateString: string, locale?: Locale): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (locale === "id") {
		if (diffSeconds < 60) return `${diffSeconds} dtk lalu`;
		if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mnt lalu`;
		if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} jam lalu`;
		return `${Math.floor(diffSeconds / 86400)} hari lalu`;
	}

	// Default standard compact English
	if (diffSeconds < 60) return `${diffSeconds}s ago`;
	if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
	if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
	return `${Math.floor(diffSeconds / 86400)}d ago`;
}
