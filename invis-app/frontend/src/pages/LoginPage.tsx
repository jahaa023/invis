import { useState, type ChangeEvent } from 'react';
import dotenv from 'dotenv';

const authURL = `http://localhost:${process.env.AUTH_PORT}}`

export default function RegisterPage() {
    const [error, setError] = useState("")

    const [username, setUsername] = useState<any | null>(null);
    const onChangeUsername = (e: ChangeEvent) => {
        const element = e.currentTarget as HTMLInputElement
        setUsername(element.value)
    }

    const [password, setPassword] = useState<any | null>(null);
    const onChangePassword = (e: ChangeEvent) => {
        const element = e.currentTarget as HTMLInputElement
        setPassword(element.value)
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("Something went wrong.")
    }

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
                onChange={onChangeUsername}
                required
                />
                <input 
                type="password"
                placeholder="Password"
                className="p-2 w-[calc(100%-0.5rem)] border-1 border-text-light rounded-md font-light"
                onChange={onChangePassword}
                required
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