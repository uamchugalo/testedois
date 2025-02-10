import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">
              SAAS feito por{' '}
              <a
                href="https://instagram.com/fb.criativo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                @fb.criativo
              </a>
            </p>
          </div>
          <div>
            <p className="text-sm">
              Suporte:{' '}
              <a
                href="mailto:moletomgeek@gmail.com"
                className="text-blue-400 hover:text-blue-300"
              >
                moletomgeek@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
