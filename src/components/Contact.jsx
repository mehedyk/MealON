//src/components/Contact.jsx

import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react';

const Contact = ({ darkMode, t }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent! We will get back to you soon.');
    e.target.reset();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.contact || 'Contact Us'}</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Form */}
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              required
              className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
            <input
              type="email"
              placeholder="Your Email"
              required
              className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
            <textarea
              placeholder="Your Message"
              rows="5"
              required
              className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          {/* Email */}
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold">Email</h4>
                <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>support@mealon.app</p>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-bold">Phone</h4>
                <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>+880 1234-567890</p>
              </div>
            </div>
          </div>

          {/* GitHub */}
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold">GitHub</h4>
                <a
                  href="https://github.com/mehedyk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  @mehedyk
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
