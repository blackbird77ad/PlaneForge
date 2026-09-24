import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';

const adminAccounts = [
  {
    name: 'Evans Honu',
    email: 'planeforge1@gmail.com',
    dateOfBirth: new Date('1998-10-28T00:00:00.000Z')
  },
  {
    name: 'Evans Honu',
    email: 'evans@planeforge.org',
    dateOfBirth: new Date('1998-10-28T00:00:00.000Z')
  }
];

await connectDb();

const passwordHash = await User.hashPassword('Planeforge@26');

for (const account of adminAccounts) {
  await User.updateOne(
    { email: account.email },
    {
      $set: {
        name: account.name,
        email: account.email,
        dateOfBirth: account.dateOfBirth,
        role: 'admin',
        status: 'active',
        title: 'Platform Administrator',
        passwordHash
      }
    },
    { upsert: true }
  );
}

console.log(`PlaneForge admin bootstrap complete for ${adminAccounts.length} account(s).`);

process.exit(0);
