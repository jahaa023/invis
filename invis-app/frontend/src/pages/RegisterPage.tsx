import { useState, type ChangeEvent, type FormEvent } from 'react';

const authURL = import.meta.env.VITE_AUTH_URL;

// Define formdata type
interface FormData {
    username: string;
    password: string;
}

interface usernameValidation {
    chars: boolean;
    whitespace: boolean;
    ascii: boolean;
    taken: boolean;
}

export default function RegisterPage() {
    // Define states
    const [error, setError] = useState("")
    const [formData, setFormData] = useState<FormData>({ username: '', password: '' });
    // focus for username validator
    const [isFocused, setIsFocused] = useState(false);
    const [usernameValidationError, setUsernameValidationError] = useState(false);
    const [usernameValidation, setUsernameValidation] = useState<usernameValidation>({chars: true, whitespace: false, ascii: false, taken: false })

    const handleOnFocus = () => {
        setIsFocused(true);
        console.log(isFocused)
    };

    const handleBlur = () => {
        setIsFocused(false);
        console.log(isFocused)
    };

    // Updates formdata on input
    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name == 'username') {
            // Do live username validation
            const response = await fetch(`${authURL}/validate-username`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: value
                })
            })

            const response_json = await response.json()

            if (response.ok) {
                setUsernameValidation({
                    chars: response_json.chars,
                    whitespace: response_json.whitespace,
                    ascii: response_json.ascii,
                    taken: response_json.taken
                });
                console.log(usernameValidation)
            } else {
                setUsernameValidationError(true)
            }
        }
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
                credentials: 'include'
            });

            const res_json = await response.json()

            if (response.ok) {
                window.location.href = "/chats"
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
            <form className="w-100 h-fit p-8 bg-bg-black-lighter border-black-lighter-border border-[1px] rounded-2xl flex flex-col items-center gap-3 text-center max-h-[80vh] overflow-y-scroll" onSubmit={handleSubmit}>
                <img src="/favicon.svg" alt="Invis Planet Logo" className="w-12 cursor-pointer" onClick={homeRedirect} />
                {error && <p className="text-warning-red">{error}</p>}
                <h1 className="font-medium text-3xl">Create an account</h1>
                {/* Dummy fields to trick password managers */}
                <input type="text" style={{ display: 'none' }} />
                <input type="password" style={{ display: 'none' }} />
                
                <input 
                type="text"
                placeholder="Username"
                name='username'
                className="p-2 w-[calc(100%-0.5rem)] border-1 border-text-light rounded-md font-light"
                value={formData.username}
                onChange={handleChange}
                onFocus={handleOnFocus}
                onBlur={handleBlur}
                min={5}
                max={20}
                autoComplete='off'
                required
                />
                {isFocused && !usernameValidationError &&
                <div className='p-2 w-[calc(100%-0.5rem)] border-1 border-text-light rounded-md font-light text-left text-nowrap text-xs'>
                    {!usernameValidation.chars && <p className="text-positive-green">Must be between 5-20 characters.</p>}
                    {usernameValidation.chars && <p className="text-warning-red">Must be between 5-20 characters.</p>}
                    {!usernameValidation.whitespace && <p className="text-positive-green">Must not contains whitespace like spaces.</p>}
                    {usernameValidation.whitespace && <p className="text-warning-red">Must not contains whitespace like spaces.</p>}
                    {usernameValidation.ascii && <p className="text-positive-green">Must only contain ASCII characters</p>}
                    {!usernameValidation.ascii && <p className="text-warning-red">Must only contain ASCII characters</p>}
                    {!usernameValidation.taken && <p className="text-positive-green">Must not be taken</p>}
                    {usernameValidation.taken && <p className="text-warning-red">Must not be taken</p>}
                </div>
                }
                {usernameValidationError && isFocused && <div className='p-2 w-[calc(100%-0.5rem)] border-1 border-text-light rounded-md font-light text-left text-nowrap text-xs'>
                    <p className='text-warning-red'>Error validating username</p>
                </div>}
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