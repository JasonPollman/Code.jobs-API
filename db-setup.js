db.dropUser('pollman');
db.dropUser('sergey');
db.dropUser('code-jobs-api');

db.createUser({
  user: 'pollman',
  pwd: '00119518',
  roles: [
    {
      role: 'userAdminAnyDatabase',
      db: 'admin',
    },
    {
      role: 'readWriteAnyDatabase',
      db: 'admin',
    },
    {
      role: 'dbOwner',
      db: 'code-jobs-api',
    },
  ],
});

db.createUser({
  user: 'sergey',
  pwd: 'password',
  roles: [
    {
      role: 'userAdminAnyDatabase',
      db: 'admin',
    },
    {
      role: 'readWriteAnyDatabase',
      db: 'admin',
    },
    {
      role: 'dbOwner',
      db: 'code-jobs-api',
    },
  ],
});

db.createUser({
  user: 'code-jobs-api',
  pwd: 'iNHkO33F1n7BeL',
  roles: [
    {
      role: 'readWrite',
      db: 'code-jobs-api',
    },
  ],
});



const codeJobs = db.getSiblingDB('code-jobs-api');

codeJobs.users.remove({});
codeJobs.users.insertMany([
  {
    username: 'pollman',
    password: '4f7997c079b41285409969b299121eab7add861990f477e77d0756934eeccde4',
    name: {
      first: 'jason',
      last: 'pollman',
    },
    group: 'admin',
  },
  {
    username: 'sergey',
    password: '52c254c62c79212a8a9b15908dab9881c08c79b819c2009bd9f983578b905fca',
    name: {
      first: 'sergey',
      last: 'arkaelov',
    },
    group: 'admin',
  },
], (err) => {
  console.log(error);
});
