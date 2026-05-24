export default function Button(props) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    onClick,
    type = 'button',
    className = ''
  } = props;

  let classes = 'font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed';

  if (variant === 'primary') {
    classes += ' bg-purple-600 hover:bg-purple-700 text-white';
  } else if (variant === 'secondary') {
    classes += ' bg-gray-600 hover:bg-gray-700 text-white';
  } else if (variant === 'danger') {
    classes += ' bg-red-600 hover:bg-red-700 text-white';
  } else if (variant === 'success') {
    classes += ' bg-green-600 hover:bg-green-700 text-white';
  } else if (variant === 'outline') {
    classes += ' border-2 border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white';
  }

  if (size === 'sm') {
    classes += ' px-3 py-1.5 text-sm';
  } else if (size === 'lg') {
    classes += ' px-8 py-4 text-lg';
  } else {
    classes += ' px-6 py-3';
  }

  if (fullWidth) {
    classes += ' w-full';
  }

  if (className) {
    classes += ' ' + className;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}