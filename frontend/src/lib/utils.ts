import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0
	}).format(amount);
}

export function timeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffSeconds < 60) return `${diffSeconds}s ago`;
	if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
	if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
	return `${Math.floor(diffSeconds / 86400)}d ago`;
}
