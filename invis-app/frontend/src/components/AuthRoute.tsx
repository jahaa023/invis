// Redirects if user is not authenticated
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { checkSession } from '../utils/auth';

type Props = {
    children: React.ReactNode;
};

const AuthRoute = ({ children }: Props) => {
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const validate = async () => {
            const valid = await checkSession();
            setIsAuthenticated(valid);
            setAuthChecked(true);
        };

        validate();
    }, []);

    if (!authChecked) {
        return <p>Loading...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default AuthRoute;
