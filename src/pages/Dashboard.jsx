import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Studio from '../components/Studio';
import StudioOverview from '../components/StudioOverview';
import ColorConversion from '../components/ColorConversion';
import ColorAlong from '../components/ColorAlong';
import ColoristLog from '../components/ColoristLog';
import UpgradePrompt from '../components/UpgradePrompt';
import ProfileDropdown from '../components/ProfileDropdown';
import Profile from './Profile';
import PrivacyPolicy from './PrivacyPolicy';
import Subscription from './Subscription';
import EditInspiration from './EditInspiration';
import EditPencilSet from './EditPencilSet';
import EditColorCombo from './EditColorCombo';
import EditColorPalette from './EditColorPalette';
import EditBook from './EditBook';
import EditBookPage from './EditBookPage';
import SetSizeDetail from './SetSizeDetail';
import AdminPencilImport from './AdminPencilImport';
import AdminPencilSets from './AdminPencilSets';
import AdminPencils from './AdminPencils';
import AdminUsers from './AdminUsers';
import AdminBrands from './AdminBrands';
import AdminBooks from './AdminBooks';
import CreatorTools from './CreatorTools';
import JoyrideWalkthrough from '../components/JoyrideWalkthrough';
import { authAPI } from '../services/api';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authAPI.getUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  // Parse URL to determine active tab and section
  const pathname = location.pathname;
  let activeTab = 'studio';
  let activeStudioSection = 'overview';
  let activeAdminSection = null;


  if (pathname.includes('/studio/')) {
    activeTab = 'studio';
    if (pathname.includes('/overview')) activeStudioSection = 'overview';
    else if (pathname.includes('/inspiration')) activeStudioSection = 'library';
    // Check for /media but not /media/set-size/ (more specific check)
    else if (pathname.includes('/media') && !pathname.includes('/media/set-size/')) activeStudioSection = 'pencils';
    else if (pathname.includes('/combos')) activeStudioSection = 'combos';
    else if (pathname.includes('/palettes')) activeStudioSection = 'palettes';
    else if (pathname.includes('/books')) activeStudioSection = 'books';
  } else if (pathname.includes('/conversion')) {
    activeTab = 'conversion';
  } else if (pathname.includes('/color-along')) {
    activeTab = 'coloralong';
  } else if (pathname.includes('/log')) {
    activeTab = 'log';
  } else if (pathname.includes('/creator-tools')) {
    activeTab = 'creator-tools';
  } else if (pathname.includes('/admin/')) {
      activeTab = 'admin';
      if (pathname.includes('/pencil-import')) activeAdminSection = 'pencil-import';
      else if (pathname.includes('/pencil-sets')) activeAdminSection = 'pencil-sets';
      else if (pathname.includes('/pencils')) activeAdminSection = 'pencils';
      else if (pathname.includes('/users')) activeAdminSection = 'users';
      else if (pathname.includes('/brands')) activeAdminSection = 'brands';
      else if (pathname.includes('/books')) activeAdminSection = 'books';
    }

  const isAdmin = user?.admin === 1 || user?.admin === true;
  const isCreator = user?.creator === 1 || user?.creator === true;

  const tabs = [
    { id: 'studio', label: 'Studio', icon: '🎨', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/studio.png' },
    { id: 'conversion', label: 'Conversion', icon: '🔄', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/conversion.png' },
    { id: 'coloralong', label: 'Color Along', icon: '📺', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/coloralong.png' },
    { id: 'log', label: 'Diary', icon: '📔', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/inspiration.png' },
    ...(isAdmin || isCreator ? [{ id: 'creator-tools', label: 'Creator Tools', icon: '🛠️', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/inspiration.png' }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '⚙️', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/inspiration.png' }] : []),
  ];

  const adminSections = [
    { id: 'pencil-import', label: 'Pencil Import', icon: '📤', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/studio.png' },
    { id: 'pencil-sets', label: 'Pencil Sets', icon: '📦', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/studio.png' },
    { id: 'brands', label: 'Brands', icon: '🏷️', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/studio.png' },
    { id: 'users', label: 'Users', icon: '👥', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/studio.png' },
    { id: 'books', label: 'Books', icon: '📖', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/studio.png' },
  ];

  const studioSections = [
    { id: 'library', label: 'Inspo', icon: '📚', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/inspiration.png' },
    { id: 'pencils', label: 'Media', icon: '✏️', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/media.png' },
    { id: 'combos', label: 'Combos', icon: '🎨', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/combos.png' },
    { id: 'palettes', label: 'Palettes', icon: '🌈', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/palettes.png' },
    { id: 'books', label: 'Books', icon: '📖', image: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/books.png' },
  ];

  const renderContent = () => {
    // Check if we're on profile, subscription, or privacy policy pages
    if (pathname.includes('/subscription')) {
      return <Subscription />;
    }
    if (pathname.includes('/profile')) {
      return <Profile />;
    }
    if (pathname.includes('/privacy-policy')) {
      return <PrivacyPolicy />;
    }

    // Check for edit pages
    if (pathname.includes('/edit/inspiration/')) {
      return <EditInspiration />;
    }
    if (pathname.includes('/edit/pencil-set/')) {
      return <EditPencilSet />;
    }
    if (pathname.includes('/edit/color-combo/')) {
      return <EditColorCombo />;
    }
    if (pathname.includes('/edit/color-palette/')) {
      return <EditColorPalette />;
    }
    if (pathname.includes('/edit/book/')) {
      return <EditBook />;
    }
    if (pathname.includes('/edit/book-page')) {
      return <EditBookPage />;
    }
    
    // Check for set size detail page
    if (pathname.includes('/studio/media/set-size/')) {
      return <SetSizeDetail />;
    }

    // Check creator tools access
    if (pathname.includes('/creator-tools')) {
      if (!isAdmin && !isCreator) {
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
              <p className="text-slate-600">You do not have permission to access creator tools.</p>
            </div>
          </div>
        );
      }
    }

    // Check admin access
    if (pathname.includes('/admin/')) {
      if (!isAdmin) {
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
              <p className="text-slate-600">You do not have permission to access the admin section.</p>
            </div>
          </div>
        );
      }
    }

    switch (activeTab) {
      case 'studio':
        // Check for set size detail page before rendering Studio
        if (pathname.includes('/studio/media/set-size/')) {
          return <SetSizeDetail />;
        }
        if (activeStudioSection === 'overview') {
          return <StudioOverview user={user} />;
        }
        return <Studio activeSection={activeStudioSection} user={user} />;
      case 'conversion':
        return <ColorConversion user={user} />;
      case 'coloralong':
        return <ColorAlong user={user} onInspirationClick={() => setSidebarCollapsed(true)} />;
      case 'log':
        // Check if user has paid subscription
        const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;
        if (isFreePlan) {
          return <UpgradePrompt featureName="Diary" />;
        }
        return <ColoristLog />;
      case 'creator-tools':
        return <CreatorTools />;
      case 'admin':
        if (activeAdminSection === 'pencil-import') {
          return <AdminPencilImport />;
        }
        if (activeAdminSection === 'pencil-sets') {
          return <AdminPencilSets />;
        }
        if (activeAdminSection === 'pencils') {
          return <AdminPencils />;
        }
        if (activeAdminSection === 'brands') {
          return <AdminBrands />;
        }
        if (activeAdminSection === 'users') {
          return <AdminUsers />;
        }
        if (activeAdminSection === 'books') {
          return <AdminBooks />;
        }
        // Default admin page - redirect to first admin section
        if (isAdmin && adminSections.length > 0) {
          navigate(`/admin/${adminSections[0].id}`);
          return null;
        }
        return <StudioOverview />;
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
          <button
            onClick={() => navigate('/studio/overview')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
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
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-2">
            {tabs.map((tab) => (
              <div key={tab.id}>
                <button
                  data-joyride={
                    tab.id === 'studio' ? 'studio-tab' :
                    tab.id === 'conversion' ? 'conversion-tab' :
                    tab.id === 'coloralong' ? 'color-along-tab' :
                    tab.id === 'log' ? 'log-tab' : null
                  }
                  onClick={() => {
                    if (tab.id === 'studio') {
                      navigate('/studio/overview');
                    } else if (tab.id === 'coloralong') {
                      navigate('/color-along');
                    } else if (tab.id === 'creator-tools') {
                      navigate('/creator-tools');
                    } else if (tab.id === 'admin') {
                      // Navigate to first admin section
                      if (adminSections.length > 0) {
                        navigate(`/admin/${adminSections[0].id}`);
                      }
                    } else {
                      navigate(`/${tab.id}`);
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
                  <span className="text-xl flex-shrink-0"><img src={tab.image} alt={tab.label} className="w-10 h-10" /></span>
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
                        data-joyride={
                          section.id === 'library' ? 'studio-inspo' :
                          section.id === 'pencils' ? 'studio-media' :
                          section.id === 'combos' ? 'studio-combos' :
                          section.id === 'palettes' ? 'studio-palettes' :
                          section.id === 'books' ? 'studio-books' : null
                        }
                        onClick={() => {
                          const routeMap = {
                            'overview': '/studio/overview',
                            'library': '/studio/inspiration',
                            'pencils': '/studio/media',
                            'combos': '/studio/combos',
                            'palettes': '/studio/palettes',
                            'books': '/studio/books'
                          };
                          navigate(routeMap[section.id] || '/studio/overview');
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
                        <span className="text-lg flex-shrink-0 mr-2"><img src={section.image} alt={section.label} className="w-10 h-10" /></span>
                        <span>{section.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* Admin Sub-navigation */}
                {tab.id === 'admin' && activeTab === 'admin' && !sidebarCollapsed && (
                  <div className="ml-6 mt-1 space-y-1">
                    {adminSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          navigate(`/admin/${section.id}`);
                        }}
                        className={`w-full flex items-center rounded-lg transition-all duration-200 px-3 py-2 text-sm ${
                          activeAdminSection === section.id
                            ? 'font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        style={activeAdminSection === section.id ? {
                          backgroundColor: 'rgba(255, 142, 126, 0.15)',
                          color: '#ea3663'
                        } : {}}
                      >
                        <span className="text-lg flex-shrink-0 mr-2"><img src={section.image} alt={section.label} className="w-10 h-10" /></span>
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
              {pathname.includes('/subscription') ? 'Subscription' :
               pathname.includes('/profile') ? 'Profile' :
               pathname.includes('/privacy-policy') ? 'Privacy Policy' :
               activeTab === 'studio' 
                ? 'Studio'
                : activeTab === 'admin'
                ? adminSections.find(section => section.id === activeAdminSection)?.label || 'Admin'
                : activeTab === 'creator-tools'
                ? 'Creator Tools'
                : tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {pathname.includes('/subscription') ? 'Manage your subscription and billing' :
               pathname.includes('/profile') ? 'Manage your account settings and preferences' :
               pathname.includes('/privacy-policy') ? 'Learn how we protect and handle your data' :
               activeTab === 'studio' && 'Your creative workspace for inspiration, colors, and projects'}
              {activeTab === 'conversion' && 'Find the closest matching colors between your pencil sets'}
              {activeTab === 'coloralong' && 'Match colors from video tutorials with your own pencil sets'}
              {activeTab === 'log' && 'Track your coloring journey and creative process'}
              {activeTab === 'creator-tools' && 'Tools and resources for content creators to manage and share their work'}
              {activeTab === 'admin' && activeAdminSection === 'pencil-import' && 'Upload CSV files to import colored pencils, sets, and sizes'}
              {activeTab === 'admin' && activeAdminSection === 'pencil-sets' && 'Manage colored pencil sets - add, edit, and delete sets'}
              {activeTab === 'admin' && activeAdminSection === 'users' && 'Manage users - add, edit, and delete user accounts'}
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
          className={`flex-1 bg-slate-50 ${activeTab === 'coloralong' ? 'px-0 overflow-hidden' : 'px-8 overflow-y-auto'}`}
          style={{
            paddingTop: activeTab === 'coloralong' ? '0' : '88px',
            marginTop: activeTab === 'coloralong' ? '72px' : '0',
            height: activeTab === 'coloralong' ? 'calc(100vh - 72px)' : 'auto',
            minHeight: activeTab === 'coloralong' ? '600px' : 'auto'
          }}
        >
          <div 
            className={`max-w-full mx-auto ${activeTab === 'coloralong' ? 'py-0 h-full' : 'py-8'}`}
            data-joyride="studio-overview"
          >
            {loadingUser ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="modern-loader mb-4">
                    <div className="loader-ring">
                      <div className="loader-ring-segment"></div>
                      <div className="loader-ring-segment"></div>
                      <div className="loader-ring-segment"></div>
                      <div className="loader-ring-segment"></div>
                    </div>
                  </div>
                  <p className="text-slate-600">Loading...</p>
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
      <JoyrideWalkthrough user={user} loadingUser={loadingUser} />
    </div>
  );
};

export default Dashboard;

