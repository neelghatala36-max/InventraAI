import User from '../modules/user/user.model';

export const ensureDemoUsers = async () => {
  try {
    const demoUsers = [
      {
        name: 'Neel',
        email: 'neelghantala@gmail.com',
        password: 'Neel123',
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        name: 'Demo Visitor',
        email: 'test-visitor@gmail.com',
        password: 'pass123',
        role: 'USER',
        status: 'ACTIVE'
      }
    ];

    for (const demo of demoUsers) {
      const existing = await User.findOne({ email: demo.email.toLowerCase() });
      if (!existing) {
        await User.create(demo);
        console.log(`✅ Initialized demo user: ${demo.email}`);
      }
    }
  } catch (error) {
    console.error('⚠️ Note: Could not auto-verify demo users:', error);
  }
};
