const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function main() {
  const filePath = path.resolve(__dirname, '../firebase-mock.json');
  if (!fs.existsSync(filePath)) {
    console.error('firebase-mock.json not found');
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  const adminEmail = 'hellobazaar.com';
  const adminPassword = 'Raj@1008';

  // Ensure super admin exists
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(adminPassword, salt);

  const emailsToUpdate = ['hellobazaar.com', 'admin@hellobazaar.com', 'yuku8434023311@gmail.com'];
  for (const em of emailsToUpdate) {
    const idx = data.users.findIndex(u => u.email.toLowerCase() === em.toLowerCase());
    if (idx !== -1) {
      data.users[idx].password = hash;
      data.users[idx].role = 'ADMIN';
    } else {
      data.users.push({
        id: em.replace(/[^a-zA-Z0-9]/g, '_'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        email: em,
        password: hash,
        fullName: 'Hello Bazaar Super Admin',
        role: 'ADMIN',
      });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully updated admin users with password "${adminPassword}"`);
}

main().catch(err => {
  console.error('Error updating admin:', err);
});
