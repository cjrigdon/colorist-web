import React, { useState } from 'react';
import Library from './Library';
import PencilInventory from './PencilInventory';
import ColorCombos from './ColorCombos';
import ColorPalettes from './ColorPalettes';
import ColoringBooks from './ColoringBooks';
import AdSpace from './AdSpace';
import YouTubeImportBanner from './YouTubeImportBanner';

const Studio = ({ activeSection = 'library', user }) => {
  const sections = [
    { id: 'library', label: 'Inspiration', icon: '📚' },
    { id: 'pencils', label: 'Pencils', icon: '✏️' },
    { id: 'combos', label: 'Combos', icon: '🎨' },
    { id: 'palettes', label: 'Palettes', icon: '🌈' },
    { id: 'books', label: 'Books', icon: '📖' },
  ];

  const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;

  const renderContent = () => {
    switch (activeSection) {
      case 'library':
        return <Library user={user} />;
      case 'pencils':
        return <PencilInventory user={user} />;
      case 'combos':
        return <ColorCombos user={user} />;
      case 'palettes':
        return <ColorPalettes user={user} />;
      case 'books':
        return <ColoringBooks user={user} />;
      default:
        return <Library user={user} />;
    }
  };

  return (
    <div className="space-y-6">
      <YouTubeImportBanner />
      {/* Ad Space at Top for Free Plan */}
      {isFreePlan && (
        <div className="flex justify-center w-full">
          <AdSpace width={728} height={90} />
        </div>
      )}
      {/* Content */}
      <div>{renderContent()}</div>
    </div>
  );
};

export default Studio;

