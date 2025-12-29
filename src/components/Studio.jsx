import React, { useState } from 'react';
import Library from './Library';
import PencilInventory from './PencilInventory';
import ColorCombos from './ColorCombos';
import ColorPalettes from './ColorPalettes';
import ColoringBooks from './ColoringBooks';

const Studio = ({ activeSection = 'library' }) => {
  const sections = [
    { id: 'library', label: 'Inspiration', icon: '📚' },
    { id: 'pencils', label: 'Pencils', icon: '✏️' },
    { id: 'combos', label: 'Combos', icon: '🎨' },
    { id: 'palettes', label: 'Palettes', icon: '🌈' },
    { id: 'books', label: 'Books', icon: '📖' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'library':
        return <Library />;
      case 'pencils':
        return <PencilInventory />;
      case 'combos':
        return <ColorCombos />;
      case 'palettes':
        return <ColorPalettes />;
      case 'books':
        return <ColoringBooks />;
      default:
        return <Library />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Content */}
      <div>{renderContent()}</div>
    </div>
  );
};

export default Studio;

