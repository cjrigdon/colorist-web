import React, { useState, useEffect, useRef } from 'react';
import Joyride from 'react-joyride-react-19';
import { useLocation, useNavigate } from 'react-router-dom';

const steps = [
  {
    target: '[data-joyride="studio-tab"]',
    content: 'Welcome to Colorist! This is your Studio - your main workspace for managing your colored pencil collection, inspirations, and creative projects.',
    placement: 'right',
    route: '/studio/overview',
    disableBeacon: true
  },
  {
    target: '[data-joyride="studio-overview"]',
    content: 'The Studio Overview gives you a quick glance at all your collections - inspirations, pencil sets, color combos, palettes, and books.',
    placement: 'bottom',
    route: '/studio/overview',
  },
  {
    target: '[data-joyride="studio-inspo"]',
    content: 'Inspo is where you save and organize your creative inspirations - images, videos, and ideas that spark your creativity.',
    placement: 'right',
    route: '/studio/inspiration',
  },
  {
    target: '[data-joyride="studio-media"]',
    content: 'Media is your colored pencil inventory. Track all your pencil sets, individual pencils, and manage your collection here.',
    placement: 'right',
    route: '/studio/media',
  },
  {
    target: '[data-joyride="studio-combos"]',
    content: 'Combos lets you save and organize your favorite color combinations. Perfect for planning your next coloring project!',
    placement: 'right',
    route: '/studio/combos',
  },
  {
    target: '[data-joyride="studio-palettes"]',
    content: 'Palettes is where you store your favorite color palette collections. Create and organize palettes for different projects.',
    placement: 'right',
    route: '/studio/palettes',
  },
  {
    target: '[data-joyride="studio-books"]',
    content: 'Books helps you track your coloring book collection. Keep a record of all your favorite books and their details.',
    placement: 'right',
    route: '/studio/books',
  },
  {
    target: '[data-joyride="conversion-tab"]',
    content: 'Conversion helps you find the closest matching colors between different pencil sets. Perfect when you need to substitute a color!',
    placement: 'bottom',
    route: '/conversion',
    floaterProps: {
      disableAnimation: false,
    },
  },
  {
    target: '[data-joyride="color-along-tab"]',
    content: 'Color Along lets you match colors from video tutorials with your own pencil sets. Follow along with your favorite coloring videos!',
    placement: 'right',
    route: '/color-along',
    floaterProps: {
      disableAnimation: false,
    },
  },
  {
    target: '[data-joyride="log-tab"]',
    content: 'Log is your personal coloring journal. Track your coloring journey, document your process, and reflect on your creative work.',
    placement: 'right',
    route: '/log',
    floaterProps: {
      disableAnimation: false,
    },
  },
];

