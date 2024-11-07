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

const drawerWidth = 240;
const navItems = [{name: 'Home', link: '/'}, {name: 'About', link: '/about'}];

export default function MenuBar() {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [scrollPosition, setScrollPosition] = React.useState(0);

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

    const handleScroll = () => {
        const position = window.pageYOffset;
        setScrollPosition(position);
    };

    React.useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const drawer = (
        <Box onClick={handleDrawerToggle} className="mobile-drawer">
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
            <AppBar component="nav" className={`navbar ${scrollPosition > 0 ? 'scrolled' : ''}`}>
                <Toolbar className="navbar-content">
                    <div className="navbar-logo">
                        <Link href="/">
                            <Image
                                src="/chicks-of-nyc-logo.png"
                                alt="Logo"
                                width={50}
                                height={50}
                                className="logo-image"
                            />
                        </Link>
                    </div>
                    
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        className="mobile-menu-button"
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box className="desktop-menu">
                        {navItems.map((item) => (
                            <Link key={item.name} href={item.link}>
                                <Button className="nav-button">{item.name}</Button>
                            </Link>
                        ))}
                    </Box>
                </Toolbar>
            </AppBar>
            <nav>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    className="mobile-drawer-container"
                >
                    {drawer}
                </Drawer>
            </nav>
        </Box>
    );
}
