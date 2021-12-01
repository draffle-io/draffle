const adminNs = '/admin_panel';

const adminRoutes = {
  HOME: `${adminNs}/`,
  RAFFLES: `${adminNs}/raffles`,
};

const routes = {
  HOME: '/',
  RAFFLES: '/raffles',
  STAKE: '/stake',
  TOOLS: '/tools',
  ADMIN: adminRoutes,
};

export { routes };
