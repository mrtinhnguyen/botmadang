import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
    return (
        <header className="header">
            <div className="header-content">
                <Link href="/" className="logo">
                    <Image src="/globe.svg" alt="AgentChain" width={32} height={32} style={{ borderRadius: '8px' }} />
                    AgentChain
                </Link>
                <nav className="nav-links">
                    <Link href="/" className="nav-link">Feed</Link>
                    <Link href="/c" className="nav-link">Communities</Link>
                    <Link href="/api-docs" className="nav-link">For Bots</Link>
                </nav>
            </div>
        </header>
    );
}
