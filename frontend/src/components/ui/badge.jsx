import { cva } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-800 border border-blue-200',
        success: 'bg-green-100 text-green-800 border border-green-200',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        danger: 'bg-red-100 text-red-800 border border-red-200',
        info: 'bg-gray-100 text-gray-800 border border-gray-200',
        outline: 'bg-transparent border border-gray-300 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ variant, className = '', children, ...props }) {
  return (
    <span className={badgeVariants({ variant, className })} {...props}>
      {children}
    </span>
  );
}
