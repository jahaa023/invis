import { useState, type ChangeEvent, type FormEvent } from 'react';

const authURL = import.meta.env.VITE_AUTH_URL;

// Define formdata type
interface FormData {
    username: string;
    password: string;
}

export default function LoginPage() {
    // Define states
    const [error, setError] = useState("")
    const [formData, setFormData] = useState<FormData>({ username: '', password: '' });

    // Updates formdata on input
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // When form is submitted, do a post request to auth server
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await fetch(`${authURL}/login`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: "include"
            });

            const res_json = await response.json()

            if (response.ok) {
                window.location.href = "/chats"
            } else {
                const error = res_json.error.message
                setError(error)
            }
        } catch (error) {
            console.error(error)
            setError('Something went wrong.');
        }
    };

    function homeRedirect() {
        window.location.href = "/home"
    }

    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <form className="w-fit h-fit flex flex-col items-center gap-3 text-center" onSubmit={handleSubmit}>
                <img src="/favicon.svg" alt="Invis Planet Logo" className="w-12 cursor-pointer" onClick={homeRedirect} />
                {error && <p className="text-warning-red">{error}</p>}
                <h1 className="font-medium text-3xl">Log in</h1>
                <input 
                type="text"
                placeholder="Username"
                className="p-2 w-[calc(100%-0.5rem)] border-1 border-text-light rounded-md font-light"
                onChange={handleChange}
                required
                name='username'
                min={5}
                max={20}
                />
                <input 
                type="password"
                placeholder="Password"
                className="p-2 w-[calc(100%-0.5rem)] border-1 border-text-light rounded-md font-light"
                onChange={handleChange}
                required
                name='password'
                min={8}
                />
                <button
                    type='submit'
                    className="px-2 w-[calc(100%-0.5rem)] py-1.5 rounded-[8px] cursor-pointer bg-[radial-gradient(circle_at_center,_#0000_20.55%,_var(--color-brand)_94.17%)] bg-brand transition-all duration-200 ease-in hover:bg-brand-alt hover:font-bold"
                    title="Log in"
                >
                    Log in
                </button>
                <p>Dont have an account? <a href="/register">Create account.</a></p>
            </form>
        </div>
    )
}