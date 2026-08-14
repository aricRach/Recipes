// Development environment template. Copy this file to environment.development.ts and
// paste your Firebase Web App config and Cloudinary values in — see SETUP.md.
export const environment = {
  production: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
  cloudinary: {
    cloudName: '',
    uploadPreset: '',
  },
  // Emails of accounts allowed to edit/delete any recipe, not just their own — see SETUP.md.
  adminEmails: [],
};
