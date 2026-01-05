// ============================================
// FILE: src/components/Footer.jsx
// ============================================
import React from 'react';
import { ExternalLink, Github } from 'lucide-react';

const Footer = ({ darkMode, t }) => {
  return (
    <footer className={`border-t mt-12 py-6 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>A</span>
          <a
            href="https://github.com/mehedyk"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-1 transition-colors duration-200 hover:underline ${
              darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'
            }`}
          >
            <Github className="h-3 w-3" />
            <span className="text-xs">mehedyk</span>
          </a>
          <span>PRODUCT</span>
        </div>
        <div className={`text-center text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          MealON - All rights reserved. © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
