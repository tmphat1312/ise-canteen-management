import axiosClient from "../utils/axios";

/**
 * Logs in a user with the provided email and password.
 * @param {Object} credentials - The user's login credentials.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's password.
 * @returns {Promise<Object>} - A promise that resolves to the login response data.
 */
export async function login({ email, password }) {
  const { data } = await axiosClient.post("auth/login", {
    email,
    password,
  });

  return data;
}

/**
 * Logs out the user by making a POST request to the "auth/logout" endpoint.
 * @returns {Promise<void>} A promise that resolves when the logout request is complete.
 */
export async function logout() {
  await axiosClient.post("auth/logout");
}

/**
 * Sign up a user.
 *
 * @param {Object} user - The user object containing username, password, email, and name.
 * @param {string} user.username - The username of the user.
 * @param {string} user.password - The password of the user.
 * @param {string} user.email - The email of the user.
 * @param {string} user.name - The name of the user.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
export async function signup({ username, password, email, name }) {
  const { data } = await axiosClient.post("auth/signup", {
    username,
    password,
    email,
    name,
  });

  return data;
}

/**
 * Retrieves the current user from the server.
 * @returns {Promise<Object>} The current user object.
 */
export async function getCurrentUser() {
  const { data } = await axiosClient.get("auth/me");

  return data.data;
}

/**
 * Updates the current user's information.
 * @param {Object} options - The options for updating the user.
 * @param {string} options.name - The new name of the user.
 * @param {string} options.phone - The new phone number of the user.
 * @param {File} options.image - The new image of the user (optional).
 * @returns {Promise<Object>} - A promise that resolves to the updated user data.
 */
export async function updateCurrentUser({ name, phone, image }) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("phone", phone);
  image && formData.append("image", image);

  const { data } = await axiosClient.patch("auth/me", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.data;
}

/**
 * Updates the user's password.
 * @param {Object} params - The parameters for updating the password.
 * @param {string} params.oldPassword - The user's current password.
 * @param {string} params.newPassword - The new password to be set.
 * @param {string} params.newPasswordConfirm - The confirmation of the new password.
 * @returns {Promise<any>} - A promise that resolves to the updated password data.
 */
export async function updatePassword({
  oldPassword,
  newPassword,
  newPasswordConfirm,
}) {
  const { data } = await axiosClient.patch("auth/update-password", {
    oldPassword,
    newPassword,
    newPasswordConfirm,
    password: oldPassword,
    passwordConfirm: newPasswordConfirm,
  });

  return data.data;
}
