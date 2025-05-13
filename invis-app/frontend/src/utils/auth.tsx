// Checks if user is authenticated on the auth server
export const checkSession = async (): Promise<boolean> => {
    const authURL = import.meta.env.VITE_AUTH_URL;

    // Check if user is logged in
    const response = await fetch(`${authURL}/validate-session`, {
        method: "GET",
        credentials: "include"
    });

    if (response.status != 200) {
        return false;
    } else {
        return true;
    }
};
