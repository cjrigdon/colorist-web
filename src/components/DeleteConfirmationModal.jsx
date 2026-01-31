import React from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, itemType = 'item' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-slate-800 font-venti mb-2">
          Delete {itemType}?
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#dc2626' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#b91c1c')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;

