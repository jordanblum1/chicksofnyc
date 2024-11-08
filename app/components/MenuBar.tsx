import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const drawerWidth = 240;
const navItems = [
  {name: 'Home', link: '/'}, 
  {name: 'Rankings', link: '/rankings'},
  {name: 'About', link: '/about'},
  {name: 'Submit a Spot', link: '/submit'}
];

export default function MenuBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const handleScroll = () => {
        const position = window.pageYOffset;
        setIsScrolled(position > 0);
    };

    React.useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const drawer = (
        <Box onClick={() => setIsOpen(false)} className="mobile-drawer">
            <div className="drawer-logo">
                <Image
                    src="/chicks-of-nyc-logo.png"
                    alt="Logo"
                    width={100}
                    height={100}
                    className="logo-image"
                />
            </div>
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.name} disablePadding>
                        <ListItemButton className="drawer-item">
                            <Link href={item.link}><ListItemText primary={item.name} /></Link>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar component="nav" className={`navbar fixed ${isScrolled ? 'scrolled' : ''}`}>
                <Toolbar className="navbar-content">
                    <div className="navbar-logo">
                        <Link href="/">
                            <Image
                                src="/chicks-of-nyc-logo.png"
                                alt="NYC Chicks Logo"
                                width={50}
                                height={50}
                                className="logo-image"
                            />
                        </Link>
                    </div>
                    
                    <div className="desktop-menu">
                        <Link href="/" className="nav-button">
                            Home
                        </Link>
                        <Link href="/rankings" className="nav-button">
                            Rankings
                        </Link>
                        <Link href="/about" className="nav-button">
                            About
                        </Link>
                        <Link href="/submit" className="nav-button">
                            Submit a Wing Spot
                        </Link>
                    </div>

                    <IconButton
                        className="mobile-menu-button"
                        onClick={() => setIsOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <nav>
                <Drawer
                    anchor="right"
                    open={isOpen}
                    onClose={() => setIsOpen(false)}
                >
                    {drawer}
                </Drawer>
            </nav>
        </Box>
    );
}
