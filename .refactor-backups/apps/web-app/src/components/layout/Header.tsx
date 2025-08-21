'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Menu, X, User, LogIn, UserPlus, ChevronDown, Heart, GraduationCap } from 'lucide-react';
import { cn } from '@altamedica/utils';

interface HeaderProps {
  transparent?: boolean;
  isAuthenticated?: boolean;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onLogin?: () => void;
  onRegister?: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  className?: string;
}

export function Header({
  transparent = false,
  isAuthenticated = false,
  user,
  onLogin,
  onRegister,
  onLogout,
  onProfileClick,
  className,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const primaryNavItems = [
    { href: '/', label: 'Inicio', current: false },
    { href: '/servicios', label: 'Servicios', current: false },
    { href: '/especialistas', label: 'Especialistas', current: false },
    { href: '/contacto', label: 'Contacto', current: false },
  ];

  const headerClasses = cn(
    'w-full transition-all duration-300 ease-medical',
    transparent
      ? 'bg-transparent backdrop-blur-sm'
      : 'bg-white shadow-md border-b border-neutral-200',
    className
  );

  const containerClasses = cn(
    'container mx-auto px-4 lg:px-8',
    'flex items-center justify-between',
    'h-16 lg:h-20'
  );

  const logoClasses = cn(
    'text-2xl lg:text-3xl font-bold',
    'text-primary-600 hover:text-primary-700',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'rounded-sm'
  );

  const navLinkClasses = cn(
    'px-3 py-2 rounded-md text-sm font-medium',
    'text-neutral-700 hover:text-primary-600',
    'hover:bg-neutral-50 transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
  );

  const mobileNavLinkClasses = cn(
    'block px-3 py-2 rounded-md text-base font-medium',
    'text-neutral-700 hover:text-primary-600',
    'hover:bg-neutral-50 transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
  );

  const buttonClasses = cn(
    'inline-flex items-center px-4 py-2 border border-transparent',
    'text-sm font-medium rounded-md transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2'
  );

  const primaryButtonClasses = cn(
    buttonClasses,
    'text-white bg-primary-600 hover:bg-primary-700',
    'focus:ring-primary-500'
  );

  const secondaryButtonClasses = cn(
    buttonClasses,
    'text-primary-600 bg-primary-50 hover:bg-primary-100',
    'focus:ring-primary-500 border-primary-200'
  );

  const hamburgerButtonClasses = cn(
    'inline-flex items-center justify-center p-2 rounded-md',
    'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50',
    'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
    'transition-colors duration-200'
  );

  return (
    <header className={headerClasses} role="banner">
      <div className={containerClasses}>
        {/* Logo and Developer Info */}
        <div className="flex items-center">
          <a 
            href="/" 
            className={logoClasses}
            aria-label="ALTAMEDICA - Página de inicio"
          >
            ALTAMEDICA
          </a>
          <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-neutral-200">
            <div className="flex items-center space-x-2 text-xs text-neutral-500">
              <span>Desarrollado con</span>
              <Heart className="w-3 h-3 text-red-500 animate-pulse" />
              <span>por</span>
              <div className="flex items-center space-x-1 text-primary-600">
                <GraduationCap className="w-3 h-3" />
                <span className="font-medium">Eduardo Marques</span>
              </div>
              <span className="text-neutral-400">
                Medicina - UBA
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4" role="navigation" aria-label="Navegación principal">
          {primaryNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={navLinkClasses}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className={cn(
                    'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium',
                    'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                  aria-label="Menú de usuario"
                  aria-expanded="false"
                >
                  <div className="flex items-center space-x-2">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'Usuario'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span className="hidden lg:block">
                      {user?.name || 'Usuario'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className={cn(
                    'min-w-[200px] bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5',
                    'p-1 z-dropdown animate-fade-in'
                  )}
                  align="end"
                  sideOffset={5}
                >
                  <DropdownMenu.Item
                    className={cn(
                      'block px-4 py-2 text-sm text-neutral-700 rounded-md',
                      'hover:bg-neutral-50 hover:text-primary-600',
                      'focus:outline-none focus:bg-neutral-50 focus:text-primary-600',
                      'cursor-pointer transition-colors duration-200'
                    )}
                    onClick={onProfileClick}
                  >
                    Mi Perfil
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className={cn(
                      'block px-4 py-2 text-sm text-neutral-700 rounded-md',
                      'hover:bg-neutral-50 hover:text-primary-600',
                      'focus:outline-none focus:bg-neutral-50 focus:text-primary-600',
                      'cursor-pointer transition-colors duration-200'
                    )}
                  >
                    Configuración
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-neutral-200" />
                  <DropdownMenu.Item
                    className={cn(
                      'block px-4 py-2 text-sm text-neutral-700 rounded-md',
                      'hover:bg-neutral-50 hover:text-primary-600',
                      'focus:outline-none focus:bg-neutral-50 focus:text-primary-600',
                      'cursor-pointer transition-colors duration-200'
                    )}
                    onClick={onLogout}
                  >
                    Cerrar Sesión
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={onLogin}
                className={secondaryButtonClasses}
                type="button"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </button>
              <button
                onClick={onRegister}
                className={primaryButtonClasses}
                type="button"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Registrarse
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className={hamburgerButtonClasses}
            aria-expanded={isMobileMenuOpen}
            aria-label="Abrir menú de navegación"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Slide-in drawer */}
          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-xl transform transition-transform">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
                <h2 id="mobile-menu-title" className="text-lg font-semibold text-neutral-900">
                  Menú
                </h2>
                <button
                  onClick={closeMobileMenu}
                  className={hamburgerButtonClasses}
                  aria-label="Cerrar menú"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-2" role="navigation" aria-label="Navegación móvil">
                {primaryNavItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={mobileNavLinkClasses}
                    onClick={closeMobileMenu}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Mobile User Actions */}
              <div className="px-4 py-4 border-t border-neutral-200">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'Usuario'}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-neutral-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {user?.name || 'Usuario'}
                        </div>
                        {user?.email && (
                          <div className="text-xs text-neutral-500">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onProfileClick?.();
                        closeMobileMenu();
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm font-medium',
                        'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                      )}
                    >
                      Mi Perfil
                    </button>
                    <button
                      onClick={() => {
                        onLogout?.();
                        closeMobileMenu();
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm font-medium',
                        'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                      )}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onLogin?.();
                        closeMobileMenu();
                      }}
                      className={cn(
                        'w-full flex items-center justify-center px-4 py-2',
                        'text-primary-600 bg-primary-50 hover:bg-primary-100',
                        'border border-primary-200 rounded-md text-sm font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        'transition-colors duration-200'
                      )}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        onRegister?.();
                        closeMobileMenu();
                      }}
                      className={cn(
                        'w-full flex items-center justify-center px-4 py-2',
                        'text-white bg-primary-600 hover:bg-primary-700',
                        'rounded-md text-sm font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        'transition-colors duration-200'
                      )}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrarse
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
