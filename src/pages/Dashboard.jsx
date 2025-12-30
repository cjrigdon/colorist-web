import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Studio from '../components/Studio';
import StudioOverview from '../components/StudioOverview';
import ColorConversion from '../components/ColorConversion';
import ColorAlong from '../components/ColorAlong';
import ColoristLog from '../components/ColoristLog';
import ProfileDropdown from '../components/ProfileDropdown';
import Profile from './Profile';
import PrivacyPolicy from './PrivacyPolicy';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Parse URL to determine active tab and section
  const pathname = location.pathname;
  let activeTab = 'studio';
  let activeStudioSection = 'overview';

  // Redirect /dashboard to /dashboard/studio/overview
  useEffect(() => {
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      navigate('/dashboard/studio/overview', { replace: true });
    }
  }, [pathname, navigate]);

  if (pathname.includes('/studio/')) {
    activeTab = 'studio';
    if (pathname.includes('/overview')) activeStudioSection = 'overview';
    else if (pathname.includes('/inspiration')) activeStudioSection = 'library';
    else if (pathname.includes('/media')) activeStudioSection = 'pencils';
    else if (pathname.includes('/combos')) activeStudioSection = 'combos';
    else if (pathname.includes('/palettes')) activeStudioSection = 'palettes';
    else if (pathname.includes('/books')) activeStudioSection = 'books';
  } else if (pathname.includes('/conversion')) {
    activeTab = 'conversion';
  } else if (pathname.includes('/color-along')) {
    activeTab = 'coloralong';
  } else if (pathname.includes('/log')) {
    activeTab = 'log';
  }

  const tabs = [
    { id: 'studio', label: 'Studio', icon: '🎨' },
    { id: 'conversion', label: 'Conversion', icon: '🔄' },
    { id: 'coloralong', label: 'Color Along', icon: '📺' },
    { id: 'log', label: 'Log', icon: '📔' },
  ];

  const studioSections = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'library', label: 'Inspiration', icon: '📚' },
    { id: 'pencils', label: 'Media', icon: '✏️' },
    { id: 'combos', label: 'Combos', icon: '🎨' },
    { id: 'palettes', label: 'Palettes', icon: '🌈' },
    { id: 'books', label: 'Books', icon: '📖' },
  ];

  const renderContent = () => {
    // Check if we're on profile or privacy policy pages
    if (pathname.includes('/profile')) {
      return <Profile />;
    }
    if (pathname.includes('/privacy-policy')) {
      return <PrivacyPolicy />;
    }

    switch (activeTab) {
      case 'studio':
        if (activeStudioSection === 'overview') {
          return <StudioOverview />;
        }
        return <Studio activeSection={activeStudioSection} />;
      case 'conversion':
        return <ColorConversion />;
      case 'coloralong':
        return <ColorAlong />;
      case 'log':
        return <ColoristLog />;
      default:
        return <StudioOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex">
      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 border-r border-slate-200 shadow-sm transition-all duration-300 flex flex-col relative z-50 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{
          backgroundColor: '#fff4f2',
          height: '100vh',
          position: 'fixed'
        }}
      >
        {/* Toggle Button - Overlapping Right Edge */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-8 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-3 h-3 text-slate-600 transition-transform duration-300 ${
              sidebarCollapsed ? 'rotate-0' : 'rotate-180'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Logo Section */}
        <div 
          className={`border-b border-slate-200 flex items-center px-4 transition-all duration-300 ${
            sidebarCollapsed ? 'justify-center' : 'justify-start space-x-3'
          }`}
          style={{
            backgroundColor: 'rgba(255, 142, 126, 0.4)',
            height: '72px'
          }}
        >
          <img src="/logo300.png" alt="Colorist" className="h-10 w-10 flex-shrink-0" style={{ backgroundColor: 'transparent' }} />
          <h1 
            className={`text-2xl font-bold whitespace-nowrap transition-all duration-300 font-venti uppercase ${
              sidebarCollapsed 
                ? 'opacity-0 w-0 overflow-hidden' 
                : 'opacity-100 w-auto'
            }`}
            style={{ color: '#ea3663' }}
          >
            Colorist
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-2">
            {tabs.map((tab) => (
              <div key={tab.id}>
                <button
                  onClick={() => {
                    if (tab.id === 'studio') {
                      navigate('/dashboard/studio/overview');
                    } else if (tab.id === 'coloralong') {
                      navigate('/dashboard/color-along');
                    } else {
                      navigate(`/dashboard/${tab.id}`);
                    }
                  }}
                  className={`w-full flex items-center rounded-lg transition-all duration-200 ${
                    sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-3 py-3 space-x-3'
                  } ${
                    activeTab === tab.id
                      ? 'font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={activeTab === tab.id ? {
                    backgroundColor: 'rgba(255, 142, 126, 0.15)',
                    color: '#ea3663'
                  } : {}}
                  title={sidebarCollapsed ? tab.label : ''}
                >
                  <span className="text-xl flex-shrink-0">{tab.icon}</span>
                  <span className={`text-sm whitespace-nowrap transition-all duration-300 ${
                    sidebarCollapsed 
                      ? 'opacity-0 w-0 overflow-hidden' 
                      : 'opacity-100 w-auto ml-0'
                  }`}>
                    {tab.label}
                  </span>
                </button>
                {/* Studio Sub-navigation */}
                {tab.id === 'studio' && activeTab === 'studio' && !sidebarCollapsed && (
                  <div className="ml-6 mt-1 space-y-1">
                    {studioSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          const routeMap = {
                            'overview': '/dashboard/studio/overview',
                            'library': '/dashboard/studio/inspiration',
                            'pencils': '/dashboard/studio/media',
                            'combos': '/dashboard/studio/combos',
                            'palettes': '/dashboard/studio/palettes',
                            'books': '/dashboard/studio/books'
                          };
                          navigate(routeMap[section.id] || '/dashboard/studio/overview');
                        }}
                        className={`w-full flex items-center rounded-lg transition-all duration-200 px-3 py-2 text-sm ${
                          activeStudioSection === section.id
                            ? 'font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        style={activeStudioSection === section.id ? {
                          backgroundColor: 'rgba(255, 142, 126, 0.15)',
                          color: '#ea3663'
                        } : {}}
                      >
                        <span className="text-lg flex-shrink-0 mr-2">{section.icon}</span>
                        <span>{section.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-200 p-4">
          <ProfileDropdown sidebarCollapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '256px'
        }}
      >
        {/* Fixed Header */}
        <header 
          className="fixed top-0 right-0 border-b border-slate-200 shadow-sm flex items-center justify-between px-6 py-3 z-40 transition-all duration-300"
          style={{
            backgroundColor: '#fff4f2',
            height: '72px',
            left: sidebarCollapsed ? '80px' : '256px'
          }}
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-800 font-venti">
              {pathname.includes('/profile') ? 'Profile' :
               pathname.includes('/privacy-policy') ? 'Privacy Policy' :
               activeTab === 'studio' 
                ? studioSections.find(section => section.id === activeStudioSection)?.label || 'Studio'
                : tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {pathname.includes('/profile') ? 'Manage your account settings and preferences' :
               pathname.includes('/privacy-policy') ? 'Learn how we protect and handle your data' :
               activeTab === 'studio' && (
                activeStudioSection === 'overview' && 'A quick glance at your creative studio' ||
                activeStudioSection === 'library' && 'Browse your collection of inspirations' ||
                activeStudioSection === 'pencils' && 'Track your colored pencil sets and colors' ||
                activeStudioSection === 'combos' && 'Save and organize your favorite color combinations' ||
                activeStudioSection === 'palettes' && 'Your favorite color palette collections' ||
                activeStudioSection === 'books' && 'Track your favorite coloring book collection' ||
                'Your creative workspace for inspiration, colors, and projects'
              )}
              {activeTab === 'conversion' && 'Find the closest matching colors between your pencil sets'}
              {activeTab === 'coloralong' && 'Match colors from video tutorials with your own pencil sets'}
              {activeTab === 'log' && 'Track your coloring journey and creative process'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main 
          className={`flex-1 overflow-y-auto bg-slate-50 ${activeTab === 'coloralong' ? 'px-0' : 'px-8'}`}
          style={{
            paddingTop: '88px'
          }}
        >
          <div className={`max-w-full mx-auto ${activeTab === 'coloralong' ? 'py-0' : 'py-8'}`}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

