import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { isAuthenticated, removeAuthToken, sharedColorsAPI } from '../services/api';
import { getPaletteHexes } from '../utils/colorUtils';
import { setPostAuthRedirect } from '../utils/postAuthRedirect';

const TYPE_INFO = {
  combo: { label: 'Color Combo', singular: 'combo', plural: 'combos', editPath: (id) => `/edit/color-combo/${id}` },
  palette: { label: 'Color Palette', singular: 'palette', plural: 'palettes', editPath: (id) => `/edit/color-palette/${id}` },
};

const itemKey = (item) => `${item.type}:${item.id}`;

const primaryButtonClass =
  'inline-flex items-center justify-center px-5 py-3 text-white rounded-lg text-sm font-medium bg-[#ea3663] hover:bg-[#d12a4f] transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButtonClass =
  'inline-flex items-center justify-center px-5 py-3 text-slate-700 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors min-h-[48px]';
const smallPrimaryClass =
  'px-3 py-1.5 text-white rounded-lg text-xs font-medium bg-[#ea3663] hover:bg-[#d12a4f] transition-colors disabled:opacity-50 whitespace-nowrap';
const smallSecondaryClass =
  'px-3 py-1.5 text-slate-700 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors whitespace-nowrap';

const ComboPreview = ({ pencils }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {pencils.map((pencil) => (
      <div key={pencil.id} className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 flex-shrink-0 rounded-lg shadow-sm border border-slate-200" style={{ backgroundColor: pencil.color?.hex }} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {pencil.set?.brand} {pencil.set?.name}
          </p>
          <p className="text-xs text-slate-500 font-mono truncate">
            {pencil.color_name}{pencil.color_number ? ` (${pencil.color_number})` : ''}
          </p>
        </div>
      </div>
    ))}
  </div>
);

