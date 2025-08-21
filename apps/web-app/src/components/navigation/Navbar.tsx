'use client';

import React from 'react';
import { Header } from '../layout/Header';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * @deprecated This component is deprecated. Use Header from '../layout/Header' instead.
 * The new Header component provides better accessibility, semantic HTML, and mobile support.
 */
const Navbar: React.FC<{ transparent?: boolean }> = ({ transparent = false }) => {
  logger.warn('Navbar component is deprecated. Use Header from ../layout/Header instead.');
  
  return (
    <Header 
      transparent={transparent}
      onLogin={() => window.location.href = '/login'}
      onRegister={() => window.location.href = '/register'}
    />
  );
};

export default Navbar;
