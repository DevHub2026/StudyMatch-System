/**
 * CARD COMPONENT
 * 
 * Reusable card component used throughout the app
 * Provides consistent styling for content containers
 * 
 * Props:
 * - children: Content inside the card
 * - className: Additional CSS classes (optional)
 * - hover: Enable hover effect (optional, default: false)
 * - onClick: Click handler (optional)
 */

export default function Card({ children, className = '', hover = false, onClick }) {
  // Base styles that apply to all cards
  const baseStyles = 'bg-[#1a1d2e] rounded-xl p-6 border border-gray-700';
  
  // Hover styles (only applied if hover prop is true)
  const hoverStyles = hover ? 'hover:border-purple-500 transition cursor-pointer' : '';
  
  // Combine all classes
  const cardClasses = `${baseStyles} ${hoverStyles} ${className}`;
  
  return (
    <div
      onClick={onClick}
      className={cardClasses}
    >
      {children}
    </div>
  );
}