const JoyrideWalkthrough = ({ user, loadingUser }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [waitingForNavigation, setWaitingForNavigation] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navigationTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Expose setRun to window for testing/debugging
  useEffect(() => {
    window.startJoyride = () => {
      setStepIndex(0);
      localStorage.removeItem('colorist-walkthrough-completed');
      if (!location.pathname.includes('/studio/overview')) {
        navigate('/studio/overview');
      }
      setTimeout(() => {
        setRun(true);
      }, 500);
    };
    return () => {
      delete window.startJoyride;
    };
  }, [location.pathname, navigate]);

  // Check if DOM elements are ready
  const checkElementsReady = () => {
    const firstStepTarget = document.querySelector(steps[0].target);
    return firstStepTarget !== null;
  };

  useEffect(() => {
    // Listen for restart tour event
    const handleRestartTour = () => {
      localStorage.removeItem('colorist-walkthrough-completed');
      setStepIndex(0);
      hasInitializedRef.current = false;
      if (!location.pathname.includes('/studio/overview')) {
        navigate('/studio/overview');
      }
      // Wait for DOM to be ready
      const checkReady = setInterval(() => {
        if (checkElementsReady()) {
          clearInterval(checkReady);
          setRun(true);
        }
      }, 100);
      
      // Fallback timeout
      setTimeout(() => {
        clearInterval(checkReady);
        setRun(true);
      }, 2000);
    };

    window.addEventListener('restart-tour', handleRestartTour);
    
    return () => {
      window.removeEventListener('restart-tour', handleRestartTour);
    };
  }, [location.pathname, navigate]);

  // Auto-start walkthrough for new users
  useEffect(() => {
    // Only run once when user is loaded and not loading
    if (hasInitializedRef.current || !user || loadingUser) {
      return;
    }

    // Check if user has completed the walkthrough
    const hasCompletedWalkthrough = localStorage.getItem('colorist-walkthrough-completed');
    
    // Only show walkthrough if not completed and user is logged in
    if (!hasCompletedWalkthrough) {
      hasInitializedRef.current = true;
      
      // Ensure we start at the overview page
      const needsNavigation = !location.pathname.includes('/studio/overview');
      if (needsNavigation) {
        navigate('/studio/overview');
      }
      
      // Wait for DOM elements to be ready before starting
      let retryCount = 0;
      const maxRetries = 30; // Try for up to 6 seconds (30 * 200ms)
      
      const startTour = () => {
        // Check if element exists
        const element = document.querySelector(steps[0].target);
        
        if (element) {
          // Element found, start the tour
          setRun(true);
          return true; // Success
        } else if (retryCount < maxRetries) {
          retryCount++;
          return false; // Keep trying
        } else {
          // Fallback: start anyway after max retries
          console.warn('Joyride: Target element not found after retries, starting tour anyway');
          setRun(true);
          return true; // Done
        }
      };

      // Wait for navigation and page render to complete
      // Longer delay if we needed to navigate
      const initialDelay = needsNavigation ? 3000 : 2000;
      let checkInterval = null;
      
      const timer = setTimeout(() => {
        // Start checking periodically until element is found or max retries
        checkInterval = setInterval(() => {
          if (startTour()) {
            if (checkInterval) {
              clearInterval(checkInterval);
              checkInterval = null;
            }
          }
        }, 200);
        
        // Fallback: clear interval after max time
        setTimeout(() => {
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
        }, maxRetries * 200 + 500);
      }, initialDelay);

      return () => {
        clearTimeout(timer);
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      };
    } else {
      hasInitializedRef.current = true;
    }
  }, [user, loadingUser, location.pathname, navigate]);

  // Removed automatic navigation on stepIndex change
  // Navigation is now handled in the callback when step changes

  const handleJoyrideCallback = (data) => {
    const { status, index, action, type } = data;

    // Track current step for navigation purposes
    setStepIndex(index);

    // Handle step BEFORE it's shown - navigate early so UI can settle
    if (type === 'step:before') {
      const upcomingStep = steps[index];
      if (upcomingStep?.route) {
        const currentRoute = location.pathname;
        const targetRoute = upcomingStep.route;
        
        // Only navigate if we're not already on the target route
        if (!currentRoute.includes(targetRoute.split('/')[1])) {
          // Clear any pending navigation
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
          }
          
          // Navigate immediately so UI can settle before step is shown
          navigate(targetRoute);
          
          // Check if this is a tab change (causes UI to shift)
          const isTabChange = !targetRoute.includes('/studio/');
          
          if (isTabChange) {
            // For tab changes, wait for UI to settle, then trigger reposition
            navigationTimeoutRef.current = setTimeout(() => {
              // Multiple resize events to ensure Joyride recalculates
              window.dispatchEvent(new Event('resize'));
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                // Force a reflow to ensure DOM is updated
                const targetElement = document.querySelector(upcomingStep.target);
                if (targetElement) {
                  // Trigger multiple reflows to ensure position is stable
                  void targetElement.offsetHeight;
                  setTimeout(() => {
                    void targetElement.offsetHeight;
                    window.dispatchEvent(new Event('resize'));
                  }, 100);
                }
              }, 200);
            }, 500);
          }
        }
      }
    }

    // Handle step after it's shown - ensure proper positioning for tab changes
    if (type === 'step:after') {
      const currentStep = steps[index];
      if (currentStep?.route) {
        const isTabChange = !currentStep.route.includes('/studio/');
        if (isTabChange) {
          // Additional reposition after step is shown to fix any misalignment
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            const targetElement = document.querySelector(currentStep.target);
            if (targetElement) {
              void targetElement.offsetHeight;
            }
          }, 300);
        }
      }
    }

    // Handle going back
    if (type === 'step:after' && action === 'prev') {
      const currentStep = steps[index];
      if (currentStep?.route) {
        const currentRoute = location.pathname;
        const targetRoute = currentStep.route;
        
        if (!currentRoute.includes(targetRoute.split('/')[1])) {
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
          }
          
          navigationTimeoutRef.current = setTimeout(() => {
            navigate(targetRoute);
          }, 300);
        }
      }
    }

    // Handle completion - only close on finished or skipped
    if (status === 'finished' || status === 'skipped') {
      localStorage.setItem('colorist-walkthrough-completed', 'true');
      setRun(false);
      setStepIndex(0);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableOverlayClose={false}
      disableScrolling={false}
      scrollToFirstStep={true}
      spotlightClicks={false}
      disableScrollParentFix={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#ea3663',
          textColor: '#1e293b',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#fff4f2',
          backgroundColor: '#fff4f2',
          beaconSize: 36,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#ea3663',
          fontSize: 14,
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: 6,
        },
        buttonBack: {
          color: '#ea3663',
          fontSize: 14,
          marginRight: 10,
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: 14,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  );
};

export default JoyrideWalkthrough;

