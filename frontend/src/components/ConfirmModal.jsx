import Modal from './Modal';

export default function ConfirmModal({ isOpen, onClose, title, message, onConfirm, isDangerous = false }) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-text-secondary mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className={isDangerous ? 'btn-danger' : 'btn-primary'}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
