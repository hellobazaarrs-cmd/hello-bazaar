import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function optimizeImageUrl(url?: string, width = 800): string {
  if (!url) return '';
  if (typeof url !== 'string') return url;

  // Cloudinary auto-format & quality optimization
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('f_auto') && !url.includes('q_auto')) {
      return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
  }

  // Unsplash auto-format & width
  if (url.includes('images.unsplash.com') && !url.includes('auto=format')) {
    return `${url}${url.includes('?') ? '&' : '?'}auto=format&fit=crop&w=${width}&q=80`;
  }

  return url;
}