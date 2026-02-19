import React from 'react';

export function getDefaultDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // If Saturday (6), go back 1 day to Friday
  // If Sunday (0), go back 2 days to Friday
  if (dayOfWeek === 6) {
    today.setDate(today.getDate() - 1);
  } else if (dayOfWeek === 0) {
    today.setDate(today.getDate() - 2);
  }
  
  return today.toISOString().split('T')[0];
}

export function renderWithLinks(text: string | undefined): React.ReactNode {
  if (!text) return null;
  
  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: 'var(--accent-primary)', 
            textDecoration: 'underline',
            wordBreak: 'break-all',
            cursor: 'pointer'
          }}
          className="link-hover"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