const PalettePreview = ({ palette }) => {
  const hexes = getPaletteHexes(palette);
  const namesByHex = Object.fromEntries((palette.colors || []).map((color) => [color.hex, color.name]));

  return (
    <div>
      <div className="flex h-24 rounded-lg overflow-hidden border border-slate-200 mb-4">
        {hexes.map((hex, index) => (
          <div key={`${hex}-${index}`} className="flex-1" style={{ backgroundColor: hex }} title={hex} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {hexes.map((hex, index) => (
          <div key={`${hex}-label-${index}`} className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded border border-slate-200 flex-shrink-0" style={{ backgroundColor: hex }} />
            <div className="min-w-0">
              <p className="text-xs font-mono text-slate-700 uppercase">{hex}</p>
              {namesByHex[hex] && <p className="text-xs text-slate-500 truncate">{namesByHex[hex]}</p>}
            </div>
          </div>
        ))}
      </div>
      {palette.base_color && <p className="mt-4 text-xs text-slate-500">Based on {palette.base_color}</p>}
    </div>
  );
};

const describeLink = (items) => {
  const types = new Set(items.map((item) => item.type));
  if (types.size === 1) {
    const info = TYPE_INFO[items[0].type];
    return `${items.length} color ${info.plural}`;
  }
  return `${items.length} color combos & palettes`;
};

const SharedLink = () => {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [signedIn, setSignedIn] = useState(isAuthenticated());
  // Saved copy ids keyed by "type:id"
  const [savedIds, setSavedIds] = useState({});
  // "all" or an item key while a save is in flight
  const [savingKey, setSavingKey] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setLoading(true);
    sharedColorsAPI.get(token)
      .then((data) => {
        setLink(data);
        setSavedIds(Object.fromEntries(data.items.filter((item) => item.saved_id).map((item) => [itemKey(item), item.saved_id])));
      })
      .catch((err) => setLoadError(err.status === 404 ? 'not_found' : (err.message || 'Something went wrong')))
      .finally(() => setLoading(false));
  }, [token]);

  const items = link?.items || [];
  const isSingle = items.length === 1;
  const unsavedItems = items.filter((item) => !savedIds[itemKey(item)]);

  const goToAuth = (path) => {
    setPostAuthRedirect(location.pathname);
    navigate(path);
  };

  const save = async (targets, key) => {
    setSavingKey(key);
    setSaveError(null);
    setNotice(null);
    try {
      const result = await sharedColorsAPI.save(token, targets.map((item) => ({ type: item.type, id: item.id })));
      setSavedIds((prev) => ({
        ...prev,
        ...Object.fromEntries(result.items.map((item) => [itemKey(item), item.saved_id])),
      }));
      setNotice(targets.length === 1 ? `Added “${targets[0].title}” to your studio.` : `Added ${targets.length} items to your studio.`);
    } catch (err) {
      if (err.status === 401) {
        // Stored session has expired; ask them to sign in again
        removeAuthToken();
        setSignedIn(false);
        setSaveError({ message: 'Your session has expired. Sign in to add these to your studio.' });
      } else {
        setSaveError({ message: err.message || 'Could not add to your studio', upgrade: err.status === 403 });
      }
    } finally {
      setSavingKey(null);
    }
  };

  // Per-item control shown in each item's header when the link has several items
  const renderItemAction = (item) => {
    if (isSingle || link.is_owner || !signedIn) return null;
    const savedId = savedIds[itemKey(item)];
    if (savedId) {
      return (
        <Link to={TYPE_INFO[item.type].editPath(savedId)} className={smallSecondaryClass}>
          ✓ Added · Open
        </Link>
      );
    }
    return (
      <button type="button" onClick={() => save([item], itemKey(item))} disabled={savingKey !== null} className={smallPrimaryClass}>
        {savingKey === itemKey(item) ? 'Adding...' : 'Add'}
      </button>
    );
  };

  const renderFooter = () => {
    if (link.is_owner) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-600 flex-1">You shared {isSingle ? 'this' : 'these'}. Copy this page's link to send it to others.</p>
          <Link to="/studio/overview" className={secondaryButtonClass}>Go to my studio</Link>
        </div>
      );
    }

    if (!signedIn) {
      return (
        <div>
          <p className="text-sm text-slate-600 mb-4">
            Sign in or create a free Colorist account to add {isSingle ? `this ${TYPE_INFO[items[0].type].singular}` : 'these'} to your studio. You'll come right back here.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => goToAuth('/')} className={primaryButtonClass}>Sign in to add</button>
            <button type="button" onClick={() => goToAuth('/register')} className={secondaryButtonClass}>Create free account</button>
          </div>
        </div>
      );
    }

    if (unsavedItems.length === 0) {
      const only = isSingle ? items[0] : null;
      return (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-green-700 flex-1">
            {isSingle ? `This ${TYPE_INFO[only.type].singular} is in your studio.` : 'Everything here is in your studio.'}
          </p>
          {only ? (
            <Link to={TYPE_INFO[only.type].editPath(savedIds[itemKey(only)])} className={primaryButtonClass}>Open in my studio</Link>
          ) : (
            <Link to="/studio/overview" className={primaryButtonClass}>Go to my studio</Link>
          )}
        </div>
      );
    }

    const allLabel = isSingle
      ? 'Add to My Studio'
      : unsavedItems.length === items.length
        ? `Add all ${items.length} to My Studio`
        : `Add remaining ${unsavedItems.length}`;

    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-600 flex-1">
          {isSingle ? 'Save a copy to your studio so you can use and edit it.' : 'Add them all at once, or pick individual ones above.'}
        </p>
        <button type="button" onClick={() => save(unsavedItems, 'all')} disabled={savingKey !== null} className={primaryButtonClass}>
          {savingKey === 'all' ? 'Adding...' : allLabel}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Link to={signedIn ? '/studio/overview' : '/'} className="flex items-center gap-3">
            <img src="/logo300.png" alt="Colorist" className="h-12 w-12" />
            <span className="text-2xl font-bold text-slate-800 font-venti">Colorist</span>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea3663]" />
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        ) : loadError ? (
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-800 font-venti mb-2">
              {loadError === 'not_found' ? 'This link is no longer available' : 'Something went wrong'}
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              {loadError === 'not_found' ? 'What was shared here has been deleted.' : loadError}
            </p>
            <Link to={signedIn ? '/studio/overview' : '/'} className={primaryButtonClass}>
              {signedIn ? 'Go to my studio' : 'Go to Colorist'}
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#ea3663] mb-1">
                {isSingle ? TYPE_INFO[items[0].type].label : 'Shared Collection'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 font-venti">
                {isSingle ? items[0].title : describeLink(items)}
              </h1>
              {link.shared_by && <p className="text-sm text-slate-500 mt-1">Shared by {link.shared_by}</p>}

              <div className="mt-6 space-y-6">
                {items.map((item) => (
                  <section key={itemKey(item)} className={isSingle ? '' : 'border border-slate-200 rounded-xl p-5'}>
                    {!isSingle && (
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{TYPE_INFO[item.type].label}</p>
                          <h2 className="text-lg font-semibold text-slate-800 font-venti truncate">{item.title}</h2>
                        </div>
                        {renderItemAction(item)}
                      </div>
                    )}
                    {item.type === 'combo' ? <ComboPreview pencils={item.pencils || []} /> : <PalettePreview palette={item} />}
                  </section>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-6 sm:p-8">
              {renderFooter()}
              {notice && !saveError && <p className="mt-4 text-sm text-green-700">{notice}</p>}
              {saveError && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                  {saveError.message}
                  {saveError.upgrade && (
                    <Link to="/subscription" className="ml-2 font-medium underline">Upgrade to Premium</Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedLink;
