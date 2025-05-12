import { useState, type ChangeEvent, type FormEvent } from 'react';

const authURL = import.meta.env.VITE_AUTH_URL;

// Define formdata type
interface FormData {
    username: string;
    password: string;
}

export default function RegisterPage() {
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
            const response = await fetch(`${authURL}/register`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const res_json = await response.json()

            if (response.ok) {
                console.log("Success")
                // window.location.href = "/main"
            } else {
                if (response.status == 400 && res_json.error.code == "VALIDATOR_ERROR") {
                    const error = res_json.error.errors[0].msg
                    setError(error)
                } else {
                    const error = res_json.error.message
                    setError(error)
                }
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
            <form className="w-fit h-fit flex flex-col items-center gap-3 text-center max-h-[80vh] overflow-y-scroll" onSubmit={handleSubmit}>
                <img src="/favicon.svg" alt="Invis Planet Logo" className="w-12 cursor-pointer" onClick={homeRedirect} />
                {error && <p className="text-warning-red">{error}</p>}
                <h1 className="font-medium text-3xl">Create an account</h1>
                <input 
                type="text"
                placeholder="Username"
                name='username'
                className="p-2 w-[calc(100%-0.5rem)] border-1 border-text-light rounded-md font-light"
                value={formData.username}
                onChange={handleChange}
                min={5}
                max={20}
                required
                />
                <input 
                type="password"
                placeholder="Password"
                name='password'
                className="p-2 w-[calc(100%-0.5rem)] border-1 border-text-light rounded-md font-light"
                value={formData.password}
                onChange={handleChange}
                min={8}
                required
                />
                <button
                    type='submit'
                    className="px-2 w-[calc(100%-0.5rem)] py-1.5 rounded-[8px] cursor-pointer bg-[radial-gradient(circle_at_center,_#0000_20.55%,_var(--color-brand)_94.17%)] bg-brand transition-all duration-200 ease-in hover:bg-brand-alt hover:font-bold"
                    title="Create account"
                >
                    Create account
                </button>
                <p>Already have an account? <a href="/login">Log in.</a></p>
            </form>
        </div>
    )
}