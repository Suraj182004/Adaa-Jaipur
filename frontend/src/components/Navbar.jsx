import React, { useState, useContext } from 'react';
import { assets } from '../assets/assets';
import { Link, NavLink } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const {
    getCartCount,
    getWishListCount,
    navigate,
    token,
    setToken,
    setCartItems,
    setShowSearch,
    showSearch,
  } = useContext(ShopContext);

  const logout = () => {
    navigate('/login');
    localStorage.removeItem('token');
    setToken('');
    setCartItems({});
  };

  const NavItem = ({ to, children }) => (
    <NavLink
      to={to}
      onClick={() => {
        setVisible(false);
        window.scrollTo(0, 0);
      }}
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-1 transition-colors duration-200 group
         ${isActive ? 'text-black' : 'text-gray-600 hover:text-black'}`
      }
    >
      <p>{children}</p>
      <span
        className={`absolute -bottom-1 h-0.5 bg-black transition-all duration-300 
        ${({ isActive }) => (isActive ? 'w-full' : 'w-0 group-hover:w-full')}`}
      />
    </NavLink>
  );

  return (
    <nav className="sticky top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 relative">
            <Link
              to="/"
              onClick={() => window.scrollTo(0, 0)}
              className="flex-shrink-0 relative"
            >
              <div className="relative inline-block">
                <img
                  src={assets.nav_logo}
                  className="h-8 sm:h-16 w-auto object-contain transition-transform duration-200 hover:scale-105"
                  alt="Logo"
                />
                {/* Secondary Logo (like power value) */}
                {/* <img
                  src={assets.secondary_logo || '/path/to/secondary-logo.png'}
                  className="absolute -top-5 -right-5 h-8 w-auto sm:h-7 object-contain transition-transform duration-200 hover:scale-105"
                  alt="Secondary Logo"
                /> */}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto">
            <div className="flex gap-4 lg:gap-8 text-base lg:text-lg font-bold font-anton">
              <NavItem to="/">HOME</NavItem>
              <NavItem to="/collection">COLLECTION</NavItem>
              <NavItem to="/about">ABOUT</NavItem>
              <NavItem to="/contact">CONTACT</NavItem>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                         <button
               onClick={() => {
                 setShowSearch((prev) => !prev);
               }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Toggle search"
              type="button"
            >
              <img src={assets.search_icon} className="w-5 h-5" alt="Search" />
            </button>

            <div className="group relative">
              <button
                onClick={() => (token ? null : navigate('/login'))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <img src={assets.profile_icon} className="w-5 h-5" alt="Profile" />
              </button>

              {token && (
                <div className="invisible group-hover:visible absolute right-0 pt-2 w-48 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          window.scrollTo(0, 0);
                        }}
                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate('/orders');
                          window.scrollTo(0, 0);
                        }}
                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      >
                        Orders
                      </button>
                      <button
                        onClick={logout}
                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/cart"
              onClick={() => window.scrollTo(0, 0)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 relative"
            >
              <img src={assets.cart_icon} className="w-5 h-5" alt="Cart" />
              <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {getCartCount()}
              </span>
            </Link>

            <Link
              to="/wishlist"
              onClick={() => window.scrollTo(0, 0)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 relative"
            >
              <img src={assets.heart_icon} className="w-5 h-5" alt="Wishlist" />
              <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {getWishListCount()}
              </span>
            </Link>


            <button
              onClick={() => setVisible(!visible)}
              className="p-2 md:hidden hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <img src={assets.menu_icon} className="w-5 h-5" alt="Menu" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {visible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40 transition-opacity duration-300"
          onClick={() => setVisible(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          visible ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2 relative">
              <div className="relative inline-block">
                <img src={assets.nav_logo} className="h-8 w-auto" alt="Logo" />
                <img
                  src={assets.secondary_logo || '/path/to/secondary-logo.png'}
                  className="absolute -top-2 -right-2 h-3 w-auto object-contain"
                  alt="Secondary Logo"
                />
              </div>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <img src={assets.close_icon} className="w-6 h-6" alt="Close menu" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-2 py-4">
              <div className="space-y-1">
                {['HOME', 'COLLECTION', 'ABOUT', 'CONTACT'].map((item) => (
                  <NavLink
                    key={item}
                    to={item === 'HOME' ? '/' : `/${item.toLowerCase()}`}
                    onClick={() => {
                      setVisible(false);
                      window.scrollTo(0, 0);
                    }}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                      ${isActive ? 'bg-gray-100 text-custom-blue' : 'text-custom-green hover:bg-gray-50'}`
                    }
                  >
                    {item}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
