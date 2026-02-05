let activeUser = null;

export const getActiveUser = () => activeUser;
export const setActiveUser = (user) => {
  activeUser = user;
};
