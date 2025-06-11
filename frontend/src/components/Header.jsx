import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <h1>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#0066CC"/>
          <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6Z" fill="white"/>
          <path d="M11 8V11H8V13H11V16H13V13H16V11H13V8H11Z" fill="white"/>
        </svg>
        HealthMap
      </h1>
      <div className="header-actions">
        <a href="https://github.com/yourname/healthmap" target="_blank" rel="noopener noreferrer" className="github-link">
          GitHub
        </a>
      </div>
    </header>
  );
};

export default Header;
