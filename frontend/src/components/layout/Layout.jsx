import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div style={styles.layoutContainer}>
      <Sidebar />
      <Header />
      <main style={styles.mainContent}>
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const styles = {
  layoutContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-main)',
  },
  mainContent: {
    flex: 1,
    marginLeft: 'var(--sidebar-width)',
    marginTop: 'var(--header-height)',
    minHeight: 'calc(100vh - var(--header-height))',
    paddingBottom: '3rem',
  },
};
