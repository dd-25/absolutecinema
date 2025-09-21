import React from 'react';

export const createFallbackImage = (width = 300, height = 400, text = 'Movie Poster') => {
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
            fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        ${text.replace(' ', ' ')}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

export const MoviePosterImage = ({ src, alt = 'Movie Poster', width = 300, height = 400, className = '', style = {} }) => {
  const handleError = (e) => { e.target.src = createFallbackImage(width, height, alt); };
  return React.createElement('img', { src: src || createFallbackImage(width, height, alt), alt, className, style: { backgroundColor: '#f0f0f0', ...style }, onError: handleError });
};
