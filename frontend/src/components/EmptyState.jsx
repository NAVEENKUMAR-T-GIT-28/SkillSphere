export default function EmptyState({ icon: Icon, message, cta = null, onCtaClick = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <Icon size={48} className="text-text-muted mb-4 opacity-50" />
      )}
      <p className="text-lg font-medium text-text-primary mb-2">{message}</p>
      {cta && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="btn-primary mt-4"
        >
          {cta}
        </button>
      )}
    </div>
  );
}
