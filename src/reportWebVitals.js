import * as Sentry from '@sentry/react';

const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Send web vitals to Sentry
import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
  onCLS((metric) => {
    Sentry.metrics.distribution('web_vitals.cls', metric.value, {
      unit: 'none',
      tags: { id: metric.id, name: metric.name },
    });
  });
  onFID((metric) => {
    Sentry.metrics.distribution('web_vitals.fid', metric.value, {
      unit: 'millisecond',
      tags: { id: metric.id, name: metric.name },
    });
  });
  onFCP((metric) => {
    Sentry.metrics.distribution('web_vitals.fcp', metric.value, {
      unit: 'millisecond',
      tags: { id: metric.id, name: metric.name },
    });
  });
  onLCP((metric) => {
    Sentry.metrics.distribution('web_vitals.lcp', metric.value, {
      unit: 'millisecond',
      tags: { id: metric.id, name: metric.name },
    });
  });
  onTTFB((metric) => {
    Sentry.metrics.distribution('web_vitals.ttfb', metric.value, {
      unit: 'millisecond',
      tags: { id: metric.id, name: metric.name },
    });
  });
});

export default reportWebVitals;
