export const AuthEngine = {
  getCurrentProfile(){ return JSON.parse(localStorage.getItem('rjp_profile') || '{"name":"Rui","role":"admin"}'); },
  setCurrentProfile(profile){ localStorage.setItem('rjp_profile', JSON.stringify(profile)); }
};
