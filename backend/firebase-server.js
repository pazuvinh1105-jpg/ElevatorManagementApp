require('dotenv').config();

const { app } = require('./functions/index');

const port = Number(process.env.PORT || 3000);

app.listen(port, '0.0.0.0', () => {
  const project =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    'project trong service account';
  console.log(`Firebase-backed API: http://0.0.0.0:${port}`);
  console.log(`Firebase project: ${project}`);
});
