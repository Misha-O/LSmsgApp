const users = [];

// join user to chat
function userJoin(id, username, chatRoom) {
  const user = { id, username, chatRoom };

  users.push(user);

  return user;
}

//get current user, pick up the one which matches id that passed in
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

// user leaves chat. Remove user from array
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  //   to check that it returns smth
  if (index !== -1) {
    //   return array without that user
    return users.splice(index, 1)[0]; // return that array without that user, removing one elem, which is index and instead of array returning user[0]
  }
}

// get chatRoom users

function getChatRoomUsers(chatRoom) {
  return users.filter((user) => user.chatRoom === chatRoom);
}

module.exports = { userJoin, getCurrentUser, userLeave, getChatRoomUsers };
