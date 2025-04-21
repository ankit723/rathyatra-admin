import Link from 'next/link';

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`bg-white border-t py-4 px-6 ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-slate-500">
        <div>
          <p>&copy; {currentYear} Admin Portal. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-primary hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-primary hover:underline">
            Privacy
          </Link>
          <Link href="/help" className="hover:text-primary hover:underline">
            Help
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 