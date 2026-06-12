import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children }) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
      
      <div className={`fixed top-0 right-0 h-screen w-full max-w-2xl bg-surface shadow-xl z-50 transform transition-transform duration-300 overflow-y-auto ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-surface">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </>
  );
}
